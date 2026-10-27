import React, { useState, useEffect } from 'react';
import { Plus, Download, Eye, Receipt, DollarSign } from 'lucide-react';
import api from '../../services/api';
import DataTable from '../../components/tables/DataTable';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import Spinner from '../../components/common/Spinner';
import BillGenerateForm from '../../components/forms/BillGenerateForm';
import PaymentForm from '../../components/forms/PaymentForm';
import BillDetailsModal from './BillDetailsModal';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { formatCurrency, formatDate } from '../../utils/formatters';

const BillList = () => {
  const { isAdmin } = useAuth();
  const toast = useToast();
  const [bills, setBills] = useState([]);
  const [meters, setMeters] = useState([]);
  const [readings, setReadings] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [isGenerateOpen, setIsGenerateOpen] = useState(false);
  const [selectedBillForDetails, setSelectedBillForDetails] = useState(null);
  const [payingBill, setPayingBill] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState('');

  const fetchBillingData = async () => {
    try {
      setLoading(true);
      const [bRes, mRes, rRes] = await Promise.all([
        api.get('/bills', { params: statusFilter ? { payment_status: statusFilter } : {} }),
        isAdmin ? api.get('/meters') : Promise.resolve({ data: [] }),
        isAdmin ? api.get('/consumption') : Promise.resolve({ data: [] })
      ]);
      setBills(bRes.data);
      setMeters(mRes.data);
      setReadings(rRes.data);
    } catch (err) {
      toast.error('Failed to load bills: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBillingData();
  }, [statusFilter]);

  const handleGenerateBill = async (formData) => {
    setIsSubmitting(true);
    try {
      await api.post('/bills/generate', formData);
      toast.success('Bill generated successfully with applied tariff rates');
      setIsGenerateOpen(false);
      fetchBillingData();
    } catch (err) {
      toast.error(err.message || 'Failed to generate bill');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRecordPayment = async (paymentData) => {
    setIsSubmitting(true);
    try {
      await api.post('/payments', paymentData);
      toast.success('Payment recorded and bill status updated');
      setPayingBill(null);
      fetchBillingData();
    } catch (err) {
      toast.error(err.message || 'Failed to record payment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownloadPdf = async (billId) => {
    try {
      const response = await api.get(`/bills/${billId}/download`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `bill-${billId.slice(0, 8)}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      toast.error('Failed to download invoice PDF: ' + err.message);
    }
  };

  const columns = [
    {
      header: 'Bill Ref',
      accessor: 'id',
      sortable: true,
      render: (row) => (
        <span className="font-mono text-xs font-bold text-slate-800">
          #{row.id.slice(0, 8)}
        </span>
      )
    },
    {
      header: 'Consumer & Meter',
      accessor: 'meters',
      render: (row) => (
        <div>
          <p className="font-semibold text-slate-900">{row.meters?.consumers?.name || 'Consumer'}</p>
          <p className="text-xs text-slate-400 font-mono">Meter: {row.meters?.meter_number}</p>
        </div>
      )
    },
    {
      header: 'Billing Period',
      accessor: 'billing_period_start',
      sortable: true,
      render: (row) => (
        <span className="text-xs text-slate-600">
          {formatDate(row.billing_period_start)} – {formatDate(row.billing_period_end)}
        </span>
      )
    },
    {
      header: 'Units',
      accessor: 'units_consumed',
      sortable: true,
      render: (row) => (
        <span className="font-mono text-xs font-semibold">{row.units_consumed} kWh</span>
      )
    },
    {
      header: 'Amount Payable',
      accessor: 'amount',
      sortable: true,
      render: (row) => (
        <span className="font-bold text-slate-900">{formatCurrency(row.amount)}</span>
      )
    },
    {
      header: 'Outstanding Balance',
      accessor: 'outstanding_balance',
      sortable: true,
      render: (row) => (
        <span className={`font-bold text-xs ${row.outstanding_balance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
          {formatCurrency(row.outstanding_balance)}
        </span>
      )
    },
    {
      header: 'Due Date',
      accessor: 'due_date',
      sortable: true,
      render: (row) => (
        <span className="text-xs text-slate-600">{formatDate(row.due_date)}</span>
      )
    },
    {
      header: 'Status',
      accessor: 'payment_status',
      sortable: true,
      render: (row) => (
        <Badge variant={row.payment_status}>{row.payment_status.toUpperCase()}</Badge>
      )
    },
    {
      header: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setSelectedBillForDetails(row.id)}
            title="View Breakdown & Receipt"
            className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDownloadPdf(row.id)}
            title="Download PDF Invoice"
            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
          </button>
          {isAdmin && row.outstanding_balance > 0 && (
            <button
              onClick={() => setPayingBill(row)}
              title="Record Payment"
              className="p-1.5 text-slate-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
            >
              <DollarSign className="w-4 h-4" />
            </button>
          )}
        </div>
      )
    }
  ];

  if (loading && bills.length === 0) {
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
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Billing Statements</h1>
          <p className="text-sm text-slate-500 mt-1">
            Tariff-computed billing calculations, taxes, invoice generation, and payment settlement tracking.
          </p>
        </div>
        {isAdmin && (
          <Button onClick={() => setIsGenerateOpen(true)} icon={Plus}>
            Generate New Bill
          </Button>
        )}
      </div>

      {/* Filter by Status */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Status Filter:</span>
        <div className="flex flex-wrap gap-1.5">
          {['', 'unpaid', 'partially_paid', 'paid', 'overdue'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                statusFilter === status
                  ? 'bg-emerald-600 text-white font-semibold'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {status ? status.replace('_', ' ').toUpperCase() : 'ALL BILLS'}
            </button>
          ))}
        </div>
      </div>

      {/* Bills Table */}
      <DataTable
        columns={columns}
        data={bills}
        searchKey="id"
        searchPlaceholder="Search bills by ID, consumer..."
        emptyTitle="No Bills Generated"
        emptyDescription="Generate a bill from recorded consumption telemetry readings."
        emptyActionText={isAdmin ? 'Generate First Bill' : undefined}
        onEmptyAction={isAdmin ? () => setIsGenerateOpen(true) : undefined}
      />

      {/* Generate Bill Modal */}
      <Modal
        isOpen={isGenerateOpen}
        onClose={() => setIsGenerateOpen(false)}
        title="Generate Electricity Bill (Tariff Calculator)"
      >
        <BillGenerateForm
          meters={meters}
          readings={readings}
          onSubmit={handleGenerateBill}
          isLoading={isSubmitting}
          onCancel={() => setIsGenerateOpen(false)}
        />
      </Modal>

      {/* Record Payment Modal */}
      <Modal
        isOpen={Boolean(payingBill)}
        onClose={() => setPayingBill(null)}
        title="Record Payment Transaction"
      >
        {payingBill && (
          <PaymentForm
            bill={payingBill}
            onSubmit={handleRecordPayment}
            isLoading={isSubmitting}
            onCancel={() => setPayingBill(null)}
          />
        )}
      </Modal>

      {/* View Bill Details Modal */}
      {selectedBillForDetails && (
        <BillDetailsModal
          billId={selectedBillForDetails}
          onClose={() => setSelectedBillForDetails(null)}
          onPaymentSuccess={fetchBillingData}
        />
      )}
    </div>
  );
};

export default BillList;
