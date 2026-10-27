import React from 'react';
import { Database } from 'lucide-react';
import Button from './Button';

const EmptyState = ({
  icon: Icon = Database,
  title = 'No records found',
  description = 'There is currently no database data matching your selection.',
  actionText,
  onAction
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center bg-white rounded-2xl border border-dashed border-slate-200">
      <div className="p-4 rounded-2xl bg-slate-50 text-slate-400 mb-4 border border-slate-100">
        <Icon className="w-8 h-8" />
      </div>
      <h3 className="text-base font-semibold text-slate-800">{title}</h3>
      <p className="text-sm text-slate-500 max-w-sm mt-1 mb-5">{description}</p>
      {actionText && onAction && (
        <Button onClick={onAction} size="sm">
          {actionText}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;
