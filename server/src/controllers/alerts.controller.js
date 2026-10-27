const db = require('../services/db.service');
const alertService = require('../services/alert.service');
const { successResponse, errorResponse } = require('../utils/apiResponse');

const getAllAlerts = async (req, res, next) => {
  try {
    const { is_read, severity, alert_type } = req.query;
    let filters = {};

    if (is_read !== undefined) filters.is_read = is_read === 'true';
    if (severity) filters.severity = severity;
    if (alert_type) filters.alert_type = alert_type;

    let alerts = await db.getAlerts(filters);

    if (req.user.role === 'consumer') {
      const myConsumers = await db.getConsumers({ consumer_user_id: req.user.id });
      const myConsumerIds = myConsumers.map(c => c.id);
      alerts = alerts.filter(a => myConsumerIds.includes(a.meters?.consumer_id));
    }

    return successResponse(res, alerts);
  } catch (err) {
    next(err);
  }
};

const getAlertById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const alerts = await db.getAlerts();
    const alert = alerts.find(a => a.id === id);
    if (!alert) {
      return errorResponse(res, 'Alert not found', 404);
    }
    return successResponse(res, alert);
  } catch (err) {
    next(err);
  }
};

const markAlertRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updated = await db.markAlertAsRead(id);
    if (!updated) {
      return errorResponse(res, 'Alert not found', 404);
    }
    return successResponse(res, updated, 'Alert marked as read');
  } catch (err) {
    next(err);
  }
};

const markAllAlertsRead = async (req, res, next) => {
  try {
    await db.markAllAlertsRead();
    return successResponse(res, null, 'All alerts marked as read');
  } catch (err) {
    next(err);
  }
};

const checkAlerts = async (req, res, next) => {
  try {
    const result = await alertService.runFullAlertEvaluation();
    return successResponse(res, result, `Alert evaluation completed. Identified and generated alerts.`);
  } catch (err) {
    next(err);
  }
};

const getAlertSettings = async (req, res, next) => {
  try {
    const settings = await db.getAlertSettings();
    return successResponse(res, settings);
  } catch (err) {
    next(err);
  }
};

const updateAlertSettings = async (req, res, next) => {
  try {
    const updated = await db.updateAlertSettings(req.body);
    return successResponse(res, updated, 'Alert rules and thresholds updated successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAllAlerts,
  getAlertById,
  markAlertRead,
  markAllAlertsRead,
  checkAlerts,
  getAlertSettings,
  updateAlertSettings
};
