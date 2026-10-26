import React from 'react';
import { Check, Info, AlertCircle, CheckCircle, Bell } from 'lucide-react';

const NotificationItem = ({ notification, onMarkRead }) => {
  const { _id, title, message, type, isRead } = notification;

  const typeConfig = {
    success: { bg: 'bg-green-50 text-green-700 border-green-100', icon: CheckCircle },
    danger: { bg: 'bg-red-50 text-red-700 border-red-100', icon: AlertCircle },
    info: { bg: 'bg-blue-50 text-blue-700 border-blue-100', icon: Info },
    warning: { bg: 'bg-amber-50 text-amber-700 border-amber-100', icon: AlertCircle }
  };

  const currentType = typeConfig[type] || typeConfig.info;
  const Icon = currentType.icon;

  return (
    <div className={`p-4 border rounded-2xl flex gap-4.5 justify-between items-start transition-all ${
      isRead 
        ? 'bg-white border-slate-100 opacity-65' 
        : 'bg-slate-50 border-slate-200 shadow-sm'
    }`}>
      {/* Icon */}
      <div className={`p-2.5 rounded-xl border ${currentType.bg} shrink-0`}>
        <Icon size={18} />
      </div>

      {/* Message Text */}
      <div className="flex-1 space-y-0.5">
        <div className="flex items-center gap-2">
          <h4 className="text-sm font-bold text-slate-800">{title}</h4>
          {!isRead && (
            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full shrink-0"></span>
          )}
        </div>
        <p className="text-xs text-slate-500 leading-relaxed">{message}</p>
      </div>

      {/* Action Checkmark */}
      {!isRead && onMarkRead && (
        <button
          onClick={() => onMarkRead(_id)}
          className="p-1.5 border border-slate-200 rounded-xl text-slate-400 hover:text-primary-600 hover:border-primary-200 hover:bg-primary-50 transition-all shrink-0"
          title="Mark as read"
        >
          <Check size={14} />
        </button>
      )}
    </div>
  );
};

export default NotificationItem;
