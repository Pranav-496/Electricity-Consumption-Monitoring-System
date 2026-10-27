import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import Modal from '../../components/common/Modal';
import Spinner from '../../components/common/Spinner';
import Badge from '../../components/common/Badge';
import { formatCurrency, formatUnits, formatDate } from '../../utils/formatters';

const ConsumerDetailsModal = ({ consumerId, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/consumers/${consumerId}`);
        setData(res.data);
      } catch (err) {
        console.error('Failed to load consumer details', err);
      } finally {
        setLoading(false);
      }
    };

    if (consumerId) fetchDetails();
  }, [consumerId]);

  return (
    <Modal
      isOpen={Boolean(consumerId)}
      onClose={onClose}
      title="Consumer Account & Meter Profile"
      maxWidth="max-w-3xl"
    >
      {loading || !data ? (
        <div className="py-12 flex justify-center">
          <Spinner size="md" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Header Card */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-lg font-bold text-slate-900">{data.name}</h4>
                <Badge variant={data.is_active ? 'active' : 'inactive'}>
                  {data.is_active ? 'Active' : 'Deactivated'}
                </Badge>
              </div>
              <p className="text-xs text-slate-500 mt-1">{data.address}</p>
              <p className="text-xs text-slate-600 font-mono mt-0.5">Contact: {data.contact} • {data.email || 'No email'}</p>
            </div>
            {data.meters && data.meters.length > 0 && (
              <div className="p-3 bg-white rounded-lg border border-slate-200 text-xs shrink-0">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Meter Assigned</span>
                <span className="font-mono font-bold text-slate-900">{data.meters[0].meter_number}</span>
                <span className="block text-slate-500 text-[11px]">{data.meters[0].meter_type}</span>
              </div>
            )}
          </div>

          {/* Consumption History Table */}
          <div>
            <h5 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Recent Consumption Telemetry
            </h5>
            <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                  <tr>
                    <th className="p-2.5">Date</th>
                    <th className="p-2.5">Previous (kWh)</th>
                    <th className="p-2.5">Current (kWh)</th>
                    <th className="p-2.5 text-right">Units Consumed</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.consumption_history?.length > 0 ? (
                    data.consumption_history.slice(0, 5).map((r, i) => (
                      <tr key={i} className="hover:bg-slate-50/60">
                        <td className="p-2.5">{formatDate(r.reading_date)}</td>
                        <td className="p-2.5 font-mono">{r.previous_reading}</td>
                        <td className="p-2.5 font-mono">{r.current_reading}</td>
                        <td className="p-2.5 font-bold text-right text-emerald-700">{r.units_consumed} kWh</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="p-4 text-center text-slate-400">No consumption records available</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Bill History Table */}
          <div>
            <h5 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Billing Statements & Payments
            </h5>
            <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                  <tr>
                    <th className="p-2.5">Bill Ref</th>
                    <th className="p-2.5">Bill Date</th>
                    <th className="p-2.5">Units</th>
                    <th className="p-2.5">Total Amount</th>
                    <th className="p-2.5">Outstanding</th>
                    <th className="p-2.5 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.bill_history?.length > 0 ? (
                    data.bill_history.map((b, i) => (
                      <tr key={i} className="hover:bg-slate-50/60">
                        <td className="p-2.5 font-mono">#{b.id.slice(0, 8)}</td>
                        <td className="p-2.5">{formatDate(b.bill_date)}</td>
                        <td className="p-2.5 font-semibold">{b.units_consumed} kWh</td>
                        <td className="p-2.5 font-bold">{formatCurrency(b.amount)}</td>
                        <td className="p-2.5 font-semibold text-rose-600">{formatCurrency(b.outstanding_balance)}</td>
                        <td className="p-2.5 text-right">
                          <Badge variant={b.payment_status}>{b.payment_status}</Badge>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="p-4 text-center text-slate-400">No bills recorded</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default ConsumerDetailsModal;
