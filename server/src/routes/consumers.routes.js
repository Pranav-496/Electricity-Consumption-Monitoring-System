const express = require('express');
const router = express.Router();
const consumersController = require('../controllers/consumers.controller');
const { authenticate } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/role');
const { validate } = require('../middleware/validate');
const { consumerSchema } = require('../validators/schemas');

router.use(authenticate);

router.get('/', requireAdmin, consumersController.getAllConsumers);
router.get('/:id', consumersController.getConsumerById);
router.post('/', requireAdmin, validate(consumerSchema), consumersController.createConsumer);
router.patch('/:id', requireAdmin, consumersController.updateConsumer);
router.delete('/:id', requireAdmin, consumersController.deactivateConsumer);

module.exports = router;
