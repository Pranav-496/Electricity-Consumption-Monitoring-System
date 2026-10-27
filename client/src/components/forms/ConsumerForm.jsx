import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Input from '../common/Input';
import Button from '../common/Button';

const consumerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  address: z.string().min(5, 'Address must be at least 5 characters'),
  contact: z.string().min(5, 'Contact number is required'),
  email: z.string().email('Valid email is required').optional().or(z.literal(''))
});

const ConsumerForm = ({ defaultValues, onSubmit, isLoading = false, onCancel }) => {
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(consumerSchema),
    defaultValues: defaultValues || {
      name: '',
      address: '',
      contact: '',
      email: ''
    }
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input
        label="Consumer Name"
        placeholder="e.g. Johnathan Doe or Acme Corp"
        error={errors.name?.message}
        {...register('name')}
      />

      <Input
        label="Service Address"
        placeholder="e.g. 42 Park Avenue, Metro City"
        error={errors.address?.message}
        {...register('address')}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Contact Number"
          placeholder="e.g. +1-555-0192"
          error={errors.contact?.message}
          {...register('contact')}
        />

        <Input
          label="Email Address"
          type="email"
          placeholder="e.g. consumer@example.com"
          error={errors.email?.message}
          {...register('email')}
        />
      </div>

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
        {onCancel && (
          <Button variant="outline" onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>
        )}
        <Button type="submit" isLoading={isLoading}>
          {defaultValues ? 'Update Consumer' : 'Register Consumer'}
        </Button>
      </div>
    </form>
  );
};

export default ConsumerForm;
