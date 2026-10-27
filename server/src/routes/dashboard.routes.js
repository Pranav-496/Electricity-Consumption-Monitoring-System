const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboard.controller');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/overview', dashboardController.getOverview);
router.get('/consumption-trend', dashboardController.getConsumptionTrend);
router.get('/billing-summary', dashboardController.getBillingSummary);
router.get('/recent-activity', dashboardController.getRecentActivity);

module.exports = router;
