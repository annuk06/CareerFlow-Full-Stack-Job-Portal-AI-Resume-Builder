import React from 'react';

const StatCard = ({ title, value, icon: Icon, description, trend }) => {
  return (
    <div className="bg-navy-800 text-white rounded-2xl p-6 shadow-sm border border-navy-700 flex items-center justify-between transition-all duration-200 hover:-translate-y-1 hover:shadow-md">
      <div className="space-y-1">
        <span className="text-sm font-medium text-slate-400 block">{title}</span>
        <h3 className="text-3xl font-bold tracking-tight">{value}</h3>
        {description && (
          <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
            {trend && <span className="text-primary-400 font-semibold">{trend}</span>}
            {description}
          </p>
        )}
      </div>
      <div className="p-3.5 bg-navy-700 text-primary-400 rounded-xl">
        <Icon size={24} />
      </div>
    </div>
  );
};

export default StatCard;
