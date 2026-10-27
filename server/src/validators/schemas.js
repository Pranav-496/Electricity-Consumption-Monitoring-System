const { z } = require('zod');

const idSchema = z.string().min(1, 'Valid ID is required');

// Authentication Schemas
const loginSchema = {
  body: z.object({
    email: z.string().email('Valid email is required'),
    password: z.string().min(6, 'Password must be at least 6 characters')
  })
};

const registerSchema = {
  body: z.object({
    email: z.string().email('Valid email is required'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    username: z.string().min(3, 'Username must be at least 3 characters'),
    full_name: z.string().optional()
  })
};

// Consumer Schemas
const consumerSchema = {
  body: z.object({
    name: z.string().min(2, 'Consumer name is required'),
    address: z.string().min(5, 'Address is required'),
    contact: z.string().min(5, 'Valid contact number is required'),
    email: z.string().email('Valid email is required').optional().or(z.literal('')),
    consumer_user_id: idSchema.optional().nullable()
  })
};

// Meter Schemas
const meterSchema = {
  body: z.object({
    meter_number: z.string().min(3, 'Meter number is required'),
    consumer_id: idSchema,
    tariff_id: idSchema,
    installation_date: z.string().optional(),
    meter_type: z.enum(['Single Phase', 'Three Phase', 'Smart Meter', 'Digital', 'Analog']).default('Smart Meter'),
    meter_status: z.enum(['active', 'inactive', 'maintenance']).default('active')
  })
};

// Tariff Schemas
const tariffSchema = {
  body: z.object({
    name: z.string().min(2, 'Tariff name is required'),
    description: z.string().optional(),
    rate_per_unit: z.number().nonnegative('Rate per unit must be non-negative'),
    fixed_charge: z.number().nonnegative('Fixed charge must be non-negative').default(0),
    tax_percentage: z.number().min(0).max(100, 'Tax percentage must be between 0 and 100').default(5),
    is_active: z.boolean().default(true)
  })
};

// Consumption Reading Schemas
const consumptionSchema = {
  body: z.object({
    meter_id: idSchema,
    reading_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Reading date must be in YYYY-MM-DD format'),
    previous_reading: z.number().nonnegative('Previous reading must be non-negative'),
    current_reading: z.number().nonnegative('Current reading must be non-negative')
  }).refine(data => data.current_reading >= data.previous_reading, {
    message: 'Current reading cannot be lower than previous reading',
    path: ['current_reading']
  })
};

// Bill Generation Schema
const billGenerateSchema = {
  body: z.object({
    meter_id: idSchema,
    reading_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Reading date must be in YYYY-MM-DD format'),
    bill_date: z.string().optional(),
    due_date: z.string().optional(),
    billing_period_start: z.string().optional(),
    billing_period_end: z.string().optional()
  })
};

// Payment Recording Schema
const paymentSchema = {
  body: z.object({
    bill_id: idSchema,
    amount: z.number().positive('Payment amount must be greater than zero'),
    payment_mode: z.enum(['cash', 'upi', 'bank_transfer', 'card']),
    reference_number: z.string().optional()
  })
};

module.exports = {
  loginSchema,
  registerSchema,
  consumerSchema,
  meterSchema,
  tariffSchema,
  consumptionSchema,
  billGenerateSchema,
  paymentSchema
};
