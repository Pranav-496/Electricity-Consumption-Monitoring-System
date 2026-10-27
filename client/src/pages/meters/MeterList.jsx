import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Power, Eye, Gauge } from 'lucide-react';
import api from '../../services/api';
import DataTable from '../../components/tables/DataTable';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import Spinner from '../../components/common/Spinner';
import MeterForm from '../../components/forms/MeterForm';
import { useToast } from '../../hooks/useToast';
import MeterDetailsModal from './MeterDetails';
import { formatDate } from '../../utils/formatters';

const MeterList = () => {
  const toast = useToast();
  const [meters, setMeters] = useState([]);
  const [consumers, setConsumers] = useState([]);
  const [tariffs, setTariffs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingMeter, setEditingMeter] = useState(null);
  const [selectedForView, setSelectedForView] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchMeterData = async () => {
    try {
      setLoading(true);
      const [mRes, cRes, tRes] = await Promise.all([
        api.get('/meters'),
        api.get('/consumers'),
        api.get('/tariffs')
      ]);
      setMeters(mRes.data);
      setConsumers(cRes.data);
      setTariffs(tRes.data);
    } catch (err) {
      toast.error('Failed to load meter records: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeterData();
  }, []);

  const handleCreate = async (formData) => {
    setIsSubmitting(true);
    try {
      await api.post('/meters', formData);
      toast.success('Meter assigned successfully');
      setIsAddOpen(false);
      fetchMeterData();
    } catch (err) {
      toast.error(err.message || 'Failed to create meter');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (formData) => {
    if (!editingMeter) return;
    setIsSubmitting(true);
    try {
      await api.patch(`/meters/${editingMeter.id}`, formData);
      toast.success('Meter updated successfully');
      setEditingMeter(null);
      fetchMeterData();
    } catch (err) {
      toast.error(err.message || 'Failed to update meter');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (meter) => {
    try {
      const res = await api.patch(`/meters/${meter.id}/status`);
      toast.success(res.message);
      fetchMeterData();
    } catch (err) {
      toast.error('Failed to toggle meter status: ' + err.message);
    }
  };

  const columns = [
    {
      header: 'Meter Number',
      accessor: 'meter_number',
      sortable: true,
      render: (row) => (
        <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
          {row.meter_number}
        </span>
      )
    },
    {
      header: 'Assigned Consumer (1:1)',
      accessor: 'consumers',
      sortable: true,
      render: (row) => (
        <div>
          <p className="font-semibold text-slate-900">{row.consumers?.name || 'Unassigned'}</p>
          <p className="text-xs text-slate-400">{row.consumers?.contact}</p>
        </div>
      )
    },
    {
      header: 'Meter Type',
      accessor: 'meter_type',
      sortable: true,
      render: (row) => (
        <span className="text-xs font-medium text-slate-700">{row.meter_type}</span>
      )
    },
    {
      header: 'Assigned Tariff',
      accessor: 'tariffs',
      render: (row) => (
        <span className="text-xs text-slate-600 font-medium">
          {row.tariffs?.name} (₹{row.tariffs?.rate_per_unit}/kWh)
        </span>
      )
    },
    {
      header: 'Installed Date',
      accessor: 'installation_date',
      sortable: true,
      render: (row) => (
        <span className="text-xs text-slate-500">{formatDate(row.installation_date)}</span>
      )
    },
    {
      header: 'Status',
      accessor: 'meter_status',
      sortable: true,
      render: (row) => (
        <Badge variant={row.meter_status}>
          {row.meter_status.toUpperCase()}
        </Badge>
      )
    },
    {
      header: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setSelectedForView(row.id)}
            title="View Readings & Invoices"
            className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => setEditingMeter(row)}
            title="Edit Meter"
            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleToggleStatus(row)}
            title="Toggle Status (Active/Inactive)"
            className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
          >
            <Power className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  if (loading) {
    return (
      <div className="py-20 flex justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  // Filter out consumers that already have a meter assigned for the Add dialog
  const availableConsumers = consumers.filter(
    c => !meters.some(m => m.consumer_id === c.id)
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Meter Management</h1>
          <p className="text-sm text-slate-500 mt-1">
            Maintain electricity telemetry hardware, consumer 1:1 assignments, and tariff classifications.
          </p>
        </div>
        <Button onClick={() => setIsAddOpen(true)} icon={Plus}>
          Register New Meter
        </Button>
      </div>

      {/* Meter Table */}
      <DataTable
        columns={columns}
        data={meters}
        searchKey="meter_number"
        searchPlaceholder="Search by meter number, type..."
        emptyTitle="No Meters Registered"
        emptyDescription="Register a smart meter and assign it to a consumer to begin telemetry recording."
        emptyActionText="Register Meter"
        onEmptyAction={() => setIsAddOpen(true)}
      />

      {/* Add Meter Modal */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Register & Assign Smart Meter"
      >
        <MeterForm
          consumers={availableConsumers}
          tariffs={tariffs}
          onSubmit={handleCreate}
          isLoading={isSubmitting}
          onCancel={() => setIsAddOpen(false)}
        />
      </Modal>

      {/* Edit Meter Modal */}
      <Modal
        isOpen={Boolean(editingMeter)}
        onClose={() => setEditingMeter(null)}
        title="Update Meter Configuration"
      >
        {editingMeter && (
          <MeterForm
            defaultValues={editingMeter}
            consumers={consumers}
            tariffs={tariffs}
            onSubmit={handleUpdate}
            isLoading={isSubmitting}
            onCancel={() => setEditingMeter(null)}
          />
        )}
      </Modal>

      {/* View Meter Details Modal */}
      {selectedForView && (
        <MeterDetailsModal
          meterId={selectedForView}
          onClose={() => setSelectedForView(null)}
        />
      )}
    </div>
  );
};

export default MeterList;
