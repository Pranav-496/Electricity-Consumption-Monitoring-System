import React, { useState, useEffect } from 'react';
import {
  Gauge,
  Activity,
  Receipt,
  CreditCard,
  AlertTriangle,
  FileCheck,
  Zap,
  Calendar
} from 'lucide-react';
import api from '../../services/api';
import StatCard from '../../components/common/StatCard';
import Spinner from '../../components/common/Spinner';
import Badge from '../../components/common/Badge';
import ConsumptionChart from '../../components/charts/ConsumptionChart';
import { formatCurrency, formatUnits, formatDate } from '../../utils/formatters';

const ConsumerDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [overview, setOverview] = useState(null);
  const [trend, setTrend] = useState([]);
  const [readings, setReadings] = useState([]);
  const [bills, setBills] = useState([]);
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    const fetchConsumerData = async () => {
      try {
        setLoading(true);
        const [meRes, ovRes, trendRes, readRes, billRes, alertRes] = await Promise.all([
          api.get('/auth/me'),
          api.get('/dashboard/overview'),
          api.get('/dashboard/consumption-trend'),
          api.get('/consumption'),
          api.get('/bills'),
          api.get('/alerts')
        ]);

        setProfile(meRes.data);
        setOverview(ovRes.data);
        setTrend(trendRes.data);
        setReadings(readRes.data);
        setBills(billRes.data);
        setAlerts(alertRes.data);
      } catch (err) {
        console.error('Failed to load consumer dashboard data', err);
      } finally {
        setLoading(false);
      }
    };

    fetchConsumerData();
  }, []);

  if (loading) {
    return (
      <div className="py-20 flex justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  const assignedMeter = profile?.consumer?.meters?.[0] || null;
  const latestReading = readings.length > 0 ? readings[0] : null;
  const unpaidBills = bills.filter(b => b.outstanding_balance > 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Consumer Welcome Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 p-6 rounded-3xl text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-1 rounded-lg bg-emerald-500/20 text-emerald-400">
                <Zap className="w-4 h-4 fill-emerald-400" />
              </span>
              <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Consumer Energy Portal</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Welcome, {profile?.full_name || profile?.username}</h1>
            <p className="text-xs text-slate-300 mt-1 max-w-xl">
              Track your household power usage, monitor smart meter readings, and review historical utility statements.
            </p>
          </div>

          {/* Assigned Meter Badge Card */}
          {assignedMeter ? (
            <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/15 text-xs shrink-0">
              <p className="text-slate-300 font-medium">Assigned Smart Meter</p>
              <p className="text-base font-bold text-white mt-0.5">{assignedMeter.meter_number}</p>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant={assignedMeter.meter_status}>{assignedMeter.meter_status.toUpperCase()}</Badge>
                <span className="text-slate-300 text-[11px]">{assignedMeter.meter_type}</span>
              </div>
            </div>
          ) : (
            <div className="bg-amber-500/20 p-4 rounded-2xl border border-amber-500/30 text-xs text-amber-200">
              Meter pending assignment by utility grid admin.
            </div>
          )}
        </div>
      </div>

      {/* Consumer Scoped KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Units Consumed"
          value={formatUnits(overview?.total_consumption_kwh)}
          icon={Activity}
          description="Cumulative recorded power"
          color="emerald"
        />
        <StatCard
          title="Latest Cycle Reading"
          value={latestReading ? `${latestReading.units_consumed} kWh` : 'N/A'}
          icon={Gauge}
          description={latestReading ? `Recorded: ${formatDate(latestReading.reading_date)}` : 'No readings yet'}
          color="blue"
        />
        <StatCard
          title="Outstanding Balance"
          value={formatCurrency(overview?.outstanding_amount)}
          icon={CreditCard}
          description={overview?.outstanding_amount > 0 ? 'Pending invoice payment' : 'Account in good standing'}
          color={overview?.outstanding_amount > 0 ? 'rose' : 'emerald'}
        />
        <StatCard
          title="Total Paid to Date"
          value={formatCurrency(overview?.payments_collected)}
          icon={FileCheck}
          description="Verified receipts"
          color="purple"
        />
      </div>

      {/* Active Alerts for Consumer */}
      {alerts.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            Account Alerts & Utility Notices
          </h2>
          <div className="grid grid-cols-1 gap-3">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-4 rounded-2xl border flex items-start justify-between gap-3 ${
                  alert.severity === 'critical'
                    ? 'bg-rose-50 border-rose-200 text-rose-900'
                    : 'bg-amber-50 border-amber-200 text-amber-900'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <Badge variant={alert.severity}>{alert.alert_type}</Badge>
                    <span className="text-xs text-slate-500">{formatDate(alert.alert_date)}</span>
                  </div>
                  <p className="text-sm mt-1 font-medium">{alert.message}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Monthly Consumption Chart */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Your Monthly Electricity Consumption History</h2>
            <p className="text-xs text-slate-500">Telemetry progression in units (kWh)</p>
          </div>
        </div>
        <ConsumptionChart data={trend} />
      </div>

      {/* Bills & Invoices Overview */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900">Recent Utility Billing Statements</h2>
        </div>
        <div className="divide-y divide-slate-100">
          {bills.length > 0 ? (
            bills.map((b) => (
              <div key={b.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 transition-colors">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-900">#{b.id.slice(0, 8)}</span>
                    <Badge variant={b.payment_status}>{b.payment_status}</Badge>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Period: {b.billing_period_start} to {b.billing_period_end} • Due: {b.due_date}
                  </p>
                  <p className="text-xs text-slate-600 mt-1">
                    Units Consumed: <span className="font-semibold">{b.units_consumed} kWh</span>
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-base font-bold text-slate-900">{formatCurrency(b.amount)}</p>
                  <p className="text-xs text-slate-500">
                    Outstanding Balance:{' '}
                    <span className={b.outstanding_balance > 0 ? 'text-rose-600 font-semibold' : 'text-emerald-600 font-semibold'}>
                      {formatCurrency(b.outstanding_balance)}
                    </span>
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-xs text-slate-400">
              No bills generated for this meter yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConsumerDashboard;
