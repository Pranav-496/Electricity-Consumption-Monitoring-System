const db = require('./db.service');

/**
 * Calculates billing charges according to the tariff formula:
 * Energy Charge = Units Consumed × Rate Per Unit
 * Subtotal = Energy Charge + Fixed Charge
 * Tax Amount = Subtotal × Tax Percentage / 100
 * Final Amount = Subtotal + Tax Amount
 */
const calculateBillCharges = (unitsConsumed, tariff) => {
  const units = Number(unitsConsumed);
  const rate = Number(tariff.rate_per_unit);
  const fixed = Number(tariff.fixed_charge || 0);
  const taxPct = Number(tariff.tax_percentage || 0);

  const energyCharge = Number((units * rate).toFixed(2));
  const subtotal = Number((energyCharge + fixed).toFixed(2));
  const taxAmount = Number(((subtotal * taxPct) / 100).toFixed(2));
  const totalAmount = Number((subtotal + taxAmount).toFixed(2));

  return {
    units_consumed: units,
    rate_per_unit: rate,
    fixed_charge: fixed,
    tax_percentage: taxPct,
    energy_charge: energyCharge,
    tax_amount: taxAmount,
    amount: totalAmount
  };
};

/**
 * Validates requirements and generates an electricity bill
 */
const generateBill = async ({ meter_id, reading_date, bill_date, due_date, billing_period_start, billing_period_end }) => {
  // 1. Verify Meter
  const meter = await db.getMeterById(meter_id);
  if (!meter) {
    const err = new Error('Meter not found');
    err.statusCode = 404;
    throw err;
  }

  if (meter.meter_status !== 'active') {
    const err = new Error(`Cannot generate bill for a meter with status: ${meter.meter_status}`);
    err.statusCode = 400;
    throw err;
  }

  // 2. Verify Reading
  const reading = await db.getReadingByKey(meter_id, reading_date);
  if (!reading) {
    const err = new Error(`No consumption reading found for meter ${meter.meter_number} on ${reading_date}`);
    err.statusCode = 404;
    throw err;
  }

  // 3. Verify Tariff
  const tariff = await db.getTariffById(meter.tariff_id);
  if (!tariff) {
    const err = new Error('Assigned tariff not found for this meter');
    err.statusCode = 404;
    throw err;
  }

  // 4. Calculate Billing Breakdown
  const charges = calculateBillCharges(reading.units_consumed, tariff);

  // Set default dates if not provided
  const effectiveBillDate = bill_date || new Date().toISOString().split('T')[0];
  const effectiveDueDate = due_date || new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  
  // Default billing period from reading or 30 days prior
  const periodEnd = billing_period_end || reading_date;
  const periodStart = billing_period_start || new Date(new Date(reading_date).getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  // 5. Create Bill (handles idempotency & uniqueness check)
  const bill = await db.createBill({
    meter_id,
    reading_date,
    bill_date: effectiveBillDate,
    due_date: effectiveDueDate,
    billing_period_start: periodStart,
    billing_period_end: periodEnd,
    units_consumed: charges.units_consumed,
    rate_per_unit: charges.rate_per_unit,
    fixed_charge: charges.fixed_charge,
    tax_amount: charges.tax_amount,
    amount: charges.amount
  });

  return bill;
};

module.exports = {
  calculateBillCharges,
  generateBill
};
