import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Input from '../common/Input';
import Select from '../common/Select';
import Button from '../common/Button';

const meterSchema = z.object({
  meter_number: z.string().min(3, 'Meter number is required'),
  consumer_id: z.string().min(1, 'Please select a consumer'),
  tariff_id: z.string().min(1, 'Please select a tariff'),
  meter_type: z.string().default('Smart Meter'),
  meter_status: z.string().default('active'),
  installation_date: z.string().optional()
});

const MeterForm = ({ defaultValues, consumers = [], tariffs = [], onSubmit, isLoading = false, onCancel }) => {
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(meterSchema),
    defaultValues: defaultValues || {
      meter_number: '',
      consumer_id: '',
      tariff_id: '',
      meter_type: 'Smart Meter',
      meter_status: 'active',
      installation_date: new Date().toISOString().split('T')[0]
    }
  });

  const consumerOptions = consumers.map(c => ({
    value: c.id,
    label: `${c.name} (${c.contact})`
  }));

  const tariffOptions = tariffs.map(t => ({
    value: t.id,
    label: `${t.name} (₹${t.rate_per_unit}/kWh + ₹${t.fixed_charge} fixed)`
  }));

  const meterTypeOptions = [
    { value: 'Smart Meter', label: 'Smart Meter' },
    { value: 'Single Phase', label: 'Single Phase' },
    { value: 'Three Phase', label: 'Three Phase' },
    { value: 'Digital', label: 'Digital' },
    { value: 'Analog', label: 'Analog' }
  ];

  const meterStatusOptions = [
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'maintenance', label: 'Under Maintenance' }
  ];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input
        label="Meter Serial Number"
        placeholder="e.g. MTR-2024-009"
        error={errors.meter_number?.message}
        {...register('meter_number')}
      />

      <Select
        label="Assign to Consumer (1:1 Relationship)"
        placeholder="-- Choose Consumer --"
        options={consumerOptions}
        error={errors.consumer_id?.message}
        disabled={Boolean(defaultValues)} // Cannot reassign meter to another consumer under 1:1 once set
        {...register('consumer_id')}
      />

      <Select
        label="Applicable Tariff Slab"
        placeholder="-- Choose Tariff --"
        options={tariffOptions}
        error={errors.tariff_id?.message}
        {...register('tariff_id')}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Select
          label="Meter Hardware Type"
          options={meterTypeOptions}
          error={errors.meter_type?.message}
          {...register('meter_type')}
        />

        <Select
          label="Operational Status"
          options={meterStatusOptions}
          error={errors.meter_status?.message}
          {...register('meter_status')}
        />
      </div>

      <Input
        label="Installation Date"
        type="date"
        error={errors.installation_date?.message}
        {...register('installation_date')}
      />

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
        {onCancel && (
          <Button variant="outline" onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>
        )}
        <Button type="submit" isLoading={isLoading}>
          {defaultValues ? 'Update Meter' : 'Register & Assign Meter'}
        </Button>
      </div>
    </form>
  );
};

export default MeterForm;
