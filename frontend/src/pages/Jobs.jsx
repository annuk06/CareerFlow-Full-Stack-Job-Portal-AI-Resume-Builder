import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { jobAPI, resumeAPI, applicationAPI, savedJobAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import JobCard from '../components/JobCard';
import SearchBar from '../components/SearchBar';
import FilterPanel from '../components/FilterPanel';
import Modal from '../components/Modal';
import EmptyState from '../components/EmptyState';
import { 
  MapPin, Briefcase, DollarSign, Calendar, Clock, 
  ChevronLeft, Send, CheckCircle2, Bookmark, Info, AlertTriangle
} from 'lucide-react';

const Jobs = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Core lists
  const [jobs, setJobs] = useState([]);
  const [resumes, setResumes] = useState([]);
  const [applications, setApplications] = useState([]);
  const [savedJobs, setSavedJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter params
  const [searchParams, setSearchParams] = useState({});

  // Modals & detail selection
  const [selectedJob, setSelectedJob] = useState(null);
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [resumeId, setResumeId] = useState('');
  const [applyNotes, setApplyNotes] = useState('');
  const [applyLoading, setApplyLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const fetchJobsData = async (filters = {}) => {
    setLoading(true);
    try {
      const jobsRes = await jobAPI.getJobs(filters);
      setJobs(jobsRes.data);
    } catch (err) {
      showToast('error', 'Failed to load jobs list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        // Fetch candidates specific logs if logged in
        if (user) {
          const resumesRes = await resumeAPI.getResumes();
          const appsRes = await applicationAPI.getApplications();
          const savedRes = await savedJobAPI.getSaved();

          setResumes(resumesRes.data);
          setApplications(appsRes.data);
          setSavedJobs(savedRes.data);

          if (resumesRes.data.length > 0) {
            setResumeId(resumesRes.data[0]._id);
          }
        }
        
        // Read URL query params
        const params = new URLSearchParams(location.search);
        const jobId = params.get('id');
        
        const jobsRes = await jobAPI.getJobs();
        setJobs(jobsRes.data);

        // If redirected with detail ID, auto open detail view
        if (jobId) {
          const detailJob = jobsRes.data.find(j => j._id === jobId);
          if (detailJob) {
            setSelectedJob(detailJob);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadInitialData();
  }, [location.search, user]);

  const showToast = (type, text) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 4000);
  };

  // Filter handlers
  const handleSearch = (query) => {
    const updatedFilters = { ...searchParams, search: query };
    setSearchParams(updatedFilters);
    fetchJobsData(updatedFilters);
  };

  const handleFilterChange = (filters) => {
    const updatedFilters = { ...searchParams, ...filters };
    setSearchParams(updatedFilters);
    fetchJobsData(updatedFilters);
  };

  const handleReset = (cleared) => {
    setSearchParams({});
    fetchJobsData({});
  };

  // Job Actions
  const handleSaveJob = async (jobId) => {
    if (!user) {
      navigate('/login');
      return;
    }
    const bookmark = savedJobs.find(sj => (sj.job?._id || sj.job) === jobId);
    
    try {
      if (bookmark) {
        // Remove bookmark
        await savedJobAPI.deleteSaved(bookmark._id);
        setSavedJobs(savedJobs.filter(sj => sj._id !== bookmark._id));
        showToast('success', 'Job bookmark removed.');
      } else {
        // Add bookmark
        const res = await savedJobAPI.save({ jobId });
        setSavedJobs([...savedJobs, res.data]);
        showToast('success', 'Job bookmarked successfully.');
      }
    } catch (err) {
      showToast('error', err.response?.data?.message || 'Error updating bookmark.');
    }
  };

  const handleOpenApply = (job) => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    if (resumes.length === 0) {
      showToast('error', 'Please create or upload a resume in the Resume System first!');
      return;
    }

    setSelectedJob(job);
    setApplyModalOpen(true);
  };

  const handleApplySubmit = async (e) => {
    e.preventDefault();
    if (!resumeId) {
      showToast('error', 'Please select a resume to attach.');
      return;
    }

    setApplyLoading(true);
    try {
      const res = await applicationAPI.apply({
        jobId: selectedJob._id,
        resumeId,
        notes: applyNotes
      });
      setApplications([...applications, res.data]);
      setApplyModalOpen(false);
      setApplyNotes('');
      showToast('success', `Applied successfully to ${selectedJob.title}!`);
    } catch (err) {
      showToast('error', err.response?.data?.message || 'Failed to submit application.');
    } finally {
      setApplyLoading(false);
    }
  };

  const isJobSaved = (jobId) => {
    return savedJobs.some(sj => (sj.job?._id || sj.job) === jobId);
  };

  const hasApplied = (jobId) => {
    return applications.some(a => (a.job?._id || a.job) === jobId);
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toast && (
        <div className={`fixed bottom-5 right-5 z-50 p-4 rounded-xl shadow-lg border flex items-center gap-3 animate-slide-in ${
          toast.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
          <span className="text-xs font-semibold">{toast.text}</span>
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Explore Job Openings</h1>
        <p className="text-sm text-slate-500 mt-1">Find your next career move and apply with your parsed resume</p>
      </div>

      {/* Search Bar Row */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4.5 shadow-sm">
        <SearchBar onSearch={handleSearch} />
      </div>

      {/* Main Grid: Filter panel + Job cards list */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Filters column */}
        <div className="lg:col-span-1">
          <FilterPanel onFilterChange={handleFilterChange} onReset={handleReset} />
        </div>

        {/* Jobs list column */}
        <div className="lg:col-span-3 space-y-4">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map(idx => (
                <div key={idx} className="bg-white rounded-2xl border border-slate-200 p-5 h-44 animate-pulse flex flex-col justify-between">
                  <div className="flex gap-3">
                    <div className="w-12 h-12 bg-slate-200 rounded-xl shrink-0"></div>
                    <div className="flex-1 space-y-2 mt-1">
                      <div className="h-3 bg-slate-200 rounded w-1/3"></div>
                      <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                    </div>
                  </div>
                  <div className="h-8 bg-slate-200 rounded-xl w-full"></div>
                </div>
              ))}
            </div>
          ) : jobs.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {jobs.map(job => (
                <JobCard
                  key={job._id}
                  job={job}
                  isSaved={isJobSaved(job._id)}
                  alreadyApplied={hasApplied(job._id)}
                  onSave={() => handleSaveJob(job._id)}
                  onApply={() => handleOpenApply(job)}
                  onSelect={() => setSelectedJob(job)}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              title="No jobs match your search"
              description="Try adjusting your filters or search keywords to find open job positions."
              onAction={handleReset}
              actionText="Reset All Filters"
            />
          )}
        </div>
      </div>

      {/* Job Details Modal overlay */}
      {selectedJob && !applyModalOpen && (
        <Modal 
          isOpen={!!selectedJob} 
          onClose={() => setSelectedJob(null)} 
          title="Job Description & Details"
          size="lg"
        >
          <div className="space-y-6">
            {/* Header: Company logo and details */}
            <div className="flex items-center gap-4 border-b border-slate-100 pb-5">
              {selectedJob.company?.logo ? (
                <img 
                  src={selectedJob.company.logo} 
                  alt={selectedJob.company.name} 
                  className="w-14 h-14 rounded-2xl object-cover border border-slate-100 shrink-0" 
                />
              ) : (
                <div className="w-14 h-14 rounded-2xl bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-xl capitalize shrink-0">
                  {selectedJob.company?.name ? selectedJob.company.name[0] : 'J'}
                </div>
              )}
              <div>
                <h2 className="text-lg font-extrabold text-slate-800 leading-tight">{selectedJob.title}</h2>
                <div className="flex flex-wrap gap-x-3.5 gap-y-1 items-center mt-1.5 text-xs font-semibold text-slate-500">
                  <span className="text-primary-600 uppercase tracking-wide">{selectedJob.company?.name || 'Company'}</span>
                  <span className="w-1.5 h-1.5 bg-slate-300 rounded-full"></span>
                  <span className="flex items-center gap-1"><MapPin size={13} /> {selectedJob.location}</span>
                  <span className="w-1.5 h-1.5 bg-slate-300 rounded-full"></span>
                  <span className="flex items-center gap-1"><Briefcase size={13} /> {selectedJob.workType} ({selectedJob.experience})</span>
                </div>
              </div>
            </div>

            {/* Compensation Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-50 p-4 border border-slate-150 rounded-2xl">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Salary Range</span>
                <span className="text-sm font-bold text-slate-700 block mt-0.5">{selectedJob.salary || 'Competitive'}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Job Category</span>
                <span className="text-sm font-bold text-slate-700 block mt-0.5">{selectedJob.category || 'General'}</span>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Apply Deadline</span>
                <span className="text-sm font-bold text-slate-700 block mt-0.5">
                  {selectedJob.deadline ? new Date(selectedJob.deadline).toLocaleDateString() : 'Rolling bases'}
                </span>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">About the Role</h3>
              <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">{selectedJob.description}</p>
            </div>

            {/* Responsibilities */}
            {selectedJob.responsibilities?.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Key Responsibilities</h3>
                <ul className="list-disc list-inside space-y-1.5 text-sm text-slate-600 leading-relaxed">
                  {selectedJob.responsibilities.map((resp, idx) => <li key={idx}>{resp}</li>)}
                </ul>
              </div>
            )}

            {/* Requirements */}
            {selectedJob.requirements?.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Qualifications & Requirements</h3>
                <ul className="list-disc list-inside space-y-1.5 text-sm text-slate-600 leading-relaxed">
                  {selectedJob.requirements.map((reqItem, idx) => <li key={idx}>{reqItem}</li>)}
                </ul>
              </div>
            )}

            {/* Benefits */}
            {selectedJob.benefits?.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">What We Offer</h3>
                <ul className="list-disc list-inside space-y-1.5 text-sm text-slate-600 leading-relaxed">
                  {selectedJob.benefits.map((benefit, idx) => <li key={idx}>{benefit}</li>)}
                </ul>
              </div>
            )}

            {/* Skills */}
            {selectedJob.skills?.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Core Skills Evaluated</h3>
                <div className="flex flex-wrap gap-1.5">
                  {selectedJob.skills.map((skill, idx) => (
                    <span key={idx} className="px-2.5 py-1 text-xs font-semibold text-slate-600 bg-slate-100 rounded-lg">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Actions Footer */}
            <div className="flex items-center gap-3 pt-5 border-t border-slate-100">
              <button
                onClick={() => handleSaveJob(selectedJob._id)}
                className={`flex items-center gap-1.5 px-4 py-3 rounded-xl border text-sm font-semibold transition-colors ${
                  isJobSaved(selectedJob._id)
                    ? 'border-amber-200 bg-amber-50 text-amber-600 hover:bg-amber-100'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Bookmark size={16} />
                {isJobSaved(selectedJob._id) ? 'Bookmarked' : 'Save Job'}
              </button>

              {hasApplied(selectedJob._id) ? (
                <div className="flex-1 py-3 text-center text-sm font-bold text-green-700 bg-green-50 border border-green-200 rounded-xl">
                  Applied successfully
                </div>
              ) : (
                <button
                  onClick={() => handleOpenApply(selectedJob)}
                  className="flex-1 py-3 text-center text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-xl shadow-md shadow-primary-200 transition-colors"
                >
                  Apply for this position
                </button>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Apply Form Modal overlay */}
      {applyModalOpen && selectedJob && (
        <Modal
          isOpen={applyModalOpen}
          onClose={() => setApplyModalOpen(false)}
          title={`Apply: ${selectedJob.title}`}
        >
          <form onSubmit={handleApplySubmit} className="space-y-5">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Hiring Organization</p>
              <h4 className="text-sm font-bold text-slate-700">{selectedJob.company?.name || 'Company'}</h4>
            </div>

            {/* Select Resume */}
            <div className="space-y-1.5">
              <label htmlFor="resume-select" className="text-xs font-bold text-slate-400 uppercase tracking-wide block">
                Attach Resume *
              </label>
              <select
                id="resume-select"
                value={resumeId}
                onChange={(e) => setResumeId(e.target.value)}
                required
                className="block w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              >
                <option value="" disabled>Select from your resumes...</option>
                {resumes.map(res => (
                  <option key={res._id} value={res._id}>
                    {res.title} ({res.template} template)
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-400">
                You can upload a PDF or create an ATS-friendly resume under the <a href="/resume" className="text-primary-600 font-bold hover:underline">Resume System</a>.
              </p>
            </div>

            {/* Cover notes */}
            <div className="space-y-1.5">
              <label htmlFor="apply-notes" className="text-xs font-bold text-slate-400 uppercase tracking-wide block">
                Introduce yourself (Optional)
              </label>
              <textarea
                id="apply-notes"
                value={applyNotes}
                onChange={(e) => setApplyNotes(e.target.value)}
                rows={4}
                placeholder="Include a short message or cover notes detailing your experience and interest..."
                className="block w-full px-3.5 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all placeholder-slate-400 resize-none text-slate-800"
              />
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setApplyModalOpen(false)}
                className="flex-1 py-3 text-center text-sm font-semibold text-slate-600 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={applyLoading}
                className="flex-1 py-3 text-center text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-xl shadow-md shadow-primary-200 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {applyLoading ? 'Submitting...' : 'Submit Application'}
                <Send size={14} />
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default Jobs;
