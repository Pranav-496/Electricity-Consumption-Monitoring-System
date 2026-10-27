const db = require('../services/db.service');
const billingService = require('../services/billing.service');
const pdfService = require('../services/pdf.service');
const { successResponse, errorResponse } = require('../utils/apiResponse');

const getAllBills = async (req, res, next) => {
  try {
    const { payment_status, meter_id, consumer_id } = req.query;
    let filters = {};

    if (req.user.role === 'consumer') {
      const myConsumers = await db.getConsumers({ consumer_user_id: req.user.id });
      if (myConsumers.length > 0) {
        filters.consumer_id = myConsumers[0].id;
      }
    } else {
      if (consumer_id) filters.consumer_id = consumer_id;
    }

    if (payment_status) filters.payment_status = payment_status;
    if (meter_id) filters.meter_id = meter_id;

    const bills = await db.getBills(filters);
    return successResponse(res, bills);
  } catch (err) {
    next(err);
  }
};

const getBillById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const bill = await db.getBillById(id);
    if (!bill) {
      return errorResponse(res, 'Bill not found', 404);
    }

    // Role security check
    if (req.user.role === 'consumer') {
      const myConsumers = await db.getConsumers({ consumer_user_id: req.user.id });
      if (!myConsumers.some(c => c.id === bill.meters?.consumer_id)) {
        return errorResponse(res, 'Access denied to this bill', 403);
      }
    }

    return successResponse(res, bill);
  } catch (err) {
    next(err);
  }
};

const generateBill = async (req, res, next) => {
  try {
    const bill = await billingService.generateBill(req.body);
    return successResponse(res, bill, 'Electricity bill generated successfully', 201);
  } catch (err) {
    next(err);
  }
};

const getBillPayments = async (req, res, next) => {
  try {
    const { id } = req.params;
    const bill = await db.getBillById(id);
    if (!bill) {
      return errorResponse(res, 'Bill not found', 404);
    }
    const payments = await db.getPayments({ bill_id: id });
    return successResponse(res, payments);
  } catch (err) {
    next(err);
  }
};

const downloadBill = async (req, res, next) => {
  try {
    const { id } = req.params;
    const bill = await db.getBillById(id);
    if (!bill) {
      return errorResponse(res, 'Bill not found', 404);
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="bill-${bill.id.slice(0, 8)}.pdf"`);

    const doc = pdfService.generateBillPdf(bill);
    doc.pipe(res);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAllBills,
  getBillById,
  generateBill,
  getBillPayments,
  downloadBill
};
