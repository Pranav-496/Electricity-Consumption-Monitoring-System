import React, { useState, useEffect } from 'react';
import { CreditCard, DollarSign } from 'lucide-react';
import api from '../../services/api';
import DataTable from '../../components/tables/DataTable';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Spinner from '../../components/common/Spinner';
import PaymentForm from '../../components/forms/PaymentForm';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { formatCurrency, formatDateTime } from '../../utils/formatters';

const PaymentList = () => {
  const { isAdmin } = useAuth();
  const toast = useToast();
  const [payments, setPayments] = useState([]);
  const [unpaidBills, setUnpaidBills] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [selectedBillForPayment, setSelectedBillForPayment] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modeFilter, setModeFilter] = useState('');

  const fetchPaymentsData = async () => {
    try {
      setLoading(true);
      const [payRes, billRes] = await Promise.all([
        api.get('/payments', { params: modeFilter ? { payment_mode: modeFilter } : {} }),
        isAdmin ? api.get('/bills') : Promise.resolve({ data: [] })
      ]);
      setPayments(payRes.data);
      if (isAdmin) {
        setUnpaidBills(billRes.data.filter(b => b.outstanding_balance > 0));
      }
    } catch (err) {
      toast.error('Failed to load payments: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPaymentsData();
  }, [modeFilter]);

  const handleRecordPayment = async (formData) => {
    setIsSubmitting(true);
    try {
      await api.post('/payments', formData);
      toast.success('Payment recorded and bill balance reconciled');
      setSelectedBillForPayment(null);
      fetchPaymentsData();
    } catch (err) {
      toast.error(err.message || 'Failed to record payment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns = [
    {
      header: 'Payment Date',
      accessor: 'payment_date',
      sortable: true,
      render: (row) => (
        <span className="text-xs text-slate-800">{formatDateTime(row.payment_date)}</span>
      )
    },
    {
      header: 'Bill Reference',
      accessor: 'bill_id',
      sortable: true,
      render: (row) => (
        <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
          #{row.bill_id ? row.bill_id.slice(0, 8) : 'N/A'}
        </span>
      )
    },
    {
      header: 'Consumer Account',
      accessor: 'consumer_name',
      render: (row) => {
        const name = row.bills?.meters?.consumers?.name;
        return <span className="font-semibold text-xs text-slate-800">{name || 'Consumer'}</span>;
      }
    },
    {
      header: 'Payment Mode',
      accessor: 'payment_mode',
      sortable: true,
      render: (row) => (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700 uppercase border border-slate-200">
          {row.payment_mode}
        </span>
      )
    },
    {
      header: 'Reference / Transaction ID',
      accessor: 'reference_number',
      render: (row) => (
        <span className="font-mono text-xs text-slate-500">{row.reference_number || 'N/A'}</span>
      )
    },
    {
      header: 'Amount Collected',
      accessor: 'amount',
      sortable: true,
      render: (row) => (
        <span className="font-mono font-bold text-sm text-emerald-700">
          {formatCurrency(row.amount)}
        </span>
      )
    }
  ];

  if (loading && payments.length === 0) {
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
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Payment Transactions</h1>
          <p className="text-sm text-slate-500 mt-1">
            Recorded utility payment transactions, receipts, and outstanding invoice balance settlements.
          </p>
        </div>
        {isAdmin && unpaidBills.length > 0 && (
          <Button onClick={() => setSelectedBillForPayment(unpaidBills[0])} icon={DollarSign}>
            Record Bill Payment
          </Button>
        )}
      </div>

      {/* Mode Filters */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Mode Filter:</span>
        <div className="flex flex-wrap gap-1.5">
          {['', 'upi', 'bank_transfer', 'card', 'cash'].map((mode) => (
            <button
              key={mode}
              onClick={() => setModeFilter(mode)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                modeFilter === mode
                  ? 'bg-emerald-600 text-white font-semibold'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {mode ? mode.replace('_', ' ').toUpperCase() : 'ALL MODES'}
            </button>
          ))}
        </div>
      </div>

      {/* Notice Banner */}
      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500 flex items-center justify-between">
        <span>Payment records in this academic DBMS micro-project are persistent verified transactions and do not process real bank transfers.</span>
      </div>

      {/* Payments Table */}
      <DataTable
        columns={columns}
        data={payments}
        searchKey="reference_number"
        searchPlaceholder="Search payments by reference number, bill ID..."
        emptyTitle="No Payments Recorded"
        emptyDescription="Transactions recorded against electricity bills will appear here in the verified ledger."
      />

      {/* Record Payment Modal */}
      <Modal
        isOpen={Boolean(selectedBillForPayment)}
        onClose={() => setSelectedBillForPayment(null)}
        title="Record Bill Payment Transaction"
      >
        {selectedBillForPayment && (
          <div>
            {/* Bill Selector if multiple bills have balance */}
            {unpaidBills.length > 1 && (
              <div className="mb-4">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                  Select Bill with Outstanding Balance
                </label>
                <select
                  value={selectedBillForPayment.id}
                  onChange={(e) => {
                    const chosen = unpaidBills.find(b => b.id === e.target.value);
                    if (chosen) setSelectedBillForPayment(chosen);
                  }}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2 bg-white"
                >
                  {unpaidBills.map(b => (
                    <option key={b.id} value={b.id}>
                      #{b.id.slice(0, 8)} — {b.meters?.consumers?.name} (Due: {b.due_date}, Bal: {formatCurrency(b.outstanding_balance)})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <PaymentForm
              bill={selectedBillForPayment}
              onSubmit={handleRecordPayment}
              isLoading={isSubmitting}
              onCancel={() => setSelectedBillForPayment(null)}
            />
          </div>
        )}
      </Modal>
    </div>
  );
};

export default PaymentList;
