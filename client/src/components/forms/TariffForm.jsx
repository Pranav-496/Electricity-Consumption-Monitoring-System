import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Input from '../common/Input';
import Button from '../common/Button';

const tariffSchema = z.object({
  name: z.string().min(2, 'Tariff name is required'),
  description: z.string().optional(),
  rate_per_unit: z.coerce.number().min(0, 'Rate per unit must be non-negative'),
  fixed_charge: z.coerce.number().min(0, 'Fixed charge must be non-negative'),
  tax_percentage: z.coerce.number().min(0).max(100, 'Tax percentage must be between 0 and 100')
});

const TariffForm = ({ defaultValues, onSubmit, isLoading = false, onCancel }) => {
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(tariffSchema),
    defaultValues: defaultValues || {
      name: '',
      description: '',
      rate_per_unit: 5.5,
      fixed_charge: 100,
      tax_percentage: 5
    }
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input
        label="Tariff Category Name"
        placeholder="e.g. Residential Standard or Commercial Peak"
        error={errors.name?.message}
        {...register('name')}
      />

      <Input
        label="Description / Category Details"
        placeholder="e.g. Standard domestic slab rate with low fixed charges"
        error={errors.description?.message}
        {...register('description')}
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Input
          label="Rate Per Unit (₹/kWh)"
          type="number"
          step="0.01"
          error={errors.rate_per_unit?.message}
          {...register('rate_per_unit')}
        />

        <Input
          label="Base Fixed Charge (₹)"
          type="number"
          step="0.01"
          error={errors.fixed_charge?.message}
          {...register('fixed_charge')}
        />

        <Input
          label="Tax Percentage (%)"
          type="number"
          step="0.01"
          error={errors.tax_percentage?.message}
          {...register('tax_percentage')}
        />
      </div>

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
        {onCancel && (
          <Button variant="outline" onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>
        )}
        <Button type="submit" isLoading={isLoading}>
          {defaultValues ? 'Save Changes' : 'Create Tariff Slab'}
        </Button>
      </div>
    </form>
  );
};

export default TariffForm;
