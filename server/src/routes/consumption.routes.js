const express = require('express');
const router = express.Router();
const consumptionController = require('../controllers/consumption.controller');
const { authenticate } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/role');
const { validate } = require('../middleware/validate');
const { consumptionSchema } = require('../validators/schemas');

router.use(authenticate);

router.get('/', consumptionController.getAllReadings);
router.get('/summary', consumptionController.getSummary);
router.get('/trends', consumptionController.getTrends);
router.get('/:meter_id/:reading_date', consumptionController.getReadingByKey);
router.post('/', requireAdmin, validate(consumptionSchema), consumptionController.createReading);

module.exports = router;
