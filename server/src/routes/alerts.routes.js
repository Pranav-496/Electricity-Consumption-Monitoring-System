const express = require('express');
const router = express.Router();
const alertsController = require('../controllers/alerts.controller');
const { authenticate } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/role');

router.use(authenticate);

router.get('/', alertsController.getAllAlerts);
router.get('/settings', alertsController.getAlertSettings);
router.patch('/settings', requireAdmin, alertsController.updateAlertSettings);
router.get('/:id', alertsController.getAlertById);
router.patch('/read-all', alertsController.markAllAlertsRead);
router.patch('/:id/read', alertsController.markAlertRead);
router.post('/check', requireAdmin, alertsController.checkAlerts);

module.exports = router;
