import React, { useState, useEffect } from 'react';
import { applicationAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import EmptyState from '../components/EmptyState';
import Modal from '../components/Modal';
import { 
  Trello, Table, Calendar, FileText, FileSpreadsheet, 
  Clock, Plus, CheckCircle, AlertCircle, Edit3, CheckCircle2 
} from 'lucide-react';

const Applications = () => {
  const { user } = useAuth();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('kanban'); // 'kanban' or 'table'
  
  // Detail selection modal
  const [selectedApp, setSelectedApp] = useState(null);
  const [notes, setNotes] = useState('');
  const [interviewDate, setInterviewDate] = useState('');
  const [assessmentDate, setAssessmentDate] = useState('');
  const [adminStatus, setAdminStatus] = useState('');
  const [saving, setSaving] = useState(false);
  const [toastText, setToastText] = useState('');

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const res = await applicationAPI.getApplications();
      setApplications(res.data);
    } catch (err) {
      console.error('Error fetching applications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const handleOpenDetail = (app) => {
    setSelectedApp(app);
    setNotes(app.notes || '');
    setInterviewDate(app.dates?.interviewDate ? app.dates.interviewDate.split('T')[0] : '');
    setAssessmentDate(app.dates?.assessmentDate ? app.dates.assessmentDate.split('T')[0] : '');
    setAdminStatus(app.status);
  };

  const handleSaveAppDetails = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        notes,
        interviewDate: interviewDate || null,
        assessmentDate: assessmentDate || null
      };

      // Admin can also modify status directly from detail modal
      if (user.role === 'admin') {
        payload.status = adminStatus;
      }

      const res = await applicationAPI.updateApplication(selectedApp._id, payload);
      
      // Update local state list
      setApplications(applications.map(a => a._id === selectedApp._id ? res.data : a));
      setSelectedApp(null);
      triggerToast('Application details updated.');
    } catch (err) {
      console.error(err);
      triggerToast('Failed to save details.');
    } finally {
      setSaving(false);
    }
  };

  const triggerToast = (text) => {
    setToastText(text);
    setTimeout(() => setToastText(''), 4000);
  };

  // Kanban statuses columns
  const columns = [
    { id: 'Applied', title: 'Applied', color: 'border-t-blue-500 text-blue-700 bg-blue-50/50' },
    { id: 'Under Review', title: 'Under Review', color: 'border-t-purple-500 text-purple-700 bg-purple-50/50' },
    { id: 'Shortlisted', title: 'Shortlisted', color: 'border-t-indigo-500 text-indigo-700 bg-indigo-50/50' },
    { id: 'Assessment', title: 'Assessment', color: 'border-t-amber-500 text-amber-700 bg-amber-50/50' },
    { id: 'Interview', title: 'Interview', color: 'border-t-orange-500 text-orange-700 bg-orange-50/50' },
    { id: 'Selected', title: 'Selected (Offer)', color: 'border-t-green-500 text-green-700 bg-green-50/50' },
    { id: 'Rejected', title: 'Rejected', color: 'border-t-red-500 text-red-700 bg-red-50/50' }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastText && (
        <div className="fixed bottom-5 right-5 z-50 p-4 bg-slate-900 text-white rounded-xl shadow-lg border border-slate-700 flex items-center gap-3 animate-slide-in text-xs font-semibold">
          <CheckCircle2 size={16} className="text-green-400" />
          <span>{toastText}</span>
        </div>
      )}

      {/* Header with views toggle */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Application Tracker</h1>
          <p className="text-sm text-slate-500 mt-1">Track and manage your submitted applications across recruitment stages</p>
        </div>
        
        {/* Toggle buttons */}
        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-sm shrink-0">
          <button
            onClick={() => setViewMode('kanban')}
            className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-lg transition-all ${
              viewMode === 'kanban' 
                ? 'bg-white text-primary-600 shadow-sm' 
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Trello size={14} />
            <span>Kanban Board</span>
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-lg transition-all ${
              viewMode === 'table' 
                ? 'bg-white text-primary-600 shadow-sm' 
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Table size={14} />
            <span>Table List</span>
          </button>
        </div>
      </div>

      {applications.length === 0 ? (
        <EmptyState 
          title="No applications yet" 
          description="Start applying to jobs to begin your career journey."
          onAction={() => window.location.href = '/jobs'}
          actionText="Find Jobs & Apply"
        />
      ) : viewMode === 'kanban' ? (
        /* Kanban Board View */
        <div className="flex gap-4 overflow-x-auto pb-4 focus:outline-none min-h-[60vh] items-start">
          {columns.map((col) => {
            const colApps = applications.filter(app => app.status === col.id);
            return (
              <div 
                key={col.id} 
                className="w-72 shrink-0 bg-slate-100 border border-slate-200 rounded-2xl p-4 flex flex-col max-h-[75vh]"
              >
                {/* Column Head */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4 shrink-0">
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">{col.title}</h3>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-slate-200 text-slate-600">
                    {colApps.length}
                  </span>
                </div>

                {/* Column body scrollable */}
                <div className="space-y-3 overflow-y-auto pr-0.5 flex-1">
                  {colApps.map((app) => (
                    <div
                      key={app._id}
                      onClick={() => handleOpenDetail(app)}
                      className="bg-white border-t-2 border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer border border-slate-200 border-t-4"
                      style={{ borderTopColor: col.id === 'Selected' ? '#22c55e' : col.id === 'Rejected' ? '#ef4444' : col.id === 'Interview' ? '#f97316' : '#3b82f6' }}
                    >
                      <h4 className="text-sm font-bold text-slate-800 line-clamp-1">{app.job?.title}</h4>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mt-0.5">
                        {app.job?.company?.name || 'Company'}
                      </span>
                      
                      <div className="flex flex-col gap-1 mt-3 pt-2.5 border-t border-slate-100 text-[10px] font-medium text-slate-500">
                        <div className="flex items-center gap-1.5">
                          <Calendar size={12} className="text-slate-400" />
                          <span>Applied: {new Date(app.dates?.appliedAt).toLocaleDateString()}</span>
                        </div>
                        {app.dates?.interviewDate && (
                          <div className="flex items-center gap-1.5 text-orange-600 font-semibold mt-0.5">
                            <Clock size={12} className="text-orange-500" />
                            <span>Interview: {new Date(app.dates.interviewDate).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {colApps.length === 0 && (
                    <div className="py-12 text-center text-xs text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                      Empty column
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table List View */
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm text-slate-700">
              <thead className="bg-slate-50 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <tr>
                  <th scope="col" className="px-6 py-4">Job Details</th>
                  <th scope="col" className="px-6 py-4">Attached Resume</th>
                  <th scope="col" className="px-6 py-4">Applied Date</th>
                  <th scope="col" className="px-6 py-4">Next Event</th>
                  <th scope="col" className="px-6 py-4">Status</th>
                  <th scope="col" className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-medium">
                {applications.map((app) => (
                  <tr key={app._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-900">{app.job?.title}</span>
                        <span className="text-xs text-slate-400 uppercase font-semibold tracking-wider mt-0.5">{app.job?.company?.name || 'Company'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500">
                      <span className="flex items-center gap-1.5">
                        <FileText size={14} className="text-slate-400" />
                        {app.resume?.title || 'Resume'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500">
                      {new Date(app.dates?.appliedAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-600">
                      {app.dates?.interviewDate ? (
                        <span className="text-orange-600 font-bold">Interview: {new Date(app.dates.interviewDate).toLocaleDateString()}</span>
                      ) : app.dates?.assessmentDate ? (
                        <span className="text-amber-600 font-bold">Assessment: {new Date(app.dates.assessmentDate).toLocaleDateString()}</span>
                      ) : (
                        <span className="text-slate-400">None scheduled</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-lg border uppercase tracking-wider ${
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
                        onClick={() => handleOpenDetail(app)}
                        className="px-3 py-1.5 text-xs font-semibold text-primary-600 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors"
                      >
                        Edit / Notes
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detail & Notes Modal */}
      {selectedApp && (
        <Modal
          isOpen={!!selectedApp}
          onClose={() => setSelectedApp(null)}
          title={`Application Details: ${selectedApp.job?.title}`}
        >
          <form onSubmit={handleSaveAppDetails} className="space-y-5">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Company</span>
              <h4 className="text-sm font-bold text-slate-800 mt-0.5">{selectedApp.job?.company?.name || 'Company'}</h4>
            </div>

            {/* Notes field */}
            <div className="space-y-1.5">
              <label htmlFor="notes" className="text-xs font-bold text-slate-400 uppercase tracking-wide block">
                My Application Notes
              </label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                placeholder="Jot down details, follow-ups, password logins for assessments, interviewer names, or salary notes..."
                className="block w-full px-3.5 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all placeholder-slate-400 resize-none text-slate-800"
              />
            </div>

            {/* Interview Date (Candidate can input to document self scheduling) */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label htmlFor="interviewDate" className="text-xs font-bold text-slate-400 uppercase tracking-wide block">
                  Interview Date
                </label>
                <input
                  id="interviewDate"
                  type="date"
                  value={interviewDate}
                  onChange={(e) => setInterviewDate(e.target.value)}
                  className="block w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="assessmentDate" className="text-xs font-bold text-slate-400 uppercase tracking-wide block">
                  Assessment Date
                </label>
                <input
                  id="assessmentDate"
                  type="date"
                  value={assessmentDate}
                  onChange={(e) => setAssessmentDate(e.target.value)}
                  className="block w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            {/* Admin status toggle */}
            {user.role === 'admin' && (
              <div className="space-y-1.5 pt-3 border-t border-slate-100">
                <label htmlFor="adminStatus" className="text-xs font-bold text-slate-500 uppercase tracking-wide block">
                  Candidate Status (Admin Control)
                </label>
                <select
                  id="adminStatus"
                  value={adminStatus}
                  onChange={(e) => setAdminStatus(e.target.value)}
                  className="block w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-3 text-xs text-slate-850 font-bold focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
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
            )}

            {/* Footer Buttons */}
            <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedApp(null)}
                className="flex-1 py-3 text-center text-sm font-semibold text-slate-600 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 py-3 text-center text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-xl shadow-md shadow-primary-200 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default Applications;
