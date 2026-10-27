const db = require('../services/db.service');
const alertService = require('../services/alert.service');
const { successResponse, errorResponse } = require('../utils/apiResponse');

const getAllReadings = async (req, res, next) => {
  try {
    const { meter_id, consumer_id, start_date, end_date } = req.query;
    let filters = {};

    if (req.user.role === 'consumer') {
      const myConsumers = await db.getConsumers({ consumer_user_id: req.user.id });
      if (myConsumers.length > 0) {
        filters.consumer_id = myConsumers[0].id;
      }
    } else {
      if (consumer_id) filters.consumer_id = consumer_id;
    }

    if (meter_id) filters.meter_id = meter_id;

    let readings = await db.getConsumptionReadings(filters);

    if (start_date) readings = readings.filter(r => r.reading_date >= start_date);
    if (end_date) readings = readings.filter(r => r.reading_date <= end_date);

    return successResponse(res, readings);
  } catch (err) {
    next(err);
  }
};

const getReadingByKey = async (req, res, next) => {
  try {
    const { meter_id, reading_date } = req.params;
    const reading = await db.getReadingByKey(meter_id, reading_date);
    if (!reading) {
      return errorResponse(res, 'Reading not found', 404);
    }
    return successResponse(res, reading);
  } catch (err) {
    next(err);
  }
};

const createReading = async (req, res, next) => {
  try {
    const readingData = {
      ...req.body,
      created_by: req.user.id
    };

    const created = await db.createConsumptionReading(readingData);

    // Automatically evaluate alert conditions for the new reading
    const triggeredAlerts = await alertService.checkReadingAlerts(created.meter_id, created.reading_date);

    return successResponse(res, {
      reading: created,
      alerts_triggered: triggeredAlerts
    }, 'Reading recorded successfully', 201);
  } catch (err) {
    next(err);
  }
};

const getSummary = async (req, res, next) => {
  try {
    const readings = await db.getConsumptionReadings();
    const totalUnits = readings.reduce((sum, r) => sum + r.units_consumed, 0);
    const avgUnits = readings.length ? totalUnits / readings.length : 0;

    return successResponse(res, {
      total_readings: readings.length,
      total_units_consumed: Number(totalUnits.toFixed(2)),
      average_units_per_reading: Number(avgUnits.toFixed(2))
    });
  } catch (err) {
    next(err);
  }
};

const getTrends = async (req, res, next) => {
  try {
    const { meter_id } = req.query;
    const readings = await db.getConsumptionReadings(meter_id ? { meter_id } : {});

    // Sort chronologically ascending
    const sorted = [...readings].sort((a, b) => new Date(a.reading_date) - new Date(b.reading_date));

    const trend = sorted.map(r => ({
      date: r.reading_date,
      meter_number: r.meter_number,
      consumer_name: r.consumer_name,
      units_consumed: r.units_consumed,
      current_reading: r.current_reading
    }));

    return successResponse(res, trend);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAllReadings,
  getReadingByKey,
  createReading,
  getSummary,
  getTrends
};
