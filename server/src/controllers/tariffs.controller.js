const db = require('../services/db.service');
const { successResponse, errorResponse } = require('../utils/apiResponse');

const getAllTariffs = async (req, res, next) => {
  try {
    const tariffs = await db.getTariffs();
    return successResponse(res, tariffs);
  } catch (err) {
    next(err);
  }
};

const getTariffById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const tariff = await db.getTariffById(id);
    if (!tariff) {
      return errorResponse(res, 'Tariff not found', 404);
    }
    return successResponse(res, tariff);
  } catch (err) {
    next(err);
  }
};

const createTariff = async (req, res, next) => {
  try {
    const created = await db.createTariff(req.body);
    return successResponse(res, created, 'Tariff created successfully', 201);
  } catch (err) {
    next(err);
  }
};

const updateTariff = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await db.getTariffById(id);
    if (!existing) {
      return errorResponse(res, 'Tariff not found', 404);
    }

    const updated = await db.updateTariff(id, req.body);
    return successResponse(res, updated, 'Tariff updated successfully');
  } catch (err) {
    next(err);
  }
};

const toggleTariffStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await db.getTariffById(id);
    if (!existing) {
      return errorResponse(res, 'Tariff not found', 404);
    }

    const newStatus = !existing.is_active;
    const updated = await db.updateTariff(id, { is_active: newStatus });
    return successResponse(res, updated, `Tariff ${newStatus ? 'activated' : 'deactivated'} successfully`);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAllTariffs,
  getTariffById,
  createTariff,
  updateTariff,
  toggleTariffStatus
};
