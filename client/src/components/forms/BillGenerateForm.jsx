import React, { useState, useMemo } from 'react';
import Input from '../common/Input';
import Select from '../common/Select';
import Button from '../common/Button';
import { formatCurrency } from '../../utils/formatters';

const BillGenerateForm = ({ meters = [], readings = [], onSubmit, isLoading = false, onCancel }) => {
  const [selectedMeterId, setSelectedMeterId] = useState('');
  const [selectedReadingDate, setSelectedReadingDate] = useState('');
  const [billDate, setBillDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState(
    new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );

  // Filter available readings for selected meter
  const meterReadings = useMemo(() => {
    if (!selectedMeterId) return [];
    return readings.filter(r => r.meter_id === selectedMeterId);
  }, [readings, selectedMeterId]);

  // Selected reading & tariff calculations
  const targetReading = useMemo(() => {
    return meterReadings.find(r => r.reading_date === selectedReadingDate) || null;
  }, [meterReadings, selectedReadingDate]);

  const targetMeter = useMemo(() => {
    return meters.find(m => m.id === selectedMeterId) || null;
  }, [meters, selectedMeterId]);

  const calculations = useMemo(() => {
    if (!targetReading || !targetMeter || !targetMeter.tariffs) {
      return null;
    }
    const units = Number(targetReading.units_consumed);
    const rate = Number(targetMeter.tariffs.rate_per_unit);
    const fixed = Number(targetMeter.tariffs.fixed_charge || 0);
    const taxPct = Number(targetMeter.tariffs.tax_percentage || 0);

    const energyCharge = units * rate;
    const subtotal = energyCharge + fixed;
    const taxAmount = (subtotal * taxPct) / 100;
    const totalAmount = subtotal + taxAmount;

    return {
      units,
      rate,
      fixed,
      taxPct,
      energyCharge,
      subtotal,
      taxAmount,
      totalAmount
    };
  }, [targetReading, targetMeter]);

  const meterOptions = meters.map(m => ({
    value: m.id,
    label: `${m.meter_number} — ${m.consumers?.name || 'Unassigned'}`
  }));

  const readingOptions = meterReadings.map(r => ({
    value: r.reading_date,
    label: `${r.reading_date} (${r.units_consumed} kWh consumed)`
  }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedMeterId || !selectedReadingDate) return;

    onSubmit({
      meter_id: selectedMeterId,
      reading_date: selectedReadingDate,
      bill_date: billDate,
      due_date: dueDate
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Select
        label="Select Meter"
        placeholder="-- Choose Meter --"
        options={meterOptions}
        value={selectedMeterId}
        onChange={(e) => {
          setSelectedMeterId(e.target.value);
          setSelectedReadingDate('');
        }}
        required
      />

      <Select
        label="Select Eligible Consumption Reading"
        placeholder={selectedMeterId ? '-- Choose Reading Date --' : 'Select a meter first'}
        options={readingOptions}
        value={selectedReadingDate}
        onChange={(e) => setSelectedReadingDate(e.target.value)}
        disabled={!selectedMeterId || readingOptions.length === 0}
        required
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Bill Date"
          type="date"
          value={billDate}
          onChange={(e) => setBillDate(e.target.value)}
          required
        />

        <Input
          label="Due Date"
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          required
        />
      </div>

      {/* Calculated Breakdown Display */}
      {calculations && (
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
          <p className="font-semibold text-slate-800 uppercase tracking-wider text-[11px]">
            Tariff Calculation Preview ({targetMeter.tariffs?.name})
          </p>
          <div className="flex justify-between text-slate-600">
            <span>Energy Charge ({calculations.units} kWh × {formatCurrency(calculations.rate)}):</span>
            <span className="font-semibold">{formatCurrency(calculations.energyCharge)}</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>Base Fixed Charge:</span>
            <span className="font-semibold">{formatCurrency(calculations.fixed)}</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>Utility Tax ({calculations.taxPct}%):</span>
            <span className="font-semibold">{formatCurrency(calculations.taxAmount)}</span>
          </div>
          <div className="pt-2 border-t border-slate-200 flex justify-between text-sm font-bold text-slate-900">
            <span>Final Bill Amount:</span>
            <span className="text-emerald-700">{formatCurrency(calculations.totalAmount)}</span>
          </div>
        </div>
      )}

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
        {onCancel && (
          <Button variant="outline" onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          isLoading={isLoading}
          disabled={!selectedMeterId || !selectedReadingDate || !calculations}
        >
          Generate Official Bill
        </Button>
      </div>
    </form>
  );
};

export default BillGenerateForm;
