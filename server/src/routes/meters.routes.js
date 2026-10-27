const express = require('express');
const router = express.Router();
const metersController = require('../controllers/meters.controller');
const { authenticate } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/role');
const { validate } = require('../middleware/validate');
const { meterSchema } = require('../validators/schemas');

router.use(authenticate);

router.get('/', metersController.getAllMeters);
router.get('/:id', metersController.getMeterById);
router.post('/', requireAdmin, validate(meterSchema), metersController.createMeter);
router.patch('/:id', requireAdmin, metersController.updateMeter);
router.patch('/:id/status', requireAdmin, metersController.toggleMeterStatus);
router.get('/:id/readings', metersController.getMeterReadings);

module.exports = router;
