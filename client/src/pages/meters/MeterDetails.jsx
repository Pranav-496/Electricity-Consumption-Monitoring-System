import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import Modal from '../../components/common/Modal';
import Spinner from '../../components/common/Spinner';
import Badge from '../../components/common/Badge';
import { formatCurrency, formatUnits, formatDate } from '../../utils/formatters';

const MeterDetailsModal = ({ meterId, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/meters/${meterId}`);
        setData(res.data);
      } catch (err) {
        console.error('Failed to load meter details', err);
      } finally {
        setLoading(false);
      }
    };

    if (meterId) fetchDetails();
  }, [meterId]);

  return (
    <Modal
      isOpen={Boolean(meterId)}
      onClose={onClose}
      title="Smart Meter Telemetry Profile"
      maxWidth="max-w-2xl"
    >
      {loading || !data ? (
        <div className="py-12 flex justify-center">
          <Spinner size="md" />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Hardware Serial</span>
              <h4 className="text-xl font-mono font-bold text-slate-900">{data.meter_number}</h4>
              <p className="text-xs text-slate-600 mt-1">Consumer: {data.consumers?.name} • Type: {data.meter_type}</p>
            </div>
            <div className="text-right">
              <Badge variant={data.meter_status}>{data.meter_status.toUpperCase()}</Badge>
              <p className="text-xs text-slate-500 mt-1">Installed: {formatDate(data.installation_date)}</p>
            </div>
          </div>

          <div>
            <h5 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Recorded Chronological Readings
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
                  {data.readings?.length > 0 ? (
                    data.readings.map((r, i) => (
                      <tr key={i} className="hover:bg-slate-50/60">
                        <td className="p-2.5">{formatDate(r.reading_date)}</td>
                        <td className="p-2.5 font-mono">{r.previous_reading}</td>
                        <td className="p-2.5 font-mono">{r.current_reading}</td>
                        <td className="p-2.5 font-bold text-right text-emerald-700">{r.units_consumed} kWh</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="p-4 text-center text-slate-400">No readings recorded yet</td>
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

export default MeterDetailsModal;
