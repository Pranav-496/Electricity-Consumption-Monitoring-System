import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Power, Sliders } from 'lucide-react';
import api from '../../services/api';
import DataTable from '../../components/tables/DataTable';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import Spinner from '../../components/common/Spinner';
import TariffForm from '../../components/forms/TariffForm';
import { useToast } from '../../hooks/useToast';
import { formatCurrency } from '../../utils/formatters';

const TariffList = () => {
  const toast = useToast();
  const [tariffs, setTariffs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingTariff, setEditingTariff] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchTariffs = async () => {
    try {
      setLoading(true);
      const res = await api.get('/tariffs');
      setTariffs(res.data);
    } catch (err) {
      toast.error('Failed to load tariffs: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTariffs();
  }, []);

  const handleCreate = async (formData) => {
    setIsSubmitting(true);
    try {
      await api.post('/tariffs', formData);
      toast.success('Tariff category created successfully');
      setIsAddOpen(false);
      fetchTariffs();
    } catch (err) {
      toast.error(err.message || 'Failed to create tariff');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (formData) => {
    if (!editingTariff) return;
    setIsSubmitting(true);
    try {
      await api.patch(`/tariffs/${editingTariff.id}`, formData);
      toast.success('Tariff updated successfully. Historical bills remain protected.');
      setEditingTariff(null);
      fetchTariffs();
    } catch (err) {
      toast.error(err.message || 'Failed to update tariff');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (tariff) => {
    try {
      const res = await api.patch(`/tariffs/${tariff.id}/status`);
      toast.success(res.message);
      fetchTariffs();
    } catch (err) {
      toast.error('Failed to toggle status: ' + err.message);
    }
  };

  const columns = [
    {
      header: 'Tariff Category',
      accessor: 'name',
      sortable: true,
      render: (row) => (
        <div>
          <p className="font-semibold text-slate-900">{row.name}</p>
          <p className="text-xs text-slate-400 max-w-xs">{row.description}</p>
        </div>
      )
    },
    {
      header: 'Rate per Unit',
      accessor: 'rate_per_unit',
      sortable: true,
      render: (row) => (
        <span className="font-mono font-bold text-sm text-emerald-700">
          ₹{Number(row.rate_per_unit).toFixed(2)} / kWh
        </span>
      )
    },
    {
      header: 'Base Fixed Charge',
      accessor: 'fixed_charge',
      sortable: true,
      render: (row) => (
        <span className="font-mono text-xs text-slate-700">{formatCurrency(row.fixed_charge)}</span>
      )
    },
    {
      header: 'Utility Tax',
      accessor: 'tax_percentage',
      sortable: true,
      render: (row) => (
        <span className="text-xs text-slate-600 font-semibold">{row.tax_percentage}%</span>
      )
    },
    {
      header: 'Status',
      accessor: 'is_active',
      sortable: true,
      render: (row) => (
        <Badge variant={row.is_active ? 'active' : 'inactive'}>
          {row.is_active ? 'Active' : 'Disabled'}
        </Badge>
      )
    },
    {
      header: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setEditingTariff(row)}
            title="Edit Tariff"
            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleToggleStatus(row)}
            title={row.is_active ? 'Deactivate Tariff' : 'Activate Tariff'}
            className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
          >
            <Power className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  if (loading && tariffs.length === 0) {
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
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Tariff Slabs & Pricing</h1>
          <p className="text-sm text-slate-500 mt-1">
            Configure consumption rates, fixed charges, and tax slabs. Historical bills preserve their applied rates.
          </p>
        </div>
        <Button onClick={() => setIsAddOpen(true)} icon={Plus}>
          Add New Tariff Slab
        </Button>
      </div>

      {/* Tariff Table */}
      <DataTable
        columns={columns}
        data={tariffs}
        searchKey="name"
        searchPlaceholder="Search tariffs by name..."
        emptyTitle="No Tariffs Configured"
        emptyDescription="Create at least one tariff category (e.g. Residential Standard) to enable billing calculations."
        emptyActionText="Create Tariff"
        onEmptyAction={() => setIsAddOpen(true)}
      />

      {/* Add Modal */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Create Electricity Tariff Category"
      >
        <TariffForm
          onSubmit={handleCreate}
          isLoading={isSubmitting}
          onCancel={() => setIsAddOpen(false)}
        />
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={Boolean(editingTariff)}
        onClose={() => setEditingTariff(null)}
        title="Update Tariff Pricing Parameters"
      >
        {editingTariff && (
          <TariffForm
            defaultValues={editingTariff}
            onSubmit={handleUpdate}
            isLoading={isSubmitting}
            onCancel={() => setEditingTariff(null)}
          />
        )}
      </Modal>
    </div>
  );
};

export default TariffList;
