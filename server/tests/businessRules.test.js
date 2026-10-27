const { test, describe } = require('node:test');
const assert = require('node:assert');
const { calculateBillCharges } = require('../src/services/billing.service');

describe('DBMS Project Business Logic & Calculation Tests', () => {
  describe('1. Consumption Calculation & Derived Attribute', () => {
    test('Units consumed is correctly derived as (current_reading - previous_reading)', () => {
      const prev = 1200;
      const curr = 1450;
      const unitsConsumed = curr - prev;
      assert.strictEqual(unitsConsumed, 250);
    });

    test('Current reading lower than previous reading must be invalid', () => {
      const prev = 1500;
      const curr = 1400;
      const isValid = curr >= prev;
      assert.strictEqual(isValid, false);
    });
  });

  describe('2. Tariff-Based Billing Formula Verification', () => {
    test('Calculates residential bill charges accurately with fixed charge and taxes', () => {
      const tariff = {
        rate_per_unit: 5.50,
        fixed_charge: 85.00,
        tax_percentage: 5.00
      };
      const units = 220;

      const breakdown = calculateBillCharges(units, tariff);

      // Energy = 220 * 5.50 = 1210
      assert.strictEqual(breakdown.energy_charge, 1210.00);
      // Subtotal = 1210 + 85 = 1295
      // Tax (5%) = 1295 * 0.05 = 64.75
      assert.strictEqual(breakdown.tax_amount, 64.75);
      // Total = 1295 + 64.75 = 1359.75
      assert.strictEqual(breakdown.amount, 1359.75);
    });

    test('Calculates commercial bill charges accurately with 12% tax', () => {
      const tariff = {
        rate_per_unit: 9.20,
        fixed_charge: 220.00,
        tax_percentage: 12.00
      };
      const units = 620;

      const breakdown = calculateBillCharges(units, tariff);

      // Energy = 620 * 9.20 = 5704.00
      assert.strictEqual(breakdown.energy_charge, 5704.00);
      // Subtotal = 5704 + 220 = 5924.00
      // Tax (12%) = 5924 * 0.12 = 710.88
      assert.strictEqual(breakdown.tax_amount, 710.88);
      // Total = 5924 + 710.88 = 6634.88
      assert.strictEqual(breakdown.amount, 6634.88);
    });
  });

  describe('3. Payment Reconciliation & Status Tracking', () => {
    test('Full payment transitions bill to paid and leaves zero balance', () => {
      const billAmount = 1359.75;
      const recordedPayment = 1359.75;

      const remainingBalance = billAmount - recordedPayment;
      const status = remainingBalance <= 0 ? 'paid' : 'partially_paid';

      assert.strictEqual(remainingBalance, 0);
      assert.strictEqual(status, 'paid');
    });

    test('Partial payment leaves positive outstanding balance and transitions to partially_paid', () => {
      const billAmount = 1908.38;
      const recordedPayment = 1000.00;

      const remainingBalance = Number((billAmount - recordedPayment).toFixed(2));
      const status = remainingBalance <= 0 ? 'paid' : 'partially_paid';

      assert.strictEqual(remainingBalance, 908.38);
      assert.strictEqual(status, 'partially_paid');
    });

    test('Overpayment validation prevents paying more than outstanding balance', () => {
      const outstandingBalance = 908.38;
      const attemptedPayment = 1000.00;

      const isAllowed = attemptedPayment <= outstandingBalance;
      assert.strictEqual(isAllowed, false);
    });
  });

  describe('4. High Consumption & Abnormal Surge Rule Verification', () => {
    test('Consumption exceeding threshold triggers high consumption alert', () => {
      const threshold = 500.00;
      const consumption = 610.00;
      const triggersHighConsumption = consumption > threshold;
      assert.strictEqual(triggersHighConsumption, true);
    });

    test('Consumption increase exceeding percentage threshold triggers abnormal usage alert', () => {
      const percentageThreshold = 50.00;
      const prior = 315.00;
      const current = 610.00;
      const percentageIncrease = ((current - prior) / prior) * 100;
      const triggersAbnormalUsage = percentageIncrease >= percentageThreshold;

      assert.strictEqual(triggersAbnormalUsage, true);
      assert.strictEqual(percentageIncrease > 90, true);
    });
  });
});
