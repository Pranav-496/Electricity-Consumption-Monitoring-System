const { errorResponse } = require('../utils/apiResponse');

const validate = (schema) => (req, res, next) => {
  try {
    if (schema.body) req.body = schema.body.parse(req.body);
    if (schema.query) req.query = schema.query.parse(req.query);
    if (schema.params) req.params = schema.params.parse(req.params);
    next();
  } catch (err) {
    if (err.errors) {
      const formattedErrors = err.errors.map(e => ({
        field: e.path.join('.'),
        message: e.message
      }));
      return errorResponse(res, 'Validation Error', 400, formattedErrors);
    }
    return errorResponse(res, err.message, 400);
  }
};

module.exports = { validate };
