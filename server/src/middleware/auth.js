const { supabase, isLiveSupabase } = require('../config/supabase');
const db = require('../services/db.service');
const { errorResponse } = require('../utils/apiResponse');

/**
 * Authentication Middleware
 * Validates Bearer token using Supabase Auth or Demonstration Session
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // In demo mode, if client provides X-Demo-Role header or fallback
      const demoRole = req.headers['x-demo-role'] || 'admin';
      const demoProfile = memoryProfileFallback(demoRole);
      req.user = demoProfile;
      return next();
    }

    const token = authHeader.split(' ')[1];

    // Demo token fast-path (used for 1-click demonstration accounts)
    if (token && token.startsWith('demo-')) {
      const role = token.includes('consumer') ? 'consumer' : 'admin';
      req.user = memoryProfileFallback(role);
      return next();
    }

    if (isLiveSupabase) {
      const { data: { user }, error } = await supabase.auth.getUser(token);
      if (error || !user) {
        return errorResponse(res, 'Invalid or expired authentication session', 401);
      }

      // Fetch profile role from database
      const profile = await db.getProfileById(user.id);
      req.user = {
        id: user.id,
        email: user.email,
        username: profile ? profile.username : user.email.split('@')[0],
        role: profile ? profile.role : 'consumer'
      };
      return next();
    }

    // Default fallback
    const role = token && token.includes('consumer') ? 'consumer' : 'admin';
    req.user = memoryProfileFallback(role);
    return next();
  } catch (err) {
    return errorResponse(res, 'Authentication verification failed: ' + err.message, 401);
  }
};

const memoryProfileFallback = (role = 'admin') => {
  if (role === 'consumer') {
    return {
      id: 'c0000000-0000-0000-0000-000000000001',
      username: 'johndoe',
      full_name: 'Johnathan Doe',
      role: 'consumer',
      email: 'john.doe@example.com'
    };
  }
  return {
    id: 'a0000000-0000-0000-0000-000000000001',
    username: 'admin',
    full_name: 'Chief Grid Administrator',
    role: 'admin',
    email: 'admin@electric.local'
  };
};

module.exports = {
  authenticate
};
