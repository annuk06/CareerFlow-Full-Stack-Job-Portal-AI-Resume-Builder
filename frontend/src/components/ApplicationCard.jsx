import React from 'react';
import { Calendar, FileText, ChevronRight } from 'lucide-react';

const ApplicationCard = ({ application, onSelect }) => {
  const { job, status, dates, resume } = application;
  const jobTitle = job?.title || 'Position';
  const companyName = job?.company?.name || 'Company Name';
  const appliedDate = dates?.appliedAt ? new Date(dates.appliedAt).toLocaleDateString() : 'N/A';

  const statusColors = {
    'Applied': 'bg-blue-50 text-blue-700 border-blue-100',
    'Under Review': 'bg-purple-50 text-purple-700 border-purple-100',
    'Shortlisted': 'bg-indigo-50 text-indigo-700 border-indigo-100',
    'Assessment': 'bg-amber-50 text-amber-700 border-amber-100',
    'Interview': 'bg-orange-50 text-orange-700 border-orange-100',
    'Selected': 'bg-green-50 text-green-700 border-green-100',
    'Rejected': 'bg-red-50 text-red-700 border-red-100'
  };

  const statusClass = statusColors[status] || 'bg-slate-50 text-slate-700 border-slate-100';

  return (
    <div 
      onClick={onSelect}
      className="bg-white rounded-2xl border border-slate-200 p-4.5 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer flex items-center justify-between group"
    >
      <div className="flex flex-col gap-1 overflow-hidden pr-3">
        <h3 className="text-sm font-bold text-slate-800 group-hover:text-primary-600 transition-colors truncate">
          {jobTitle}
        </h3>
        <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider truncate">
          {companyName}
        </span>
        
        <div className="flex items-center gap-3.5 mt-2.5 text-[11px] font-medium text-slate-500">
          <div className="flex items-center gap-1">
            <Calendar size={13} className="text-slate-400" />
            <span>Applied: {appliedDate}</span>
          </div>
          {resume && (
            <div className="flex items-center gap-1 hidden sm:flex">
              <FileText size={13} className="text-slate-400" />
              <span className="truncate max-w-[120px]">{resume.title}</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <span className={`px-2.5 py-1 text-[10px] font-bold rounded-lg border uppercase tracking-wider ${statusClass}`}>
          {status}
        </span>
        <div className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-50 group-hover:translate-x-0.5 transition-transform">
          <ChevronRight size={16} />
        </div>
      </div>
    </div>
  );
};

export default ApplicationCard;
