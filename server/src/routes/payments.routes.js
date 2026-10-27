const express = require('express');
const router = express.Router();
const paymentsController = require('../controllers/payments.controller');
const { authenticate } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/role');
const { validate } = require('../middleware/validate');
const { paymentSchema } = require('../validators/schemas');

router.use(authenticate);

router.get('/', paymentsController.getAllPayments);
router.get('/:id', paymentsController.getPaymentById);
router.post('/', requireAdmin, validate(paymentSchema), paymentsController.recordPayment);

module.exports = router;
