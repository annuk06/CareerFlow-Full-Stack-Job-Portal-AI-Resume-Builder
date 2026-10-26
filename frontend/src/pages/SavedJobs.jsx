import React, { useState, useEffect } from 'react';
import { savedJobAPI, applicationAPI, resumeAPI } from '../services/api';
import JobCard from '../components/JobCard';
import EmptyState from '../components/EmptyState';
import Modal from '../components/Modal';
import { Bookmark, CheckCircle, CheckCircle2, AlertTriangle, Send } from 'lucide-react';

const SavedJobs = () => {
  const [savedItems, setSavedItems] = useState([]);
  const [resumes, setResumes] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Apply Modal state
  const [selectedJob, setSelectedJob] = useState(null);
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [resumeId, setResumeId] = useState('');
  const [applyNotes, setApplyNotes] = useState('');
  const [applyLoading, setApplyLoading] = useState(false);
  
  const [toastText, setToastText] = useState('');

  const fetchSavedData = async () => {
    setLoading(true);
    try {
      const savedRes = await savedJobAPI.getSaved();
      const resumesRes = await resumeAPI.getResumes();
      const appsRes = await applicationAPI.getApplications();

      setSavedItems(savedRes.data);
      setResumes(resumesRes.data);
      setApplications(appsRes.data);

      if (resumesRes.data.length > 0) {
        setResumeId(resumesRes.data[0]._id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSavedData();
  }, []);

  const triggerToast = (text) => {
    setToastText(text);
    setTimeout(() => setToastText(''), 4000);
  };

  const handleRemoveBookmark = async (bookmarkId) => {
    try {
      await savedJobAPI.deleteSaved(bookmarkId);
      setSavedItems(savedItems.filter(item => item._id !== bookmarkId));
      triggerToast('Job bookmark removed.');
    } catch (err) {
      triggerToast('Failed to remove bookmark.');
    }
  };

  const handleOpenApply = (job) => {
    if (resumes.length === 0) {
      triggerToast('Please create a resume first!');
      return;
    }
    setSelectedJob(job);
    setApplyModalOpen(true);
  };

  const handleApplySubmit = async (e) => {
    e.preventDefault();
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
      triggerToast(`Applied successfully to ${selectedJob.title}!`);
    } catch (err) {
      triggerToast(err.response?.data?.message || 'Apply submission failed.');
    } finally {
      setApplyLoading(false);
    }
  };

  const hasApplied = (jobId) => {
    return applications.some(a => (a.job?._id || a.job) === jobId);
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastText && (
        <div className="fixed bottom-5 right-5 z-50 p-4 bg-slate-900 text-white rounded-xl shadow-lg border border-slate-700 flex items-center gap-3 animate-slide-in text-xs font-semibold">
          <CheckCircle2 size={16} className="text-green-400" />
          <span>{toastText}</span>
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Saved Jobs</h1>
        <p className="text-sm text-slate-500 mt-1">Review bookmarks and submit applications with a single click</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary-600"></div>
        </div>
      ) : savedItems.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {savedItems.map((item) => (
            <div key={item._id} className="relative">
              {item.job ? (
                <JobCard
                  job={item.job}
                  isSaved={true}
                  alreadyApplied={hasApplied(item.job._id)}
                  onSave={() => handleRemoveBookmark(item._id)}
                  onApply={() => handleOpenApply(item.job)}
                  onSelect={() => window.location.href = `/jobs?id=${item.job._id}`}
                />
              ) : (
                <div className="p-4 bg-slate-100 rounded-xl text-center text-xs text-slate-400">
                  Job posting has been deleted.
                  <button onClick={() => handleRemoveBookmark(item._id)} className="block mx-auto text-primary-600 font-bold mt-2">Clear Bookmark</button>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No bookmarked jobs"
          description="Browse jobs in our job board and click the bookmark star to save them for later."
          onAction={() => window.location.href = '/jobs'}
          actionText="Search Jobs"
          icon={Bookmark}
        />
      )}

      {/* Apply Modal */}
      {applyModalOpen && selectedJob && (
        <Modal
          isOpen={applyModalOpen}
          onClose={() => setApplyModalOpen(false)}
          title={`Apply: ${selectedJob.title}`}
        >
          <form onSubmit={handleApplySubmit} className="space-y-4">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Hiring Company</span>
              <h4 className="text-sm font-bold text-slate-700 mt-0.5">{selectedJob.company?.name || 'Company'}</h4>
            </div>

            {/* Select Resume */}
            <div className="space-y-1">
              <label htmlFor="resume" className="text-xs font-bold text-slate-400 uppercase tracking-wide block">
                Attach Resume *
              </label>
              <select
                id="resume"
                value={resumeId}
                onChange={(e) => setResumeId(e.target.value)}
                required
                className="block w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none"
              >
                <option value="" disabled>Select resume...</option>
                {resumes.map(res => (
                  <option key={res._id} value={res._id}>{res.title}</option>
                ))}
              </select>
            </div>

            {/* Cover notes */}
            <div className="space-y-1">
              <label htmlFor="notes" className="text-xs font-bold text-slate-400 uppercase block">
                Cover notes / details
              </label>
              <textarea
                id="notes"
                value={applyNotes}
                onChange={(e) => setApplyNotes(e.target.value)}
                rows={3}
                placeholder="Brief introduction..."
                className="block w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
              />
            </div>

            {/* Submit */}
            <div className="flex items-center gap-3 pt-4 border-t">
              <button
                type="button"
                onClick={() => setApplyModalOpen(false)}
                className="flex-1 py-2.5 text-center text-xs font-bold text-slate-600 bg-slate-50 border rounded-xl hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={applyLoading}
                className="flex-1 py-2.5 text-center text-xs font-bold text-white bg-primary-600 hover:bg-primary-700 rounded-xl shadow-md flex items-center justify-center gap-1 disabled:opacity-50"
              >
                {applyLoading ? 'Applying...' : 'Apply Now'}
                <Send size={12} />
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default SavedJobs;
