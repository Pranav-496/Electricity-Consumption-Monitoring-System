import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Gauge,
  Activity,
  Receipt,
  CreditCard,
  AlertTriangle,
  FileCheck,
  Clock,
  ArrowRight
} from 'lucide-react';
import api from '../../services/api';
import StatCard from '../../components/common/StatCard';
import Spinner from '../../components/common/Spinner';
import Badge from '../../components/common/Badge';
import ConsumptionChart from '../../components/charts/ConsumptionChart';
import BillingSummaryChart from '../../components/charts/BillingSummaryChart';
import { formatCurrency, formatUnits, formatDate } from '../../utils/formatters';

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState(null);
  const [consumptionTrend, setConsumptionTrend] = useState([]);
  const [billingSummary, setBillingSummary] = useState([]);
  const [recentActivity, setRecentActivity] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [ovRes, trendRes, billRes, actRes] = await Promise.all([
          api.get('/dashboard/overview'),
          api.get('/dashboard/consumption-trend'),
          api.get('/dashboard/billing-summary'),
          api.get('/dashboard/recent-activity')
        ]);
        setOverview(ovRes.data);
        setConsumptionTrend(trendRes.data);
        setBillingSummary(billRes.data);
        setRecentActivity(actRes.data);
      } catch (err) {
        console.error('Failed to load admin dashboard data', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="py-20 flex justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Page Title Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">System Analytics Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">
          Real-time metrics, grid consumption telemetry, and billing ledger reconciliation.
        </p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Consumers"
          value={overview?.total_consumers || 0}
          icon={Users}
          description="Registered utility accounts"
          color="blue"
        />
        <StatCard
          title="Active Meters"
          value={overview?.active_meters || 0}
          icon={Gauge}
          description="Telemetry active units"
          color="emerald"
        />
        <StatCard
          title="Total Consumption"
          value={formatUnits(overview?.total_consumption_kwh)}
          icon={Activity}
          description="Cumulative recorded power"
          color="purple"
        />
        <StatCard
          title="Active Alerts"
          value={overview?.active_alerts_count || 0}
          icon={AlertTriangle}
          description="Threshold warnings"
          color={overview?.active_alerts_count > 0 ? 'rose' : 'emerald'}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Bills Generated"
          value={overview?.bills_generated || 0}
          icon={Receipt}
          description="Total billing statements"
          color="blue"
        />
        <StatCard
          title="Payments Collected"
          value={formatCurrency(overview?.payments_collected)}
          icon={FileCheck}
          description="Total ledger receipts"
          color="emerald"
        />
        <StatCard
          title="Outstanding Balance"
          value={formatCurrency(overview?.outstanding_amount)}
          icon={CreditCard}
          description="Pending revenue collection"
          color="amber"
        />
        <StatCard
          title="Unpaid & Overdue"
          value={overview?.unpaid_bills_count || 0}
          icon={Clock}
          description="Bills requiring payment"
          color={overview?.unpaid_bills_count > 0 ? 'rose' : 'emerald'}
        />
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Consumption Trend */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Cumulative Monthly Consumption Trend</h2>
              <p className="text-xs text-slate-500">Total electricity energy consumption in kilowatt-hours (kWh)</p>
            </div>
          </div>
          <ConsumptionChart data={consumptionTrend} />
        </div>

        {/* Billing vs Collected */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Revenue Ledger Reconciliation</h2>
              <p className="text-xs text-slate-500">Monthly billed charges compared against recorded payment collections</p>
            </div>
          </div>
          <BillingSummaryChart data={billingSummary} />
        </div>
      </div>

      {/* Recent Records Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Meter Readings */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">Recent Meter Readings</h2>
            <Link to="/admin/consumption" className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold flex items-center gap-1">
              View All <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="divide-y divide-slate-100">
            {recentActivity?.recent_readings?.length > 0 ? (
              recentActivity.recent_readings.map((r, i) => (
                <div key={i} className="p-4 flex items-center justify-between hover:bg-slate-50/70 transition-colors">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{r.consumer_name || 'Consumer'}</p>
                    <p className="text-xs text-slate-500">Meter #{r.meter_number} • Date: {r.reading_date}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-900">{r.units_consumed} kWh</p>
                    <p className="text-[11px] text-slate-400">Cumulative: {r.current_reading} kWh</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-xs text-slate-400">No readings recorded yet</div>
            )}
          </div>
        </div>

        {/* Recent Generated Bills */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">Recent Invoices</h2>
            <Link to="/admin/billing" className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold flex items-center gap-1">
              View All <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="divide-y divide-slate-100">
            {recentActivity?.recent_bills?.length > 0 ? (
              recentActivity.recent_bills.map((b, i) => (
                <div key={i} className="p-4 flex items-center justify-between hover:bg-slate-50/70 transition-colors">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-slate-800">{b.meters?.consumers?.name || 'Consumer'}</p>
                      <Badge variant={b.payment_status}>{b.payment_status}</Badge>
                    </div>
                    <p className="text-xs text-slate-500">Due: {b.due_date} • {b.units_consumed} kWh</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-900">{formatCurrency(b.amount)}</p>
                    <p className="text-[11px] text-slate-500">Bal: {formatCurrency(b.outstanding_balance)}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-xs text-slate-400">No bills generated yet</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
