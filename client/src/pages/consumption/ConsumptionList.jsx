import React, { useState, useEffect } from 'react';
import { Plus, Activity, AlertTriangle } from 'lucide-react';
import api from '../../services/api';
import DataTable from '../../components/tables/DataTable';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import Spinner from '../../components/common/Spinner';
import ReadingForm from '../../components/forms/ReadingForm';
import ConsumptionChart from '../../components/charts/ConsumptionChart';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { formatDate } from '../../utils/formatters';

const ConsumptionList = () => {
  const { isAdmin } = useAuth();
  const toast = useToast();
  const [readings, setReadings] = useState([]);
  const [meters, setMeters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filters
  const [selectedMeterId, setSelectedMeterId] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [readRes, mRes] = await Promise.all([
        api.get('/consumption', { params: selectedMeterId ? { meter_id: selectedMeterId } : {} }),
        api.get('/meters')
      ]);
      setReadings(readRes.data);
      setMeters(mRes.data);
    } catch (err) {
      toast.error('Failed to load consumption records: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedMeterId]);

  const handleCreateReading = async (formData) => {
    setIsSubmitting(true);
    try {
      const res = await api.post('/consumption', formData);
      toast.success('Reading recorded successfully');
      if (res.data?.alerts_triggered?.length > 0) {
        toast.warning(`Alert Triggered: ${res.data.alerts_triggered[0].alert_type}`);
      }
      setIsAddOpen(false);
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Failed to record meter reading');
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns = [
    {
      header: 'Reading Date',
      accessor: 'reading_date',
      sortable: true,
      render: (row) => (
        <span className="font-medium text-slate-800">{formatDate(row.reading_date)}</span>
      )
    },
    {
      header: 'Meter Number',
      accessor: 'meter_number',
      sortable: true,
      render: (row) => (
        <span className="font-mono text-xs bg-slate-100 text-slate-800 px-2 py-0.5 rounded border border-slate-200">
          {row.meter_number}
        </span>
      )
    },
    {
      header: 'Consumer',
      accessor: 'consumer_name',
      sortable: true,
      render: (row) => (
        <span className="text-xs font-semibold text-slate-700">{row.consumer_name || 'N/A'}</span>
      )
    },
    {
      header: 'Previous (kWh)',
      accessor: 'previous_reading',
      render: (row) => (
        <span className="font-mono text-xs text-slate-600">{Number(row.previous_reading).toFixed(2)}</span>
      )
    },
    {
      header: 'Current (kWh)',
      accessor: 'current_reading',
      render: (row) => (
        <span className="font-mono text-xs text-slate-900 font-semibold">{Number(row.current_reading).toFixed(2)}</span>
      )
    },
    {
      header: 'Units Consumed (Derived)',
      accessor: 'units_consumed',
      sortable: true,
      render: (row) => {
        const isSpike = row.units_consumed > 500;
        return (
          <div className="flex items-center gap-1.5">
            <span className={`font-mono text-sm font-bold ${isSpike ? 'text-amber-700' : 'text-emerald-700'}`}>
              {Number(row.units_consumed).toFixed(2)} kWh
            </span>
            {isSpike && (
              <span title="High Consumption Spike (> 500 kWh)">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              </span>
            )}
          </div>
        );
      }
    }
  ];

  // Chart data from sorted readings
  const chartData = [...readings]
    .sort((a, b) => new Date(a.reading_date) - new Date(b.reading_date))
    .map(r => ({
      date: r.reading_date,
      consumption: r.units_consumed
    }));

  if (loading && readings.length === 0) {
    return (
      <div className="py-20 flex justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Consumption Telemetry</h1>
          <p className="text-sm text-slate-500 mt-1">
            Periodic electricity meter readings, chronological cumulative progression, and derived unit calculations.
          </p>
        </div>
        {isAdmin && (
          <Button onClick={() => setIsAddOpen(true)} icon={Plus}>
            Record Meter Reading
          </Button>
        )}
      </div>

      {/* Chart Section */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <h2 className="text-sm font-bold text-slate-900 mb-1">Consumption Telemetry Curve</h2>
        <p className="text-xs text-slate-500 mb-4">Chronological units consumed per reading period</p>
        <ConsumptionChart data={chartData} xKey="date" />
      </div>

      {/* Filter and Table */}
      {isAdmin && meters.length > 1 && (
        <div className="flex items-center gap-3">
          <select
            value={selectedMeterId}
            onChange={(e) => setSelectedMeterId(e.target.value)}
            className="bg-white text-xs border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="">All Meters Telemetry</option>
            {meters.map(m => (
              <option key={m.id} value={m.id}>
                {m.meter_number} — {m.consumers?.name || 'Unassigned'}
              </option>
            ))}
          </select>
        </div>
      )}

      <DataTable
        columns={columns}
        data={readings}
        searchKey="meter_number"
        searchPlaceholder="Search readings by meter number, consumer..."
        emptyTitle="No Readings Available"
        emptyDescription="Enter periodic readings for assigned meters to automatically derive consumption."
        emptyActionText={isAdmin ? 'Record First Reading' : undefined}
        onEmptyAction={isAdmin ? () => setIsAddOpen(true) : undefined}
      />

      {/* Add Reading Modal */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Record Periodic Meter Reading"
      >
        <ReadingForm
          meters={meters}
          onSubmit={handleCreateReading}
          isLoading={isSubmitting}
          onCancel={() => setIsAddOpen(false)}
        />
      </Modal>
    </div>
  );
};

export default ConsumptionList;
