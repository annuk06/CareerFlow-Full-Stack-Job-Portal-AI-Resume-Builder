import React from 'react';
import { HelpCircle } from 'lucide-react';

const EmptyState = ({ 
  title = 'No records found', 
  description = 'Try adjusting your filters or add new records to start.', 
  icon: Icon = HelpCircle, 
  actionText, 
  onAction 
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 bg-white border border-dashed border-slate-200 rounded-2xl text-center shadow-sm">
      <div className="p-4 bg-slate-50 text-slate-400 rounded-2xl mb-4">
        <Icon size={36} className="text-slate-400" />
      </div>
      <h3 className="text-lg font-bold text-slate-800 mb-1">{title}</h3>
      <p className="text-sm text-slate-500 max-w-sm mb-6 leading-relaxed">{description}</p>
      
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="px-4 py-2.5 text-sm font-semibold text-white bg-primary-600 rounded-xl hover:bg-primary-700 transition-colors shadow-sm shadow-primary-200"
        >
          {actionText}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
