const db = require('../services/db.service');
const { successResponse, errorResponse } = require('../utils/apiResponse');

const getAllMeters = async (req, res, next) => {
  try {
    const { status, search } = req.query;
    let list = await db.getMeters();

    if (req.user && req.user.role === 'consumer') {
      const myConsumers = await db.getConsumers({ consumer_user_id: req.user.id });
      const myConsumerIds = myConsumers.map(c => c.id);
      list = list.filter(m => myConsumerIds.includes(m.consumer_id));
    }

    if (status) {
      list = list.filter(m => m.meter_status === status);
    }

    if (search) {
      const q = search.toLowerCase();
      list = list.filter(m => 
        m.meter_number.toLowerCase().includes(q) ||
        (m.consumers && m.consumers.name.toLowerCase().includes(q))
      );
    }

    return successResponse(res, list);
  } catch (err) {
    next(err);
  }
};

const getMeterById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const meter = await db.getMeterById(id);
    if (!meter) {
      return errorResponse(res, 'Meter not found', 404);
    }

    const readings = await db.getConsumptionReadings({ meter_id: id });
    const bills = await db.getBills({ meter_id: id });

    return successResponse(res, {
      ...meter,
      readings,
      bills
    });
  } catch (err) {
    next(err);
  }
};

const createMeter = async (req, res, next) => {
  try {
    const created = await db.createMeter(req.body);
    return successResponse(res, created, 'Meter created and assigned successfully', 201);
  } catch (err) {
    next(err);
  }
};

const updateMeter = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await db.getMeterById(id);
    if (!existing) {
      return errorResponse(res, 'Meter not found', 404);
    }

    const updated = await db.updateMeter(id, req.body);
    return successResponse(res, updated, 'Meter updated successfully');
  } catch (err) {
    next(err);
  }
};

const getMeterReadings = async (req, res, next) => {
  try {
    const { id } = req.params;
    const readings = await db.getConsumptionReadings({ meter_id: id });
    return successResponse(res, readings);
  } catch (err) {
    next(err);
  }
};

const toggleMeterStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await db.getMeterById(id);
    if (!existing) {
      return errorResponse(res, 'Meter not found', 404);
    }

    const nextStatus = existing.meter_status === 'active' ? 'inactive' : 'active';
    const updated = await db.updateMeter(id, { meter_status: nextStatus });
    return successResponse(res, updated, `Meter status updated to ${nextStatus}`);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAllMeters,
  getMeterById,
  createMeter,
  updateMeter,
  getMeterReadings,
  toggleMeterStatus
};
