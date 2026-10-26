import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { jobAPI, applicationAPI, eventAPI, notificationAPI } from '../services/api';
import StatCard from '../components/StatCard';
import ApplicationCard from '../components/ApplicationCard';
import JobCard from '../components/JobCard';
import EmptyState from '../components/EmptyState';
import { 
  Building2, Briefcase, CheckCircle2, FileSpreadsheet, 
  UserCheck, HelpCircle, BellRing, Clock, Calendar, ChevronRight
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const Dashboard = () => {
  const { user, profile } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [events, setEvents] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const jobsRes = await jobAPI.getJobs();
        const appsRes = await applicationAPI.getApplications();
        const eventsRes = await eventAPI.getEvents();
        const notesRes = await notificationAPI.getNotifications();

        setJobs(jobsRes.data);
        setApplications(appsRes.data);
        setEvents(eventsRes.data);
        setNotifications(notesRes.data);
      } catch (err) {
        console.error('Error fetching dashboard statistics:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // 1. Calculate stats
  // Unique companies
  const companyIds = new Set(jobs.map(j => j.company?._id || j.company));
  const companiesCount = companyIds.size;
  const openingsCount = jobs.length;
  
  // Eligible Jobs based on overlapping skills
  const userSkills = [
    ...(profile?.skills?.technical || []),
    ...(profile?.skills?.programmingLanguages || []),
    ...(profile?.skills?.frameworks || []),
    ...(profile?.skills?.databases || []),
    ...(profile?.skills?.tools || [])
  ].map(s => s.toLowerCase());

  const eligibleJobs = jobs.filter(job => {
    if (userSkills.length === 0) return true; // fallback if no profile skills set
    const jobSkills = (job.skills || []).map(s => s.toLowerCase());
    return jobSkills.some(s => userSkills.includes(s));
  });

  const applicationsCount = applications.length;
  const shortlistedCount = applications.filter(a => a.status === 'Shortlisted').length;
  const interviewsCount = applications.filter(a => a.status === 'Interview').length;
  const offersCount = applications.filter(a => a.status === 'Selected').length;

  // 2. Application Pipeline Pipeline States
  const pipelineStates = [
    { label: 'Applied', count: applications.filter(a => a.status === 'Applied').length, color: 'bg-blue-500' },
    { label: 'Screening', count: applications.filter(a => a.status === 'Under Review').length, color: 'bg-purple-500' },
    { label: 'Shortlisted', count: shortlistedCount, color: 'bg-indigo-500' },
    { label: 'Interview', count: interviewsCount, color: 'bg-orange-500' },
    { label: 'Selected', count: offersCount, color: 'bg-green-500' },
    { label: 'Rejected', count: applications.filter(a => a.status === 'Rejected').length, color: 'bg-red-500' }
  ];

  // Recharts Data formatting
  const chartData = pipelineStates.map(state => ({
    name: state.label,
    value: state.count,
    color: state.label === 'Selected' ? '#22c55e' : state.label === 'Rejected' ? '#ef4444' : '#3b82f6'
  }));

  // 3. Recommended Jobs: Sort jobs based on overlap of skills
  const getOverlapCount = (job) => {
    const jobSkills = (job.skills || []).map(s => s.toLowerCase());
    return jobSkills.filter(s => userSkills.includes(s)).length;
  };

  const recommendedJobs = [...jobs]
    .filter(j => !applications.some(a => (a.job?._id || a.job) === j._id)) // exclude already applied
    .sort((a, b) => getOverlapCount(b) - getOverlapCount(a))
    .slice(0, 3);

  // 4. Jobs In Process (excluding Selected & Rejected)
  const inProcessApps = applications.filter(a => a.status !== 'Selected' && a.status !== 'Rejected');

  // 5. Upcoming events/deadlines
  const upcomingEvents = events
    .filter(e => new Date(e.date) >= new Date())
    .slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Header banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Welcome back, {user.name.split(' ')[0]} 👋
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Track your career progress and recruitment journey
          </p>
        </div>
        <div className="text-xs font-bold text-slate-400 uppercase bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
          Last login: {new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
        </div>
      </div>

      {/* Grid statistics (7 boxes) */}
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-3">
        <StatCard title="Companies" value={companiesCount} icon={Building2} />
        <StatCard title="Openings" value={openingsCount} icon={Briefcase} />
        <StatCard title="Eligible Jobs" value={eligibleJobs.length} icon={UserCheck} />
        <StatCard title="Applications" value={applicationsCount} icon={FileSpreadsheet} />
        <StatCard title="Shortlisted" value={shortlistedCount} icon={CheckCircle2} />
        <StatCard title="Interviews" value={interviewsCount} icon={Clock} />
        <StatCard title="Offers" value={offersCount} icon={CheckCircle2} />
      </div>

      {/* Primary Funnel Pipeline and Kanban representation */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pipeline Chart Card */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm lg:col-span-2">
          <h2 className="text-base font-bold text-slate-800 mb-4">Application Progress Funnel</h2>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: 'rgba(241, 245, 249, 0.5)' }} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          {/* Detailed step pipeline dots */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mt-4 pt-4 border-t border-slate-100">
            {pipelineStates.map((state, idx) => (
              <div key={idx} className="text-center p-2 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">{state.label}</span>
                <span className="text-lg font-extrabold text-slate-700 block mt-0.5">{state.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Deadlines Widget */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <h2 className="text-base font-bold text-slate-800 mb-4 flex items-center justify-between">
            <span>Upcoming Deadlines</span>
            <Calendar size={16} className="text-primary-500" />
          </h2>
          {upcomingEvents.length > 0 ? (
            <div className="space-y-3">
              {upcomingEvents.map((event) => (
                <div key={event._id} className="p-3 border border-slate-200 rounded-xl flex gap-3 items-start">
                  <div className="p-2 rounded-lg bg-orange-50 text-orange-600 shrink-0 text-xs font-bold text-center w-11">
                    {new Date(event.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                  </div>
                  <div className="overflow-hidden">
                    <h4 className="text-xs font-bold text-slate-800 truncate">{event.title}</h4>
                    <span className="text-[10px] text-orange-600 font-bold uppercase tracking-wider">{event.type}</span>
                    <p className="text-[11px] text-slate-400 truncate mt-0.5">{event.description}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-slate-400">
              No upcoming interview or application deadlines.
            </div>
          )}
        </div>
      </div>

      {/* Lower Dashboard Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Double-Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recently Applied */}
          <div className="space-y-3">
            <h2 className="text-base font-bold text-slate-800">Recently Applied</h2>
            {applications.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {applications.slice(0, 4).map((app) => (
                  <ApplicationCard 
                    key={app._id} 
                    application={app} 
                    onSelect={() => window.location.href = `/applications`}
                  />
                ))}
              </div>
            ) : (
              <EmptyState 
                title="No applications yet" 
                description="Start applying to jobs to begin your career journey."
                onAction={() => window.location.href = '/jobs'}
                actionText="Explore Jobs"
              />
            )}
          </div>

          {/* Recommended Jobs */}
          <div className="space-y-3">
            <h2 className="text-base font-bold text-slate-800">Recommended For You</h2>
            {recommendedJobs.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {recommendedJobs.map((job) => (
                  <JobCard 
                    key={job._id} 
                    job={job} 
                    onSelect={() => window.location.href = `/jobs?id=${job._id}`}
                  />
                ))}
              </div>
            ) : (
              <div className="py-6 text-center text-xs text-slate-400 bg-white border border-slate-200 rounded-2xl">
                Create a resume or update your career profile skills to see matches.
              </div>
            )}
          </div>
        </div>

        {/* Notifications and Alerts widget */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-800 mb-4 flex items-center justify-between">
              <span>Recent Alerts</span>
              <BellRing size={16} className="text-primary-500" />
            </h2>
            {notifications.length > 0 ? (
              <div className="space-y-3">
                {notifications.slice(0, 4).map((note) => (
                  <div key={note._id} className={`p-3 border rounded-xl flex gap-3 items-start ${note.isRead ? 'border-slate-100 opacity-60' : 'bg-slate-50 border-slate-200'}`}>
                    <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${note.type === 'success' ? 'bg-green-500' : note.type === 'danger' ? 'bg-red-500' : 'bg-blue-500'}`} />
                    <div className="overflow-hidden">
                      <h4 className="text-xs font-bold text-slate-800 truncate">{note.title}</h4>
                      <p className="text-[11px] text-slate-500 leading-normal mt-0.5">{note.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-xs text-slate-400">
                You are all caught up!
              </div>
            )}
          </div>
          <button 
            onClick={() => window.location.href = '/notifications'}
            className="w-full text-center text-xs font-bold text-primary-600 hover:text-primary-800 mt-4 pt-4 border-t border-slate-100 flex items-center justify-center gap-1"
          >
            <span>View All Notifications</span>
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
