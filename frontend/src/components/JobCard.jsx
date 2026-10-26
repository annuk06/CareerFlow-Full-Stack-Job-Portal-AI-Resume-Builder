import React from 'react';
import { MapPin, Briefcase, DollarSign, Calendar, Clock, Bookmark, BookmarkCheck } from 'lucide-react';

const JobCard = ({ job, onApply, onSave, isSaved, onSelect, alreadyApplied }) => {
  const {
    title,
    company,
    location,
    workType,
    experience,
    salary,
    skills = [],
    createdAt,
    deadline
  } = job;

  const companyName = company?.name || 'Company Name';
  const companyLogo = company?.logo;
  const postedDateFormatted = createdAt ? new Date(createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'Recently';

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col justify-between h-full relative overflow-hidden group">
      {/* Already Applied Tag overlay */}
      {alreadyApplied && (
        <div className="absolute top-0 right-0 bg-green-50 text-green-700 px-3 py-1 text-xs font-semibold rounded-bl-xl border-l border-b border-green-200">
          Applied
        </div>
      )}

      <div>
        {/* Header: Logo and Company Info */}
        <div className="flex items-center gap-3.5 mb-4">
          {companyLogo ? (
            <img 
              src={companyLogo} 
              alt={companyName} 
              className="w-12 h-12 rounded-xl object-cover border border-slate-100 shrink-0"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='1.5'%3E%3Crect x='2' y='7' width='20' height='14' rx='2' ry='2'/%3E%3Cpath d='M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16'/%3E%3C/svg%3E";
              }}
            />
          ) : (
            <div className="w-12 h-12 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center font-bold text-lg border border-primary-100 shrink-0 capitalize">
              {companyName[0]}
            </div>
          )}
          <div className="overflow-hidden">
            <h4 className="text-xs text-slate-400 font-medium truncate uppercase tracking-wider">{companyName}</h4>
            <h3 className="text-base font-bold text-slate-900 truncate group-hover:text-primary-600 transition-colors cursor-pointer" onClick={onSelect}>
              {title}
            </h3>
          </div>
        </div>

        {/* Metadata grid */}
        <div className="grid grid-cols-2 gap-x-2 gap-y-2 mb-4 text-xs font-medium text-slate-500">
          <div className="flex items-center gap-1.5 truncate">
            <MapPin size={14} className="text-slate-400 shrink-0" />
            <span>{location}</span>
          </div>
          <div className="flex items-center gap-1.5 truncate">
            <Briefcase size={14} className="text-slate-400 shrink-0" />
            <span>{workType} ({experience})</span>
          </div>
          {salary && (
            <div className="flex items-center gap-1.5 truncate">
              <DollarSign size={14} className="text-slate-400 shrink-0" />
              <span>{salary}</span>
            </div>
          )}
          <div className="flex items-center gap-1.5 truncate">
            <Calendar size={14} className="text-slate-400 shrink-0" />
            <span>Posted: {postedDateFormatted}</span>
          </div>
        </div>

        {/* Skills pills */}
        <div className="flex flex-wrap gap-1.5 mb-5">
          {skills.slice(0, 3).map((skill, idx) => (
            <span key={idx} className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-semibold tracking-wide">
              {skill}
            </span>
          ))}
          {skills.length > 3 && (
            <span className="px-2 py-0.5 rounded-md bg-slate-50 text-slate-400 text-[10px] font-semibold">
              +{skills.length - 3} more
            </span>
          )}
        </div>
      </div>

      {/* Buttons */}
      <div className="flex items-center gap-2 pt-3 border-t border-slate-100 mt-auto">
        <button
          onClick={onSelect}
          className="flex-1 px-3 py-2 text-xs font-semibold text-primary-600 bg-primary-50 rounded-xl hover:bg-primary-100 transition-colors text-center"
        >
          View Details
        </button>

        {!alreadyApplied && onApply && (
          <button
            onClick={onApply}
            className="flex-1 px-3 py-2 text-xs font-semibold text-white bg-primary-600 rounded-xl hover:bg-primary-700 transition-colors shadow-sm shadow-primary-200"
          >
            Apply Now
          </button>
        )}

        {onSave && (
          <button
            onClick={onSave}
            className={`p-2 rounded-xl border transition-colors shrink-0 ${
              isSaved 
                ? 'border-amber-200 bg-amber-50 text-amber-600 hover:bg-amber-100' 
                : 'border-slate-200 text-slate-400 hover:bg-slate-50 hover:text-slate-600'
            }`}
            title={isSaved ? 'Remove bookmark' : 'Bookmark job'}
          >
            {isSaved ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
          </button>
        )}
      </div>
    </div>
  );
};

export default JobCard;
