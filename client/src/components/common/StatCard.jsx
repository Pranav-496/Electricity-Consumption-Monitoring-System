import React from 'react';

const StatCard = ({ title, value, icon: Icon, description, trend, color = 'emerald' }) => {
  const colorSchemes = {
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    blue: 'bg-sky-50 text-sky-600 border-sky-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    rose: 'bg-rose-50 text-rose-600 border-rose-100',
    purple: 'bg-purple-50 text-purple-600 border-purple-100'
  };

  const scheme = colorSchemes[color] || colorSchemes.emerald;

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</p>
          <h4 className="text-2xl font-bold text-slate-900 mt-1">{value}</h4>
        </div>
        {Icon && (
          <div className={`p-3 rounded-xl border ${scheme}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
      {(description || trend) && (
        <div className="mt-3 flex items-center text-xs text-slate-500">
          {description && <span>{description}</span>}
        </div>
      )}
    </div>
  );
};

export default StatCard;
