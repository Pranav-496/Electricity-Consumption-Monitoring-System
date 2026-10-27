import React, { useState, useEffect } from 'react';
import { Bell, CheckCheck, RefreshCw, AlertTriangle, ShieldAlert } from 'lucide-react';
import api from '../../services/api';
import DataTable from '../../components/tables/DataTable';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Spinner from '../../components/common/Spinner';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { formatDateTime } from '../../utils/formatters';

const AlertList = () => {
  const { isAdmin } = useAuth();
  const toast = useToast();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEvaluating, setIsEvaluating] = useState(false);

  // Filters
  const [severityFilter, setSeverityFilter] = useState('');
  const [readFilter, setReadFilter] = useState('');

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const params = {};
      if (severityFilter) params.severity = severityFilter;
      if (readFilter !== '') params.is_read = readFilter;

      const res = await api.get('/alerts', { params });
      setAlerts(res.data);
    } catch (err) {
      toast.error('Failed to load alerts: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [severityFilter, readFilter]);

  const handleMarkAsRead = async (id) => {
    try {
      await api.patch(`/alerts/${id}/read`);
      toast.success('Alert marked as read');
      fetchAlerts();
    } catch (err) {
      toast.error('Failed to update alert: ' + err.message);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.patch('/alerts/read-all');
      toast.success('All alerts marked as read');
      fetchAlerts();
    } catch (err) {
      toast.error('Failed to update alerts: ' + err.message);
    }
  };

  const handleRunEvaluation = async () => {
    setIsEvaluating(true);
    try {
      const res = await api.post('/alerts/check');
      toast.success(res.message || 'Alert checks completed');
      fetchAlerts();
    } catch (err) {
      toast.error('Failed to evaluate alerts: ' + err.message);
    } finally {
      setIsEvaluating(false);
    }
  };

  const columns = [
    {
      header: 'Severity',
      accessor: 'severity',
      sortable: true,
      render: (row) => (
        <Badge variant={row.severity}>{row.severity.toUpperCase()}</Badge>
      )
    },
    {
      header: 'Alert Category',
      accessor: 'alert_type',
      sortable: true,
      render: (row) => (
        <span className="font-semibold text-xs text-slate-800">{row.alert_type}</span>
      )
    },
    {
      header: 'Message & Notification',
      accessor: 'message',
      render: (row) => (
        <p className={`text-xs ${row.is_read ? 'text-slate-500' : 'text-slate-900 font-medium'}`}>
          {row.message}
        </p>
      )
    },
    {
      header: 'Meter & Consumer',
      accessor: 'meters',
      render: (row) => (
        <div className="text-xs">
          <p className="font-semibold text-slate-800">{row.meters?.consumers?.name || 'Consumer'}</p>
          <p className="font-mono text-slate-400">Meter: {row.meters?.meter_number}</p>
        </div>
      )
    },
    {
      header: 'Timestamp',
      accessor: 'alert_date',
      sortable: true,
      render: (row) => (
        <span className="text-xs text-slate-500">{formatDateTime(row.alert_date)}</span>
      )
    },
    {
      header: 'Status',
      accessor: 'is_read',
      sortable: true,
      render: (row) => (
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${
          row.is_read ? 'bg-slate-100 text-slate-500' : 'bg-rose-50 text-rose-700 font-bold border border-rose-200'
        }`}>
          {row.is_read ? 'Read' : 'Active Unread'}
        </span>
      )
    },
    {
      header: 'Action',
      render: (row) => !row.is_read ? (
        <button
          onClick={() => handleMarkAsRead(row.id)}
          className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 p-1 rounded hover:bg-emerald-50 transition-colors"
        >
          Mark Read
        </button>
      ) : (
        <span className="text-xs text-slate-400 italic">Dismissed</span>
      )
    }
  ];

  if (loading && alerts.length === 0) {
    return (
      <div className="py-20 flex justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  const unreadCount = alerts.filter(a => !a.is_read).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">System Alerts & Notices</h1>
          <p className="text-sm text-slate-500 mt-1">
            Automated consumption surge monitoring, threshold exceedance notices, and overdue bill warnings.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={handleMarkAllRead} icon={CheckCheck}>
              Mark All Read
            </Button>
          )}
          {isAdmin && (
            <Button size="sm" onClick={handleRunEvaluation} isLoading={isEvaluating} icon={RefreshCw}>
              Evaluate Grid Alerts
            </Button>
          )}
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5 text-xs">
          <span className="font-semibold text-slate-500 uppercase">Severity:</span>
          {['', 'critical', 'warning', 'info'].map(sev => (
            <button
              key={sev}
              onClick={() => setSeverityFilter(sev)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                severityFilter === sev
                  ? 'bg-slate-900 text-white font-semibold'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {sev ? sev.toUpperCase() : 'ALL'}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5 text-xs pl-3 border-l border-slate-200">
          <span className="font-semibold text-slate-500 uppercase">Status:</span>
          <button
            onClick={() => setReadFilter('')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
              readFilter === '' ? 'bg-slate-900 text-white font-semibold' : 'bg-white text-slate-600 border border-slate-200'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setReadFilter('false')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
              readFilter === 'false' ? 'bg-rose-600 text-white font-semibold' : 'bg-white text-slate-600 border border-slate-200'
            }`}
          >
            Unread Only ({unreadCount})
          </button>
        </div>
      </div>

      {/* Alerts Table */}
      <DataTable
        columns={columns}
        data={alerts}
        searchKey="message"
        searchPlaceholder="Search alerts by keyword, category..."
        emptyTitle="No Alerts Active"
        emptyDescription="All consumption telemetries are within normal thresholds and no overdue balances remain."
      />
    </div>
  );
};

export default AlertList;
