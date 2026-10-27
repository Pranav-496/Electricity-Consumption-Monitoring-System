const db = require('../services/db.service');
const { successResponse } = require('../utils/apiResponse');

const getOverview = async (req, res, next) => {
  try {
    const isConsumer = req.user.role === 'consumer';
    let consumerId = null;

    if (isConsumer) {
      const myConsumers = await db.getConsumers({ consumer_user_id: req.user.id });
      if (myConsumers.length > 0) consumerId = myConsumers[0].id;
    }

    const filters = consumerId ? { consumer_id: consumerId } : {};

    const consumers = await db.getConsumers(filters);
    const meters = await db.getMeters(filters);
    const readings = await db.getConsumptionReadings(filters);
    const bills = await db.getBills(filters);
    const alerts = await db.getAlerts();

    const totalConsumption = readings.reduce((sum, r) => sum + r.units_consumed, 0);
    const totalBilled = bills.reduce((sum, b) => sum + b.amount, 0);
    const totalPaid = bills.reduce((sum, b) => sum + b.total_paid, 0);
    const totalOutstanding = bills.reduce((sum, b) => sum + b.outstanding_balance, 0);
    const unpaidBillsCount = bills.filter(b => b.payment_status === 'unpaid' || b.payment_status === 'overdue').length;

    // Filter alerts if consumer
    const relevantAlerts = isConsumer && meters.length > 0
      ? alerts.filter(a => meters.some(m => m.id === a.meter_id) && !a.is_read)
      : alerts.filter(a => !a.is_read);

    const overview = {
      total_consumers: consumers.length,
      active_meters: meters.filter(m => m.meter_status === 'active').length,
      total_consumption_kwh: Number(totalConsumption.toFixed(2)),
      bills_generated: bills.length,
      total_billed_amount: Number(totalBilled.toFixed(2)),
      payments_collected: Number(totalPaid.toFixed(2)),
      outstanding_amount: Number(totalOutstanding.toFixed(2)),
      unpaid_bills_count: unpaidBillsCount,
      active_alerts_count: relevantAlerts.length
    };

    return successResponse(res, overview);
  } catch (err) {
    next(err);
  }
};

const getConsumptionTrend = async (req, res, next) => {
  try {
    const isConsumer = req.user.role === 'consumer';
    let consumerId = null;

    if (isConsumer) {
      const myConsumers = await db.getConsumers({ consumer_user_id: req.user.id });
      if (myConsumers.length > 0) consumerId = myConsumers[0].id;
    }

    const readings = await db.getConsumptionReadings(consumerId ? { consumer_id: consumerId } : {});

    // Group by month
    const grouped = {};
    readings.forEach(r => {
      const month = r.reading_date.slice(0, 7);
      if (!grouped[month]) grouped[month] = { month, consumption: 0, count: 0 };
      grouped[month].consumption += r.units_consumed;
      grouped[month].count += 1;
    });

    const trend = Object.values(grouped).sort((a, b) => a.month.localeCompare(b.month));
    return successResponse(res, trend);
  } catch (err) {
    next(err);
  }
};

const getBillingSummary = async (req, res, next) => {
  try {
    const isConsumer = req.user.role === 'consumer';
    let consumerId = null;

    if (isConsumer) {
      const myConsumers = await db.getConsumers({ consumer_user_id: req.user.id });
      if (myConsumers.length > 0) consumerId = myConsumers[0].id;
    }

    const bills = await db.getBills(consumerId ? { consumer_id: consumerId } : {});

    // Group by month
    const grouped = {};
    bills.forEach(b => {
      const month = b.bill_date.slice(0, 7);
      if (!grouped[month]) grouped[month] = { month, billed: 0, collected: 0, outstanding: 0 };
      grouped[month].billed += b.amount;
      grouped[month].collected += b.total_paid;
      grouped[month].outstanding += b.outstanding_balance;
    });

    const summary = Object.values(grouped).map(g => ({
      month: g.month,
      billed: Number(g.billed.toFixed(2)),
      collected: Number(g.collected.toFixed(2)),
      outstanding: Number(g.outstanding.toFixed(2))
    })).sort((a, b) => a.month.localeCompare(b.month));

    return successResponse(res, summary);
  } catch (err) {
    next(err);
  }
};

const getRecentActivity = async (req, res, next) => {
  try {
    const isConsumer = req.user.role === 'consumer';
    let consumerId = null;

    if (isConsumer) {
      const myConsumers = await db.getConsumers({ consumer_user_id: req.user.id });
      if (myConsumers.length > 0) consumerId = myConsumers[0].id;
    }

    const filters = consumerId ? { consumer_id: consumerId } : {};

    const readings = (await db.getConsumptionReadings(filters)).slice(0, 5);
    const bills = (await db.getBills(filters)).slice(0, 5);
    const alerts = (await db.getAlerts()).slice(0, 5);

    return successResponse(res, {
      recent_readings: readings,
      recent_bills: bills,
      recent_alerts: alerts
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getOverview,
  getConsumptionTrend,
  getBillingSummary,
  getRecentActivity
};
