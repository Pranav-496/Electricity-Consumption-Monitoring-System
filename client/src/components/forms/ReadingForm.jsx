import React, { useMemo } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Input from '../common/Input';
import Select from '../common/Select';
import Button from '../common/Button';
import { Zap, AlertTriangle } from 'lucide-react';

const readingSchema = z.object({
  meter_id: z.string().min(1, 'Please select a meter'),
  reading_date: z.string().min(1, 'Reading date is required'),
  previous_reading: z.coerce.number().min(0, 'Previous reading cannot be negative'),
  current_reading: z.coerce.number().min(0, 'Current reading cannot be negative')
}).refine(data => data.current_reading >= data.previous_reading, {
  message: 'Current reading cannot be lower than previous cumulative reading',
  path: ['current_reading']
});

const ReadingForm = ({ meters = [], onSubmit, isLoading = false, onCancel }) => {
  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(readingSchema),
    defaultValues: {
      meter_id: '',
      reading_date: new Date().toISOString().split('T')[0],
      previous_reading: 0,
      current_reading: 0
    }
  });

  const selectedMeterId = useWatch({ control, name: 'meter_id' });
  const prevReading = useWatch({ control, name: 'previous_reading' });
  const currReading = useWatch({ control, name: 'current_reading' });

  // When meter changes, look up its latest reading to auto-populate previous reading
  const handleMeterChange = (e) => {
    const mId = e.target.value;
    setValue('meter_id', mId);
    const meter = meters.find(m => m.id === mId);
    if (meter && meter.readings && meter.readings.length > 0) {
      const sorted = [...meter.readings].sort((a, b) => new Date(b.reading_date) - new Date(a.reading_date));
      const latestCurrent = sorted[0].current_reading;
      setValue('previous_reading', Number(latestCurrent));
      setValue('current_reading', Number(latestCurrent));
    }
  };

  // Derive units consumed live
  const calculatedUnits = useMemo(() => {
    const prev = Number(prevReading || 0);
    const curr = Number(currReading || 0);
    return Math.max(0, curr - prev);
  }, [prevReading, currReading]);

  const isHighConsumption = calculatedUnits > 500;
  const isInvalidProgression = Number(currReading) < Number(prevReading);

  const meterOptions = meters.map(m => ({
    value: m.id,
    label: `${m.meter_number} — ${m.consumers?.name || 'Unassigned'} (${m.meter_status})`
  }));

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Select
        label="Select Meter"
        placeholder="-- Choose Active Meter --"
        options={meterOptions}
        error={errors.meter_id?.message}
        onChange={handleMeterChange}
      />

      <Input
        label="Reading Date"
        type="date"
        error={errors.reading_date?.message}
        {...register('reading_date')}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Previous Cumulative Reading (kWh)"
          type="number"
          step="0.01"
          error={errors.previous_reading?.message}
          {...register('previous_reading')}
        />

        <Input
          label="Current Cumulative Reading (kWh)"
          type="number"
          step="0.01"
          error={errors.current_reading?.message}
          {...register('current_reading')}
        />
      </div>

      {/* Real-time Derived Attribute Preview Box */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-emerald-600" />
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">
              Calculated Units Consumed (Derived)
            </span>
          </div>
          <span className="text-xl font-bold text-slate-900">
            {calculatedUnits.toFixed(2)} kWh
          </span>
        </div>

        {isInvalidProgression && (
          <p className="mt-2 text-xs text-rose-600 font-medium">
            Warning: Current reading cannot be less than previous reading.
          </p>
        )}

        {isHighConsumption && (
          <div className="mt-2 flex items-center gap-2 p-2 rounded-lg bg-amber-50 text-amber-800 text-xs border border-amber-200">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
            <span>High Consumption Alert (&gt; 500 kWh threshold) will be automatically triggered upon submission.</span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
        {onCancel && (
          <Button variant="outline" onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>
        )}
        <Button type="submit" isLoading={isLoading} disabled={isInvalidProgression}>
          Record Meter Reading
        </Button>
      </div>
    </form>
  );
};

export default ReadingForm;
