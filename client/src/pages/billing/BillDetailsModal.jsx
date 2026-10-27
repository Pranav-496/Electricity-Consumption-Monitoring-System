import React, { useState, useEffect } from 'react';
import { Download, Printer, CheckCircle } from 'lucide-react';
import api from '../../services/api';
import Modal from '../../components/common/Modal';
import Spinner from '../../components/common/Spinner';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import { useToast } from '../../hooks/useToast';
import { formatCurrency, formatDate } from '../../utils/formatters';

const BillDetailsModal = ({ billId, onClose, onPaymentSuccess }) => {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [bill, setBill] = useState(null);

  useEffect(() => {
    const fetchBill = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/bills/${billId}`);
        setBill(res.data);
      } catch (err) {
        console.error('Failed to load bill details', err);
      } finally {
        setLoading(false);
      }
    };

    if (billId) fetchBill();
  }, [billId]);

  const handleDownloadPdf = async () => {
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

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal
      isOpen={Boolean(billId)}
      onClose={onClose}
      title="Official Utility Billing Statement"
      maxWidth="max-w-2xl"
    >
      {loading || !bill ? (
        <div className="py-12 flex justify-center">
          <Spinner size="md" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Top Actions */}
          <div className="flex items-center justify-end gap-2 no-print">
            <Button size="sm" variant="outline" onClick={handlePrint} icon={Printer}>
              Print Statement
            </Button>
            <Button size="sm" onClick={handleDownloadPdf} icon={Download}>
              Download PDF
            </Button>
          </div>

          {/* Official Invoice Card */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 text-slate-800 shadow-sm space-y-6">
            {/* Brand Banner */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-xl font-black tracking-tight text-emerald-800">POWERGRID SYSTEM</h3>
                <p className="text-[11px] text-slate-500 uppercase tracking-widest font-semibold">Electricity Consumption Statement</p>
              </div>
              <div className="text-right">
                <span className="font-mono text-sm font-bold text-slate-900 block">#{bill.id.slice(0, 8)}</span>
                <Badge variant={bill.payment_status}>{bill.payment_status.toUpperCase()}</Badge>
              </div>
            </div>

            {/* Consumer and Meter Metadata */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Billed Consumer</p>
                <p className="font-bold text-slate-900 text-sm mt-0.5">{bill.meters?.consumers?.name || 'Consumer'}</p>
                <p className="text-slate-600 mt-0.5">{bill.meters?.consumers?.address}</p>
                <p className="text-slate-500 font-mono mt-0.5">{bill.meters?.consumers?.contact}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Account Details</p>
                <p className="font-mono font-bold text-slate-900 mt-0.5">Meter: {bill.meters?.meter_number}</p>
                <p className="text-slate-600 mt-0.5">Bill Date: {formatDate(bill.bill_date)}</p>
                <p className="text-rose-600 font-semibold mt-0.5">Due Date: {formatDate(bill.due_date)}</p>
              </div>
            </div>

            {/* Reading and Consumption Details */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs flex justify-between">
              <div>
                <span className="text-slate-500">Billing Cycle:</span>
                <span className="font-semibold text-slate-800 ml-1.5">
                  {bill.billing_period_start} to {bill.billing_period_end}
                </span>
              </div>
              <div>
                <span className="text-slate-500">Total Units Consumed:</span>
                <span className="font-bold text-emerald-700 ml-1.5">{bill.units_consumed} kWh</span>
              </div>
            </div>

            {/* Charges Breakdown */}
            <div className="space-y-2 text-xs">
              <h5 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">Tariff Calculation Breakdown</h5>
              <div className="flex justify-between text-slate-600 py-1 border-b border-slate-100">
                <span>Energy Charges ({bill.units_consumed} kWh @ ₹{bill.rate_per_unit}/kWh):</span>
                <span className="font-mono font-semibold">₹{(bill.units_consumed * bill.rate_per_unit).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-600 py-1 border-b border-slate-100">
                <span>Base Fixed Charge:</span>
                <span className="font-mono font-semibold">₹{Number(bill.fixed_charge).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-600 py-1 border-b border-slate-100">
                <span>Applicable Utility Tax:</span>
                <span className="font-mono font-semibold">₹{Number(bill.tax_amount).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-slate-900 pt-2 border-t border-slate-200">
                <span>Total Amount Payable:</span>
                <span className="font-mono text-emerald-700">{formatCurrency(bill.amount)}</span>
              </div>
              <div className="flex justify-between text-xs font-semibold py-1">
                <span className="text-slate-600">Total Recorded Payments:</span>
                <span className="font-mono text-emerald-600">{formatCurrency(bill.total_paid || 0)}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-rose-600 pt-1">
                <span>Outstanding Balance Due:</span>
                <span className="font-mono">{formatCurrency(bill.outstanding_balance)}</span>
              </div>
            </div>

            {/* Payment History Table */}
            {bill.payments && bill.payments.length > 0 && (
              <div className="pt-2">
                <h5 className="font-bold text-slate-900 uppercase tracking-wider text-[10px] mb-2">Recorded Payments Ledger</h5>
                <div className="border border-slate-200 rounded-lg overflow-hidden text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-500">
                      <tr>
                        <th className="p-2">Date</th>
                        <th className="p-2">Mode</th>
                        <th className="p-2">Reference</th>
                        <th className="p-2 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {bill.payments.map((p, i) => (
                        <tr key={i}>
                          <td className="p-2">{formatDate(p.payment_date)}</td>
                          <td className="p-2 uppercase font-medium">{p.payment_mode}</td>
                          <td className="p-2 font-mono text-[11px] text-slate-500">{p.reference_number || 'N/A'}</td>
                          <td className="p-2 text-right font-bold text-emerald-600">{formatCurrency(p.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
};

export default BillDetailsModal;
