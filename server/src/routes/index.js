const express = require('express');
const router = express.Router();

const authRoutes = require('./auth.routes');
const dashboardRoutes = require('./dashboard.routes');
const consumersRoutes = require('./consumers.routes');
const metersRoutes = require('./meters.routes');
const tariffsRoutes = require('./tariffs.routes');
const consumptionRoutes = require('./consumption.routes');
const billingRoutes = require('./billing.routes');
const paymentsRoutes = require('./payments.routes');
const alertsRoutes = require('./alerts.routes');
const reportsRoutes = require('./reports.routes');

// Health Check Endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Mounted REST API Routes
router.use('/auth', authRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/consumers', consumersRoutes);
router.use('/meters', metersRoutes);
router.use('/tariffs', tariffsRoutes);
router.use('/consumption', consumptionRoutes);
router.use('/bills', billingRoutes);
router.use('/payments', paymentsRoutes);
router.use('/alerts', alertsRoutes);
router.use('/reports', reportsRoutes);

module.exports = router;
