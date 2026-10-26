import React, { useState } from 'react';
import { SlidersHorizontal, RotateCcw } from 'lucide-react';

const FilterPanel = ({ onFilterChange, onReset }) => {
  const [filters, setFilters] = useState({
    location: '',
    workType: '',
    experience: '',
    category: '',
    sortBy: 'latest'
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    const updated = { ...filters, [name]: value };
    setFilters(updated);
    onFilterChange(updated);
  };

  const handleReset = () => {
    const cleared = {
      location: '',
      workType: '',
      experience: '',
      category: '',
      sortBy: 'latest'
    };
    setFilters(cleared);
    onReset(cleared);
  };

  const categories = ['Engineering', 'Product', 'Data Science', 'Design', 'Marketing', 'Security', 'Sales'];
  const workTypes = ['Remote', 'Hybrid', 'On-site'];
  const experienceLevels = ['Entry Level', 'Mid Level', 'Senior Level', 'Lead / Manager'];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2 font-bold text-slate-800 text-sm">
          <SlidersHorizontal size={16} className="text-primary-500" />
          <span>Filter Jobs</span>
        </div>
        <button
          onClick={handleReset}
          className="flex items-center gap-1 text-xs font-semibold text-slate-400 hover:text-primary-600 transition-colors"
        >
          <RotateCcw size={12} />
          Reset Filters
        </button>
      </div>

      {/* Selectors Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
        {/* Category */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Category</label>
          <select
            name="category"
            value={filters.category}
            onChange={handleChange}
            className="block w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-primary-500"
          >
            <option value="">All Categories</option>
            {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
        </div>

        {/* Work Type */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Work Mode</label>
          <select
            name="workType"
            value={filters.workType}
            onChange={handleChange}
            className="block w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-primary-500"
          >
            <option value="">All Modes</option>
            {workTypes.map(type => <option key={type} value={type}>{type}</option>)}
          </select>
        </div>

        {/* Experience */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Experience</label>
          <select
            name="experience"
            value={filters.experience}
            onChange={handleChange}
            className="block w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-primary-500"
          >
            <option value="">All Experience</option>
            {experienceLevels.map(lvl => <option key={lvl} value={lvl}>{lvl}</option>)}
          </select>
        </div>

        {/* Location Input Filter */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Location</label>
          <input
            type="text"
            name="location"
            value={filters.location}
            onChange={handleChange}
            placeholder="e.g. San Francisco"
            className="block w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-primary-500 placeholder-slate-400"
          />
        </div>

        {/* Sort By */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sort By</label>
          <select
            name="sortBy"
            value={filters.sortBy}
            onChange={handleChange}
            className="block w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-primary-500"
          >
            <option value="latest">Latest Postings</option>
            <option value="salary">Highest Salary</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default FilterPanel;
