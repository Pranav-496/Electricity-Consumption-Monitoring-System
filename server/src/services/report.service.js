const db = require('./db.service');

/**
 * Aggregates consumption and financial data for comprehensive DBMS reporting
 */
const generateReportData = async (reportType, filters = {}) => {
  const readings = await db.getConsumptionReadings(filters);
  const bills = await db.getBills(filters);
  const payments = await db.getPayments(filters);
  const consumers = await db.getConsumers();
  const meters = await db.getMeters();

  let summary = {};
  let rows = [];

  switch (reportType) {
    case 'daily_consumption': {
      // Group readings by reading_date
      const grouped = {};
      readings.forEach(r => {
        if (!grouped[r.reading_date]) {
          grouped[r.reading_date] = { date: r.reading_date, total_units: 0, count: 0 };
        }
        grouped[r.reading_date].total_units += r.units_consumed;
        grouped[r.reading_date].count += 1;
      });
      rows = Object.values(grouped).sort((a, b) => new Date(b.date) - new Date(a.date));
      const totalUnits = rows.reduce((s, r) => s + r.total_units, 0);
      summary = {
        total_records: rows.length,
        total_units_consumed: Number(totalUnits.toFixed(2)),
        average_daily_units: rows.length ? Number((totalUnits / rows.length).toFixed(2)) : 0
      };
      break;
    }

    case 'monthly_consumption': {
      const grouped = {};
      readings.forEach(r => {
        const month = r.reading_date.slice(0, 7); // YYYY-MM
        if (!grouped[month]) {
          grouped[month] = { month, total_units: 0, readings_count: 0 };
        }
        grouped[month].total_units += r.units_consumed;
        grouped[month].readings_count += 1;
      });
      rows = Object.values(grouped).sort((a, b) => b.month.localeCompare(a.month));
      const totalUnits = rows.reduce((s, r) => s + r.total_units, 0);
      summary = {
        total_months: rows.length,
        total_units_consumed: Number(totalUnits.toFixed(2)),
        average_monthly_units: rows.length ? Number((totalUnits / rows.length).toFixed(2)) : 0
      };
      break;
    }

    case 'yearly_consumption': {
      const grouped = {};
      readings.forEach(r => {
        const year = r.reading_date.slice(0, 4); // YYYY
        if (!grouped[year]) {
          grouped[year] = { year, total_units: 0, readings_count: 0 };
        }
        grouped[year].total_units += r.units_consumed;
        grouped[year].readings_count += 1;
      });
      rows = Object.values(grouped).sort((a, b) => b.year.localeCompare(a.year));
      summary = {
        total_years: rows.length,
        total_units_consumed: Number(rows.reduce((s, r) => s + r.total_units, 0).toFixed(2))
      };
      break;
    }

    case 'consumer_wise': {
      const grouped = {};
      consumers.forEach(c => {
        grouped[c.id] = {
          consumer_id: c.id,
          name: c.name,
          contact: c.contact,
          total_units: 0,
          total_billed: 0,
          total_paid: 0,
          outstanding_balance: 0
        };
      });

      readings.forEach(r => {
        if (grouped[r.consumer_id]) {
          grouped[r.consumer_id].total_units += r.units_consumed;
        }
      });

      bills.forEach(b => {
        const cId = b.meters?.consumer_id;
        if (grouped[cId]) {
          grouped[cId].total_billed += b.amount;
          grouped[cId].total_paid += b.total_paid;
          grouped[cId].outstanding_balance += b.outstanding_balance;
        }
      });

      rows = Object.values(grouped);
      summary = {
        total_consumers: rows.length,
        total_units: Number(rows.reduce((s, r) => s + r.total_units, 0).toFixed(2)),
        total_billed: Number(rows.reduce((s, r) => s + r.total_billed, 0).toFixed(2)),
        total_outstanding: Number(rows.reduce((s, r) => s + r.outstanding_balance, 0).toFixed(2))
      };
      break;
    }

    case 'meter_wise': {
      const grouped = {};
      meters.forEach(m => {
        grouped[m.id] = {
          meter_id: m.id,
          meter_number: m.meter_number,
          meter_type: m.meter_type,
          meter_status: m.meter_status,
          consumer_name: m.consumers ? m.consumers.name : 'Unassigned',
          total_units: 0,
          readings_count: 0
        };
      });

      readings.forEach(r => {
        if (grouped[r.meter_id]) {
          grouped[r.meter_id].total_units += r.units_consumed;
          grouped[r.meter_id].readings_count += 1;
        }
      });

      rows = Object.values(grouped);
      summary = {
        total_meters: rows.length,
        active_meters: rows.filter(m => m.meter_status === 'active').length,
        total_units_recorded: Number(rows.reduce((s, r) => s + r.total_units, 0).toFixed(2))
      };
      break;
    }

    case 'monthly_billing':
    case 'billing_summary': {
      rows = bills.map(b => ({
        bill_id: b.id,
        meter_number: b.meters?.meter_number,
        consumer_name: b.meters?.consumers?.name,
        bill_date: b.bill_date,
        due_date: b.due_date,
        units_consumed: b.units_consumed,
        rate_per_unit: b.rate_per_unit,
        fixed_charge: b.fixed_charge,
        tax_amount: b.tax_amount,
        amount: b.amount,
        payment_status: b.payment_status,
        total_paid: b.total_paid,
        outstanding_balance: b.outstanding_balance
      }));
      summary = {
        total_bills: rows.length,
        total_billed_amount: Number(rows.reduce((s, b) => s + b.amount, 0).toFixed(2)),
        total_collected: Number(rows.reduce((s, b) => s + b.total_paid, 0).toFixed(2)),
        total_outstanding: Number(rows.reduce((s, b) => s + b.outstanding_balance, 0).toFixed(2)),
        unpaid_count: rows.filter(b => b.payment_status === 'unpaid' || b.payment_status === 'overdue').length
      };
      break;
    }

    case 'payment_summary': {
      rows = payments.map(p => ({
        payment_id: p.id,
        bill_id: p.bill_id,
        payment_date: p.payment_date,
        amount: p.amount,
        payment_mode: p.payment_mode,
        reference_number: p.reference_number,
        consumer_name: p.bills?.meters?.consumers?.name
      }));
      summary = {
        total_transactions: rows.length,
        total_amount_collected: Number(rows.reduce((s, p) => s + p.amount, 0).toFixed(2))
      };
      break;
    }

    case 'outstanding_bills': {
      rows = bills.filter(b => b.outstanding_balance > 0).map(b => ({
        bill_id: b.id,
        meter_number: b.meters?.meter_number,
        consumer_name: b.meters?.consumers?.name,
        due_date: b.due_date,
        amount: b.amount,
        total_paid: b.total_paid,
        outstanding_balance: b.outstanding_balance,
        payment_status: b.payment_status
      }));
      summary = {
        outstanding_bills_count: rows.length,
        total_outstanding_amount: Number(rows.reduce((s, b) => s + b.outstanding_balance, 0).toFixed(2))
      };
      break;
    }

    default:
      throw new Error(`Unsupported report type: ${reportType}`);
  }

  return {
    report_type: reportType,
    generated_at: new Date().toISOString(),
    filters,
    summary,
    rows
  };
};

module.exports = {
  generateReportData
};
