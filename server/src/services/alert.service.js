const db = require('./db.service');

/**
 * Checks a specific consumption reading against configured thresholds
 * and generates High Consumption or Abnormal Usage alerts.
 */
const checkReadingAlerts = async (meter_id, reading_date) => {
  const settings = await db.getAlertSettings();
  if (!settings || !settings.is_active) return [];

  const readings = await db.getConsumptionReadings({ meter_id });
  const target = readings.find(r => r.reading_date === reading_date);
  if (!target) return [];

  const generatedAlerts = [];

  // 1. Absolute Threshold Check (High Consumption)
  if (target.units_consumed > settings.high_consumption_threshold) {
    const alert = await db.createAlert({
      meter_id,
      reading_date,
      alert_type: 'High Consumption',
      message: `Reading on ${reading_date} recorded ${target.units_consumed.toFixed(2)} kWh, exceeding high consumption threshold of ${settings.high_consumption_threshold} kWh.`,
      severity: 'critical'
    });
    if (alert) generatedAlerts.push(alert);
  }

  // 2. Percentage Surge Check compared to predecessor cycle (Abnormal Usage)
  const priorReadings = readings
    .filter(r => r.reading_date < reading_date)
    .sort((a, b) => new Date(b.reading_date) - new Date(a.reading_date));

  if (priorReadings.length > 0) {
    const prior = priorReadings[0];
    if (prior.units_consumed > 0) {
      const percentageIncrease = ((target.units_consumed - prior.units_consumed) / prior.units_consumed) * 100;
      if (percentageIncrease >= settings.percentage_increase_threshold) {
        const alert = await db.createAlert({
          meter_id,
          reading_date,
          alert_type: 'Abnormal Usage',
          message: `Consumption surged by ${percentageIncrease.toFixed(1)}% compared to preceding period (${prior.units_consumed.toFixed(2)} kWh -> ${target.units_consumed.toFixed(2)} kWh).`,
          severity: 'warning'
        });
        if (alert) generatedAlerts.push(alert);
      }
    }
  }

  return generatedAlerts;
};

/**
 * Checks all active bills to identify overdue bills and generate Overdue Bill alerts
 */
const checkOverdueBills = async () => {
  const bills = await db.getBills();
  const today = new Date().toISOString().split('T')[0];
  const generatedAlerts = [];

  for (const bill of bills) {
    if (bill.outstanding_balance > 0 && bill.due_date < today) {
      // Create overdue alert
      const alert = await db.createAlert({
        meter_id: bill.meter_id,
        reading_date: bill.reading_date,
        bill_id: bill.id,
        alert_type: 'Overdue Bill',
        message: `Bill #${bill.id.slice(0, 8)} for ₹${bill.amount.toFixed(2)} was due on ${bill.due_date} and has an outstanding balance of ₹${bill.outstanding_balance.toFixed(2)}.`,
        severity: 'warning'
      });
      if (alert) generatedAlerts.push(alert);
    }
  }

  return generatedAlerts;
};

/**
 * Run a full system alert check (High Consumption, Abnormal Surge, Overdue Bills)
 */
const runFullAlertEvaluation = async () => {
  const readings = await db.getConsumptionReadings();
  let count = 0;

  for (const r of readings) {
    const readingAlerts = await checkReadingAlerts(r.meter_id, r.reading_date);
    count += readingAlerts.length;
  }

  const overdueAlerts = await checkOverdueBills();
  count += overdueAlerts.length;

  return { evaluated: true, new_alerts_count: count };
};

module.exports = {
  checkReadingAlerts,
  checkOverdueBills,
  runFullAlertEvaluation
};
