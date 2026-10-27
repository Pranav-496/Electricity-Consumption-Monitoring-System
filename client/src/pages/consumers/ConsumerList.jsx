import React, { useState, useEffect } from 'react';
import { UserPlus, Edit2, Power, Eye, Users } from 'lucide-react';
import api from '../../services/api';
import DataTable from '../../components/tables/DataTable';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Spinner from '../../components/common/Spinner';
import ConsumerForm from '../../components/forms/ConsumerForm';
import { useToast } from '../../hooks/useToast';
import ConsumerDetailsModal from './ConsumerDetails';

const ConsumerList = () => {
  const toast = useToast();
  const [consumers, setConsumers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingConsumer, setEditingConsumer] = useState(null);
  const [selectedForView, setSelectedForView] = useState(null);
  const [deactivatingConsumer, setDeactivatingConsumer] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchConsumers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/consumers');
      setConsumers(res.data);
    } catch (err) {
      toast.error('Failed to load consumers: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConsumers();
  }, []);

  const handleCreate = async (formData) => {
    setIsSubmitting(true);
    try {
      await api.post('/consumers', formData);
      toast.success('Consumer registered successfully');
      setIsAddOpen(false);
      fetchConsumers();
    } catch (err) {
      toast.error(err.message || 'Failed to create consumer');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (formData) => {
    if (!editingConsumer) return;
    setIsSubmitting(true);
    try {
      await api.patch(`/consumers/${editingConsumer.id}`, formData);
      toast.success('Consumer updated successfully');
      setEditingConsumer(null);
      fetchConsumers();
    } catch (err) {
      toast.error(err.message || 'Failed to update consumer');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async () => {
    if (!deactivatingConsumer) return;
    setIsSubmitting(true);
    try {
      const res = await api.delete(`/consumers/${deactivatingConsumer.id}`);
      toast.success(res.message || 'Status updated');
      setDeactivatingConsumer(null);
      fetchConsumers();
    } catch (err) {
      toast.error(err.message || 'Failed to update consumer status');
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns = [
    {
      header: 'Consumer Name',
      accessor: 'name',
      sortable: true,
      render: (row) => (
        <div>
          <p className="font-semibold text-slate-900">{row.name}</p>
          <p className="text-xs text-slate-400 truncate max-w-xs">{row.email || 'No email registered'}</p>
        </div>
      )
    },
    {
      header: 'Service Address',
      accessor: 'address',
      sortable: true,
      render: (row) => (
        <span className="text-xs text-slate-600 truncate max-w-sm block">
          {row.address}
        </span>
      )
    },
    {
      header: 'Contact',
      accessor: 'contact',
      sortable: true,
      render: (row) => (
        <span className="font-mono text-xs">{row.contact}</span>
      )
    },
    {
      header: 'Meter Assigned',
      accessor: 'meters',
      render: (row) => {
        const meter = row.meters?.[0];
        return meter ? (
          <span className="font-mono text-xs bg-slate-100 text-slate-800 px-2 py-0.5 rounded border border-slate-200">
            {meter.meter_number}
          </span>
        ) : (
          <span className="text-xs text-amber-600 font-medium italic">Unassigned</span>
        );
      }
    },
    {
      header: 'Status',
      accessor: 'is_active',
      sortable: true,
      render: (row) => (
        <Badge variant={row.is_active ? 'active' : 'inactive'}>
          {row.is_active ? 'Active' : 'Deactivated'}
        </Badge>
      )
    },
    {
      header: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setSelectedForView(row.id)}
            title="View Details"
            className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => setEditingConsumer(row)}
            title="Edit Consumer"
            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setDeactivatingConsumer(row)}
            title={row.is_active ? 'Deactivate Consumer' : 'Activate Consumer'}
            className={`p-1.5 rounded-lg transition-colors ${
              row.is_active
                ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
            }`}
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

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Consumer Management</h1>
          <p className="text-sm text-slate-500 mt-1">
            Register and manage utility accounts, billing addresses, and linked smart meters.
          </p>
        </div>
        <Button onClick={() => setIsAddOpen(true)} icon={UserPlus}>
          Add New Consumer
        </Button>
      </div>

      {/* Consumers Table */}
      <DataTable
        columns={columns}
        data={consumers}
        searchKey="name"
        searchPlaceholder="Search consumers by name, phone, address..."
        emptyTitle="No Consumers Registered"
        emptyDescription="Get started by registering a new electricity consumer into the database."
        emptyActionText="Register Consumer"
        onEmptyAction={() => setIsAddOpen(true)}
      />

      {/* Add Consumer Modal */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Register New Electricity Consumer"
      >
        <ConsumerForm
          onSubmit={handleCreate}
          isLoading={isSubmitting}
          onCancel={() => setIsAddOpen(false)}
        />
      </Modal>

      {/* Edit Consumer Modal */}
      <Modal
        isOpen={Boolean(editingConsumer)}
        onClose={() => setEditingConsumer(null)}
        title="Edit Consumer Information"
      >
        {editingConsumer && (
          <ConsumerForm
            defaultValues={editingConsumer}
            onSubmit={handleUpdate}
            isLoading={isSubmitting}
            onCancel={() => setEditingConsumer(null)}
          />
        )}
      </Modal>

      {/* View Consumer Details Modal */}
      {selectedForView && (
        <ConsumerDetailsModal
          consumerId={selectedForView}
          onClose={() => setSelectedForView(null)}
        />
      )}

      {/* Confirm Deactivation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deactivatingConsumer)}
        onClose={() => setDeactivatingConsumer(null)}
        onConfirm={handleToggleActive}
        isLoading={isSubmitting}
        title={deactivatingConsumer?.is_active ? 'Deactivate Consumer Account' : 'Reactivate Consumer Account'}
        message={
          deactivatingConsumer?.is_active
            ? `Are you sure you want to deactivate ${deactivatingConsumer?.name}? Existing billing and meter history will be preserved without destructive deletion.`
            : `Are you sure you want to reactivate ${deactivatingConsumer?.name}?`
        }
        confirmText={deactivatingConsumer?.is_active ? 'Deactivate' : 'Activate'}
        isDanger={deactivatingConsumer?.is_active}
      />
    </div>
  );
};

export default ConsumerList;
