import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { jobAPI, applicationAPI, resumeAPI } from '../services/api';
import Modal from '../components/Modal';
import EmptyState from '../components/EmptyState';
import { 
  Shield, Briefcase, Users, CheckCircle, FileSpreadsheet, Plus, 
  Trash2, Edit3, Eye, Calendar, Sparkles, CheckCircle2 
} from 'lucide-react';
import axios from 'axios';

const AdminPanel = () => {
  const { user } = useAuth();
  
  // Lists
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);

  // Tabs: 'jobs', 'applications', 'companies'
  const [adminTab, setAdminTab] = useState('jobs');
  
  // Job Form Modal State
  const [jobModalOpen, setJobModalOpen] = useState(false);
  const [editingJobId, setEditingJobId] = useState(null);
  
  const [jobForm, setJobForm] = useState({
    company: '',
    title: '',
    location: '',
    workType: 'Remote',
    experience: 'Mid Level',
    salary: '',
    skills: '',
    description: '',
    category: 'Engineering',
    deadline: ''
  });

  // App detail Status modal state
  const [appModalOpen, setAppModalOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState(null);
  const [appStatus, setAppStatus] = useState('');
  const [interviewDate, setInterviewDate] = useState('');
  const [assessmentDate, setAssessmentDate] = useState('');
  const [saving, setSaving] = useState(false);

  const [toastText, setToastText] = useState('');

  const triggerToast = (text) => {
    setToastText(text);
    setTimeout(() => setToastText(''), 4000);
  };

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const jobsRes = await jobAPI.getJobs();
      const appsRes = await applicationAPI.getApplications();
      
      // Fetch companies
      // Since seed script created 15 companies, we will query them from unique entries in jobs,
      // or directly fetch them. To keep things clean, we will map companies from the jobs list.
      const companyMap = {};
      jobsRes.data.forEach(job => {
        if (job.company && job.company._id) {
          companyMap[job.company._id] = job.company;
        }
      });
      
      setJobs(jobsRes.data);
      setApplications(appsRes.data);
      setCompanies(Object.values(companyMap));
    } catch (err) {
      console.error(err);
      triggerToast('Failed to load admin logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.role === 'admin') {
      loadAdminData();
    }
  }, [user]);

  if (!user || user.role !== 'admin') {
    return (
      <div className="p-8 text-center bg-red-50 border border-red-200 text-red-700 rounded-2xl max-w-md mx-auto my-12">
        <Shield size={40} className="mx-auto text-red-500 mb-3" />
        <h2 className="text-lg font-bold">Access Restrained</h2>
        <p className="text-xs mt-1">This workspace is restricted to administrative personnel only.</p>
      </div>
    );
  }

  // Job CRUD Handlers
  const handleOpenCreateJob = () => {
    setEditingJobId(null);
    setJobForm({
      company: companies[0]?._id || '',
      title: '',
      location: '',
      workType: 'Remote',
      experience: 'Mid Level',
      salary: '',
      skills: '',
      description: '',
      category: 'Engineering',
      deadline: ''
    });
    setJobModalOpen(true);
  };

  const handleOpenEditJob = (job) => {
    setEditingJobId(job._id);
    setJobForm({
      company: job.company?._id || job.company,
      title: job.title,
      location: job.location,
      workType: job.workType || 'Remote',
      experience: job.experience || 'Mid Level',
      salary: job.salary || '',
      skills: (job.skills || []).join(', '),
      description: job.description,
      category: job.category || 'Engineering',
      deadline: job.deadline ? job.deadline.split('T')[0] : ''
    });
    setJobModalOpen(true);
  };

  const handleJobSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    const payload = {
      ...jobForm,
      skills: jobForm.skills.split(',').map(s => s.trim()).filter(Boolean)
    };

    try {
      if (editingJobId) {
        await jobAPI.updateJob(editingJobId, payload);
        triggerToast('Job posting updated.');
      } else {
        await jobAPI.createJob(payload);
        triggerToast('New job posting created successfully!');
      }
      setJobModalOpen(false);
      loadAdminData();
    } catch (err) {
      console.error(err);
      triggerToast('Error saving job.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteJob = async (id) => {
    if (!window.confirm('Are you sure you want to delete this job posting?')) return;
    try {
      await jobAPI.deleteJob(id);
      setJobs(jobs.filter(j => j._id !== id));
      triggerToast('Job posting deleted successfully.');
    } catch (err) {
      triggerToast('Failed to delete job.');
    }
  };

  // Application update Handlers
  const handleOpenAppDetail = (app) => {
    setSelectedApp(app);
    setAppStatus(app.status);
    setInterviewDate(app.dates?.interviewDate ? app.dates.interviewDate.split('T')[0] : '');
    setAssessmentDate(app.dates?.assessmentDate ? app.dates.assessmentDate.split('T')[0] : '');
    setAppModalOpen(true);
  };

  const handleAppStatusSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await applicationAPI.updateApplication(selectedApp._id, {
        status: appStatus,
        interviewDate: interviewDate || null,
        assessmentDate: assessmentDate || null
      });

      setApplications(applications.map(a => a._id === selectedApp._id ? res.data : a));
      setAppModalOpen(false);
      triggerToast(`Applicant status changed to: ${appStatus}`);
    } catch (err) {
      triggerToast('Failed to update status.');
    } finally {
      setSaving(false);
    }
  };

  // Stats aggregation
  const activePostings = jobs.length;
  const totalApplicants = applications.length;
  const interviewCount = applications.filter(a => a.status === 'Interview').length;
  const offerCount = applications.filter(a => a.status === 'Selected').length;

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastText && (
        <div className="fixed bottom-5 right-5 z-50 p-4 bg-slate-900 text-white rounded-xl shadow-lg border border-slate-700 flex items-center gap-3 animate-slide-in text-xs font-semibold">
          <CheckCircle2 size={16} className="text-green-400" />
          <span>{toastText}</span>
        </div>
      )}

      {/* Admin stats */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-navy-800 p-6 rounded-2xl border border-navy-700 shadow-sm text-white">
        <div className="space-y-1">
          <h1 className="text-xl font-bold flex items-center gap-1.5">
            <Shield className="text-primary-400" size={20} />
            CareerFlow Admin Workspace
          </h1>
          <p className="text-slate-400 text-xs">Manage recruitment postings, evaluate incoming applications, and track offers</p>
        </div>
        
        <div className="flex flex-wrap gap-4 text-xs font-semibold text-slate-300">
          <div className="px-3.5 py-2 bg-navy-700 rounded-xl border border-navy-600">
            Postings: <span className="text-primary-400 font-bold ml-1">{activePostings}</span>
          </div>
          <div className="px-3.5 py-2 bg-navy-700 rounded-xl border border-navy-600">
            Applicants: <span className="text-primary-400 font-bold ml-1">{totalApplicants}</span>
          </div>
          <div className="px-3.5 py-2 bg-navy-700 rounded-xl border border-navy-600">
            Interviews: <span className="text-primary-400 font-bold ml-1">{interviewCount}</span>
          </div>
          <div className="px-3.5 py-2 bg-navy-700 rounded-xl border border-navy-600">
            Offers: <span className="text-primary-400 font-bold ml-1">{offerCount}</span>
          </div>
        </div>
      </div>

      {/* Tabs list */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setAdminTab('jobs')}
          className={`px-5 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
            adminTab === 'jobs' 
              ? 'border-primary-600 text-primary-600' 
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Manage Jobs
        </button>
        <button
          onClick={() => setAdminTab('applications')}
          className={`px-5 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
            adminTab === 'applications' 
              ? 'border-primary-600 text-primary-600' 
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Candidate Applications ({totalApplicants})
        </button>
      </div>

      {/* JOBS CRUD LIST TAB */}
      {adminTab === 'jobs' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="text-sm font-bold text-slate-700">Active Job Postings</h3>
            <button
              onClick={handleOpenCreateJob}
              className="px-4.5 py-2.5 text-xs font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-xl flex items-center gap-1 transition-colors"
            >
              <Plus size={14} />
              <span>Post New Job</span>
            </button>
          </div>

          {loading ? (
            <div className="h-44 bg-white rounded-xl animate-pulse"></div>
          ) : jobs.length > 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              <table className="min-w-full divide-y divide-slate-200 text-left text-xs font-medium text-slate-500">
                <thead className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Job Info</th>
                    <th className="px-6 py-4">Category</th>
                    <th className="px-6 py-4">Work mode</th>
                    <th className="px-6 py-4">Compensation</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-700">
                  {jobs.map((job) => (
                    <tr key={job._id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900">{job.title}</span>
                          <span className="text-[10px] text-slate-400 font-semibold uppercase mt-0.5">{job.company?.name || 'Company'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">{job.category || 'General'}</td>
                      <td className="px-6 py-4">{job.workType} ({job.experience})</td>
                      <td className="px-6 py-4 font-bold text-slate-800">{job.salary || 'Competitive'}</td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <button
                          onClick={() => handleOpenEditJob(job)}
                          className="px-2.5 py-1.5 border border-slate-200 rounded-lg text-slate-500 hover:text-primary-600 hover:bg-primary-50 transition-colors"
                          title="Edit Job"
                        >
                          <Edit3 size={13} />
                        </button>
                        <button
                          onClick={() => handleDeleteJob(job._id)}
                          className="px-2.5 py-1.5 border border-slate-200 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                          title="Delete Job"
                        >
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-12 text-center text-xs text-slate-400 bg-white rounded-xl border">No jobs posted.</div>
          )}
        </div>
      )}

      {/* CANDIDATE APPLICATIONS TAB */}
      {adminTab === 'applications' && (
        <div className="space-y-4">
          {loading ? (
            <div className="h-44 bg-white rounded-xl animate-pulse"></div>
          ) : applications.length > 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              <table className="min-w-full divide-y divide-slate-200 text-left text-xs font-medium text-slate-500">
                <thead className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Applicant</th>
                    <th className="px-6 py-4">Job Applied</th>
                    <th className="px-6 py-4">Submission Date</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-700">
                  {applications.map((app) => (
                    <tr key={app._id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900">{app.user?.name}</span>
                          <span className="text-[10px] text-slate-400 font-semibold mt-0.5">{app.user?.email}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-800">{app.job?.title}</span>
                          <span className="text-[10px] text-slate-400 mt-0.5 uppercase tracking-wide font-semibold">{app.job?.company?.name || 'Company'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {app.dates?.appliedAt ? new Date(app.dates.appliedAt).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-0.5 text-[9px] font-bold rounded-lg border uppercase tracking-wider ${
                          app.status === 'Selected' ? 'bg-green-50 text-green-700 border-green-200' :
                          app.status === 'Rejected' ? 'bg-red-50 text-red-700 border-red-200' :
                          app.status === 'Interview' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                          'bg-blue-50 text-blue-700 border-blue-200'
                        }`}>
                          {app.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleOpenAppDetail(app)}
                          className="px-3.5 py-1.5 bg-slate-50 border border-slate-200 text-slate-650 hover:bg-slate-100 hover:text-slate-800 rounded-lg transition-colors font-bold"
                        >
                          Review / Schedule
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-12 text-center text-xs text-slate-400 bg-white border rounded-xl">No active applicant records.</div>
          )}
        </div>
      )}

      {/* JOB CREATION / EDITING FORM MODAL */}
      {jobModalOpen && (
        <Modal
          isOpen={jobModalOpen}
          onClose={() => setJobModalOpen(false)}
          title={editingJobId ? 'Edit Job Posting details' : 'Post New Job Openings'}
          size="lg"
        >
          <form onSubmit={handleJobSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {/* Company selection */}
              <div className="space-y-1">
                <label className="font-bold text-slate-400 uppercase tracking-wide">Hiring Company</label>
                <select
                  value={jobForm.company}
                  onChange={(e) => setJobForm({ ...jobForm, company: e.target.value })}
                  required
                  className="block w-full bg-slate-50 border rounded-lg px-2.5 py-2.5"
                >
                  <option value="" disabled>Select company...</option>
                  {companies.map(comp => (
                    <option key={comp._id} value={comp._id}>{comp.name}</option>
                  ))}
                </select>
              </div>

              {/* Title */}
              <div className="space-y-1">
                <label className="font-bold text-slate-400 uppercase tracking-wide">Job Position Title</label>
                <input
                  type="text"
                  required
                  value={jobForm.title}
                  onChange={(e) => setJobForm({ ...jobForm, title: e.target.value })}
                  className="block w-full bg-slate-50 border rounded-lg px-2.5 py-2"
                />
              </div>

              {/* Location */}
              <div className="space-y-1">
                <label className="font-bold text-slate-400 uppercase tracking-wide">Location</label>
                <input
                  type="text"
                  required
                  value={jobForm.location}
                  onChange={(e) => setJobForm({ ...jobForm, location: e.target.value })}
                  className="block w-full bg-slate-50 border rounded-lg px-2.5 py-2"
                />
              </div>

              {/* Salary */}
              <div className="space-y-1">
                <label className="font-bold text-slate-400 uppercase tracking-wide">Salary (e.g. $100k - $120k)</label>
                <input
                  type="text"
                  value={jobForm.salary}
                  onChange={(e) => setJobForm({ ...jobForm, salary: e.target.value })}
                  className="block w-full bg-slate-50 border rounded-lg px-2.5 py-2"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              {/* Category */}
              <div>
                <label className="font-bold text-slate-400 uppercase">Category</label>
                <select
                  value={jobForm.category}
                  onChange={(e) => setJobForm({ ...jobForm, category: e.target.value })}
                  className="block w-full bg-slate-50 border rounded-lg px-2 py-2 mt-1"
                >
                  <option value="Engineering">Engineering</option>
                  <option value="Product">Product</option>
                  <option value="Data Science">Data Science</option>
                  <option value="Design">Design</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Security">Security</option>
                </select>
              </div>

              {/* Work type */}
              <div>
                <label className="font-bold text-slate-400 uppercase">Work Mode</label>
                <select
                  value={jobForm.workType}
                  onChange={(e) => setJobForm({ ...jobForm, workType: e.target.value })}
                  className="block w-full bg-slate-50 border rounded-lg px-2 py-2 mt-1"
                >
                  <option value="Remote">Remote</option>
                  <option value="Hybrid">Hybrid</option>
                  <option value="On-site">On-site</option>
                </select>
              </div>

              {/* Experience */}
              <div>
                <label className="font-bold text-slate-400 uppercase">Experience</label>
                <select
                  value={jobForm.experience}
                  onChange={(e) => setJobForm({ ...jobForm, experience: e.target.value })}
                  className="block w-full bg-slate-50 border rounded-lg px-2 py-2 mt-1"
                >
                  <option value="Entry Level">Entry Level</option>
                  <option value="Mid Level">Mid Level</option>
                  <option value="Senior Level">Senior Level</option>
                  <option value="Lead / Manager">Lead / Manager</option>
                </select>
              </div>
            </div>

            {/* Skills */}
            <div className="space-y-1.5 text-xs">
              <label className="font-bold text-slate-400 uppercase">Skills (Comma-separated)</label>
              <input
                type="text"
                value={jobForm.skills}
                onChange={(e) => setJobForm({ ...jobForm, skills: e.target.value })}
                placeholder="e.g. React, Node.js, Express"
                className="block w-full bg-slate-50 border rounded-lg px-2.5 py-2.5"
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5 text-xs">
              <label className="font-bold text-slate-400 uppercase">Role Description</label>
              <textarea
                value={jobForm.description}
                onChange={(e) => setJobForm({ ...jobForm, description: e.target.value })}
                rows={4}
                required
                className="block w-full bg-slate-50 border rounded-lg px-2.5 py-2 resize-none"
              />
            </div>

            {/* Save Buttons */}
            <div className="flex items-center gap-3 pt-4 border-t">
              <button
                type="button"
                onClick={() => setJobModalOpen(false)}
                className="flex-1 py-3 text-center text-xs font-bold text-slate-650 bg-slate-50 border rounded-xl hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 py-3 text-center text-xs font-bold text-white bg-primary-600 hover:bg-primary-700 rounded-xl shadow-sm"
              >
                {saving ? 'Saving...' : 'Save Job Posting'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* APPLICANT REVIEW & STATUS TRANSITION MODAL */}
      {appModalOpen && selectedApp && (
        <Modal
          isOpen={appModalOpen}
          onClose={() => setAppModalOpen(false)}
          title={`Review Application: ${selectedApp.user?.name}`}
        >
          <form onSubmit={handleAppStatusSubmit} className="space-y-4">
            <div className="text-xs space-y-1">
              <span className="font-bold text-slate-400 uppercase block">Candidate Name</span>
              <p className="font-bold text-slate-800 text-sm">{selectedApp.user?.name}</p>
              <span className="text-slate-400 block">{selectedApp.user?.email}</span>
            </div>

            <div className="text-xs space-y-1 pt-2 border-t">
              <span className="font-bold text-slate-400 uppercase block">Position Applied</span>
              <p className="font-bold text-slate-800">{selectedApp.job?.title}</p>
              <span className="text-slate-400 block">{selectedApp.job?.company?.name || 'Company'}</span>
            </div>

            {/* Selected Resume view link */}
            {selectedApp.resume && (
              <div className="p-3 bg-slate-50 border rounded-xl text-xs flex justify-between items-center">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block">Attached Resume Card</span>
                  <span className="font-semibold text-slate-700 leading-normal block">{selectedApp.resume.title}</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    // Open resume editor view in read-only builder mode or trigger print
                    window.location.href = `/resume`;
                  }}
                  className="px-2.5 py-1.5 bg-white border text-primary-600 font-bold hover:bg-slate-50 text-[10px] rounded-lg shrink-0"
                >
                  View PDF Info
                </button>
              </div>
            )}

            {/* Application Notes */}
            {selectedApp.notes && (
              <div className="p-3 bg-amber-50/50 border border-amber-100 rounded-xl text-xs">
                <span className="text-[10px] font-bold text-amber-700 block">Candidate Notes</span>
                <p className="text-slate-650 leading-relaxed mt-1 whitespace-pre-line">{selectedApp.notes}</p>
              </div>
            )}

            {/* Status Change */}
            <div className="space-y-1.5 pt-3 border-t">
              <label htmlFor="app-status" className="text-xs font-bold text-slate-500 uppercase tracking-wide block">
                Recruitment Stage Status
              </label>
              <select
                id="app-status"
                value={appStatus}
                onChange={(e) => setAppStatus(e.target.value)}
                className="block w-full bg-slate-50 border rounded-xl px-3 py-2.5 text-xs text-slate-850 font-bold"
              >
                <option value="Applied">Applied</option>
                <option value="Under Review">Under Review</option>
                <option value="Shortlisted">Shortlisted</option>
                <option value="Assessment">Assessment</option>
                <option value="Interview">Interview</option>
                <option value="Selected">Selected (Offer)</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>

            {/* If Interview: Schedule calendar date */}
            {appStatus === 'Interview' && (
              <div className="space-y-1.5 animate-scale-up">
                <label htmlFor="interview" className="text-[10px] font-bold text-orange-600 uppercase block">
                  Schedule Virtual Interview Date *
                </label>
                <input
                  id="interview"
                  type="date"
                  required
                  value={interviewDate}
                  onChange={(e) => setInterviewDate(e.target.value)}
                  className="block w-full bg-slate-50 border rounded-lg px-2.5 py-2 text-xs"
                />
              </div>
            )}

            {/* If Assessment: Schedule test deadline date */}
            {appStatus === 'Assessment' && (
              <div className="space-y-1.5 animate-scale-up">
                <label htmlFor="assessment" className="text-[10px] font-bold text-amber-600 uppercase block">
                  Schedule Technical Test Deadline *
                </label>
                <input
                  id="assessment"
                  type="date"
                  required
                  value={assessmentDate}
                  onChange={(e) => setAssessmentDate(e.target.value)}
                  className="block w-full bg-slate-50 border rounded-lg px-2.5 py-2 text-xs"
                />
              </div>
            )}

            {/* Save Buttons */}
            <div className="flex items-center gap-3 pt-4 border-t">
              <button
                type="button"
                onClick={() => setAppModalOpen(false)}
                className="flex-1 py-3 text-center text-xs font-bold text-slate-650 bg-slate-50 border rounded-xl hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 py-3 text-center text-xs font-bold text-white bg-primary-600 hover:bg-primary-700 rounded-xl shadow-sm"
              >
                {saving ? 'Updating...' : 'Save Stage Update'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default AdminPanel;
