const db = require('../services/db.service');
const { successResponse, errorResponse } = require('../utils/apiResponse');

const getAllPayments = async (req, res, next) => {
  try {
    const { bill_id, payment_mode } = req.query;
    let filters = {};

    if (bill_id) filters.bill_id = bill_id;
    if (payment_mode) filters.payment_mode = payment_mode;

    let payments = await db.getPayments(filters);

    if (req.user.role === 'consumer') {
      const myConsumers = await db.getConsumers({ consumer_user_id: req.user.id });
      const myConsumerIds = myConsumers.map(c => c.id);
      payments = payments.filter(p => myConsumerIds.includes(p.bills?.meters?.consumer_id));
    }

    return successResponse(res, payments);
  } catch (err) {
    next(err);
  }
};

const getPaymentById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const payments = await db.getPayments();
    const payment = payments.find(p => p.id === id);
    if (!payment) {
      return errorResponse(res, 'Payment not found', 404);
    }
    return successResponse(res, payment);
  } catch (err) {
    next(err);
  }
};

const recordPayment = async (req, res, next) => {
  try {
    const paymentData = {
      ...req.body,
      recorded_by: req.user.id
    };

    const result = await db.recordPayment(paymentData);
    return successResponse(res, result, 'Payment recorded and bill status updated transactionally', 201);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAllPayments,
  getPaymentById,
  recordPayment
};
