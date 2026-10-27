import React, { useState } from 'react';
import Input from '../common/Input';
import Select from '../common/Select';
import Button from '../common/Button';
import { formatCurrency } from '../../utils/formatters';

const PaymentForm = ({ bill, onSubmit, isLoading = false, onCancel }) => {
  const [amount, setAmount] = useState(bill ? bill.outstanding_balance : 0);
  const [paymentMode, setPaymentMode] = useState('upi');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [error, setError] = useState('');

  const paymentModes = [
    { value: 'upi', label: 'UPI / QR Code' },
    { value: 'bank_transfer', label: 'Bank Transfer (NEFT/RTGS)' },
    { value: 'card', label: 'Credit / Debit Card' },
    { value: 'cash', label: 'Cash (Counter Deposit)' }
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    const numAmount = Number(amount);
    if (numAmount <= 0) {
      setError('Payment amount must be greater than zero');
      return;
    }
    if (numAmount > bill.outstanding_balance) {
      setError(`Payment cannot exceed outstanding balance of ${formatCurrency(bill.outstanding_balance)}`);
      return;
    }

    setError('');
    onSubmit({
      bill_id: bill.id,
      amount: numAmount,
      payment_mode: paymentMode,
      reference_number: referenceNumber || `MANUAL-${Date.now().toString().slice(-6)}`
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Bill Overview Banner */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
        <div className="flex justify-between text-slate-600">
          <span>Bill Reference:</span>
          <span className="font-semibold text-slate-900">#{bill.id.slice(0, 8)}</span>
        </div>
        <div className="flex justify-between text-slate-600">
          <span>Total Billed Amount:</span>
          <span className="font-semibold text-slate-900">{formatCurrency(bill.amount)}</span>
        </div>
        <div className="flex justify-between text-slate-600">
          <span>Amount Previously Paid:</span>
          <span className="font-semibold text-emerald-600">{formatCurrency(bill.total_paid || 0)}</span>
        </div>
        <div className="pt-2 border-t border-slate-200 flex justify-between text-sm font-bold text-slate-900">
          <span>Outstanding Balance:</span>
          <span className="text-rose-600">{formatCurrency(bill.outstanding_balance)}</span>
        </div>
      </div>

      <Input
        label="Payment Amount (₹)"
        type="number"
        step="0.01"
        value={amount}
        onChange={(e) => {
          setAmount(e.target.value);
          setError('');
        }}
        error={error}
        helperText={`Max allowable: ${formatCurrency(bill.outstanding_balance)}`}
        required
      />

      <Select
        label="Payment Mode"
        options={paymentModes}
        value={paymentMode}
        onChange={(e) => setPaymentMode(e.target.value)}
        required
      />

      <Input
        label="Transaction Reference Number"
        placeholder="e.g. UPI/20240415/99812 or Receipt No."
        value={referenceNumber}
        onChange={(e) => setReferenceNumber(e.target.value)}
      />

      <p className="text-[11px] text-slate-500 italic">
        Note: This records a verified transaction into the database ledger and automatically updates the bill status.
      </p>

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
        {onCancel && (
          <Button variant="outline" onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>
        )}
        <Button type="submit" isLoading={isLoading}>
          Record Transaction
        </Button>
      </div>
    </form>
  );
};

export default PaymentForm;
