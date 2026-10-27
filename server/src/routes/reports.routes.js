const express = require('express');
const router = express.Router();
const reportsController = require('../controllers/reports.controller');
const { authenticate } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/role');

router.use(authenticate);

router.get('/', reportsController.getAllReports);
router.post('/generate', reportsController.generateReport);
router.get('/:report_type/download', reportsController.downloadReportCsv);

module.exports = router;
