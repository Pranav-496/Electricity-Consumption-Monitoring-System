const express = require('express');
const router = express.Router();
const billingController = require('../controllers/billing.controller');
const { authenticate } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/role');
const { validate } = require('../middleware/validate');
const { billGenerateSchema } = require('../validators/schemas');

router.use(authenticate);

router.get('/', billingController.getAllBills);
router.get('/:id', billingController.getBillById);
router.post('/generate', requireAdmin, validate(billGenerateSchema), billingController.generateBill);
router.get('/:id/payments', billingController.getBillPayments);
router.get('/:id/download', billingController.downloadBill);

module.exports = router;
