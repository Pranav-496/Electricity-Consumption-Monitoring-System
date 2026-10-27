const express = require('express');
const router = express.Router();
const tariffsController = require('../controllers/tariffs.controller');
const { authenticate } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/role');
const { validate } = require('../middleware/validate');
const { tariffSchema } = require('../validators/schemas');

router.use(authenticate);

router.get('/', tariffsController.getAllTariffs);
router.get('/:id', tariffsController.getTariffById);
router.post('/', requireAdmin, validate(tariffSchema), tariffsController.createTariff);
router.patch('/:id', requireAdmin, tariffsController.updateTariff);
router.patch('/:id/status', requireAdmin, tariffsController.toggleTariffStatus);

module.exports = router;
