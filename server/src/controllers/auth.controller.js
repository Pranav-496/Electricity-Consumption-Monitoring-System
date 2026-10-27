const { supabase, isLiveSupabase } = require('../config/supabase');
const db = require('../services/db.service');
const { successResponse, errorResponse } = require('../utils/apiResponse');

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (isLiveSupabase) {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return errorResponse(res, error.message, 400);

      const profile = await db.getProfileById(data.user.id);
      return successResponse(res, {
        user: {
          id: data.user.id,
          email: data.user.email,
          username: profile ? profile.username : email.split('@')[0],
          full_name: profile ? profile.full_name : '',
          role: profile ? profile.role : 'consumer'
        },
        session: data.session
      }, 'Login successful');
    }

    // Demo Mode Authentication
    let user;
    if (email.includes('admin') || password.includes('Admin')) {
      user = {
        id: 'a0000000-0000-0000-0000-000000000001',
        email: 'admin@electric.local',
        username: 'admin',
        full_name: 'Chief Grid Administrator',
        role: 'admin'
      };
    } else {
      user = {
        id: 'c0000000-0000-0000-0000-000000000001',
        email: email,
        username: 'johndoe',
        full_name: 'Johnathan Doe',
        role: 'consumer'
      };
    }

    return successResponse(res, {
      user,
      session: {
        access_token: `demo-${user.role}-token`,
        token_type: 'bearer',
        expires_in: 3600
      }
    }, 'Demo login successful');
  } catch (err) {
    next(err);
  }
};

const register = async (req, res, next) => {
  try {
    const { email, password, username, full_name } = req.body;

    if (isLiveSupabase) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
            full_name: full_name || username
          }
        }
      });
      if (error) return errorResponse(res, error.message, 400);

      return successResponse(res, {
        user: {
          id: data.user.id,
          email: data.user.email,
          username,
          role: 'consumer'
        }
      }, 'Registration successful. Account created with consumer privileges.', 201);
    }

    // Demo Mode Registration
    const newUser = {
      id: `c0000000-0000-0000-0000-${Date.now().toString().slice(-12)}`,
      email,
      username,
      full_name: full_name || username,
      role: 'consumer'
    };

    return successResponse(res, { user: newUser }, 'Demo registration successful', 201);
  } catch (err) {
    next(err);
  }
};

const getMe = async (req, res, next) => {
  try {
    const user = req.user;
    let consumerProfile = null;

    if (user.role === 'consumer') {
      const consumers = await db.getConsumers({ consumer_user_id: user.id });
      if (consumers.length > 0) consumerProfile = consumers[0];
    }

    return successResponse(res, {
      ...user,
      consumer: consumerProfile
    });
  } catch (err) {
    next(err);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const { full_name } = req.body;
    const updated = await db.updateProfile(req.user.id, { full_name });
    return successResponse(res, updated, 'Profile updated successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  login,
  register,
  getMe,
  updateProfile
};
