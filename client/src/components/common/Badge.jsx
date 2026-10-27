import React from 'react';

const Badge = ({ variant = 'default', children, className = '' }) => {
  const variants = {
    // Payment Statuses
    paid: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    partially_paid: 'bg-amber-50 text-amber-700 border-amber-200',
    unpaid: 'bg-sky-50 text-sky-700 border-sky-200',
    overdue: 'bg-rose-50 text-rose-700 border-rose-200 font-semibold',

    // Meter Statuses
    active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    inactive: 'bg-slate-100 text-slate-700 border-slate-200',
    maintenance: 'bg-amber-50 text-amber-700 border-amber-200',

    // Alert Severity
    critical: 'bg-rose-100 text-rose-800 border-rose-300 font-semibold',
    warning: 'bg-amber-100 text-amber-800 border-amber-300 font-semibold',
    info: 'bg-sky-50 text-sky-700 border-sky-200',

    // Roles
    admin: 'bg-purple-50 text-purple-700 border-purple-200 font-semibold',
    consumer: 'bg-teal-50 text-teal-700 border-teal-200',

    default: 'bg-slate-100 text-slate-700 border-slate-200'
  };

  const selectedVariant = variants[variant] || variants.default;

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${selectedVariant} ${className}`}>
      {children}
    </span>
  );
};

export default Badge;
