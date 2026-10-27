const { errorResponse } = require('../utils/apiResponse');

const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return errorResponse(res, 'Access Denied: Administrator privileges required for this operation', 403);
  }
  next();
};

const requireConsumer = (req, res, next) => {
  if (!req.user || req.user.role !== 'consumer') {
    return errorResponse(res, 'Access Denied: Consumer access only', 403);
  }
  next();
};

module.exports = {
  requireAdmin,
  requireConsumer
};
