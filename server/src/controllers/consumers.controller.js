const db = require('../services/db.service');
const { successResponse, errorResponse } = require('../utils/apiResponse');

const getAllConsumers = async (req, res, next) => {
  try {
    const { search, is_active } = req.query;
    let list = await db.getConsumers();

    if (is_active !== undefined) {
      list = list.filter(c => String(c.is_active) === is_active);
    }

    if (search) {
      const q = search.toLowerCase();
      list = list.filter(c => 
        c.name.toLowerCase().includes(q) ||
        c.contact.includes(q) ||
        (c.email && c.email.toLowerCase().includes(q)) ||
        c.address.toLowerCase().includes(q)
      );
    }

    return successResponse(res, list);
  } catch (err) {
    next(err);
  }
};

const getConsumerById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const consumer = await db.getConsumerById(id);
    if (!consumer) {
      return errorResponse(res, 'Consumer not found', 404);
    }

    // Role check: Consumer can only view their own record
    if (req.user.role === 'consumer' && consumer.consumer_user_id !== req.user.id) {
      return errorResponse(res, 'Access denied to this consumer record', 403);
    }

    const readings = await db.getConsumptionReadings({ consumer_id: id });
    const bills = await db.getBills({ consumer_id: id });

    return successResponse(res, {
      ...consumer,
      consumption_history: readings,
      bill_history: bills
    });
  } catch (err) {
    next(err);
  }
};

const createConsumer = async (req, res, next) => {
  try {
    const consumerData = {
      ...req.body,
      user_id: req.user.id // Administrator provisioning the record
    };

    const created = await db.createConsumer(consumerData);
    return successResponse(res, created, 'Consumer registered successfully', 201);
  } catch (err) {
    next(err);
  }
};

const updateConsumer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await db.getConsumerById(id);
    if (!existing) {
      return errorResponse(res, 'Consumer not found', 404);
    }

    const updated = await db.updateConsumer(id, req.body);
    return successResponse(res, updated, 'Consumer updated successfully');
  } catch (err) {
    next(err);
  }
};

const deactivateConsumer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await db.getConsumerById(id);
    if (!existing) {
      return errorResponse(res, 'Consumer not found', 404);
    }

    // Toggle active status (deactivation prevents foreign key corruption)
    const newStatus = !existing.is_active;
    const updated = await db.updateConsumer(id, { is_active: newStatus });
    const action = newStatus ? 'activated' : 'deactivated';
    return successResponse(res, updated, `Consumer successfully ${action}`);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAllConsumers,
  getConsumerById,
  createConsumer,
  updateConsumer,
  deactivateConsumer
};
