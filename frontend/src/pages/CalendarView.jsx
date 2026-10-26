import React, { useState, useEffect } from 'react';
import { eventAPI } from '../services/api';
import Modal from '../components/Modal';
import EmptyState from '../components/EmptyState';
import { 
  Calendar as CalendarIcon, Clock, Plus, Trash2, Edit3, 
  MapPin, Bell, Info, Video, CheckCircle, ChevronRight, CheckCircle2 
} from 'lucide-react';

const CalendarView = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Create / Edit modal state
  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [editingEventId, setEditingEventId] = useState(null);
  const [eventTitle, setEventTitle] = useState('');
  const [eventType, setEventType] = useState('Interview');
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('10:00');
  const [eventDescription, setEventDescription] = useState('');
  const [eventReminder, setEventReminder] = useState(false);
  
  const [saving, setSaving] = useState(false);
  const [toastText, setToastText] = useState('');

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const res = await eventAPI.getEvents();
      setEvents(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const triggerToast = (text) => {
    setToastText(text);
    setTimeout(() => setToastText(''), 4000);
  };

  const handleOpenCreateModal = () => {
    setEditingEventId(null);
    setEventTitle('');
    setEventType('Interview');
    setEventDate(new Date().toISOString().split('T')[0]);
    setEventTime('10:00');
    setEventDescription('');
    setEventReminder(true);
    setEventModalOpen(true);
  };

  const handleOpenEditModal = (event) => {
    const d = new Date(event.date);
    const dateStr = d.toISOString().split('T')[0];
    const hrs = String(d.getHours()).padStart(2, '0');
    const mins = String(d.getMinutes()).padStart(2, '0');
    const timeStr = `${hrs}:${mins}`;

    setEditingEventId(event._id);
    setEventTitle(event.title);
    setEventType(event.type);
    setEventDate(dateStr);
    setEventTime(timeStr);
    setEventDescription(event.description || '');
    setEventReminder(event.reminder || false);
    setEventModalOpen(true);
  };

  const handleSaveEvent = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    // Combine Date and Time fields
    const fullDate = new Date(`${eventDate}T${eventTime}`);

    const payload = {
      title: eventTitle,
      type: eventType,
      date: fullDate.toISOString(),
      description: eventDescription,
      reminder: eventReminder
    };

    try {
      if (editingEventId) {
        // Edit event
        const res = await eventAPI.updateEvent(editingEventId, payload);
        setEvents(events.map(ev => ev._id === editingEventId ? res.data : ev));
        triggerToast('Calendar event updated.');
      } else {
        // Create event
        const res = await eventAPI.createEvent(payload);
        setEvents([...events, res.data]);
        triggerToast('Calendar event created successfully!');
      }
      setEventModalOpen(false);
    } catch (err) {
      console.error(err);
      triggerToast('Failed to save event.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteEvent = async (id) => {
    if (!window.confirm('Delete this event from your calendar?')) return;
    try {
      await eventAPI.deleteEvent(id);
      setEvents(events.filter(ev => ev._id !== id));
      triggerToast('Event deleted from calendar.');
    } catch (err) {
      console.error(err);
      triggerToast('Failed to delete event.');
    }
  };

  const typeConfig = {
    'Interview': { bg: 'bg-orange-50 text-orange-700 border-orange-100', dot: 'bg-orange-500' },
    'Assessment': { bg: 'bg-amber-50 text-amber-700 border-amber-100', dot: 'bg-amber-500' },
    'Application deadline': { bg: 'bg-red-50 text-red-750 border-red-100', dot: 'bg-red-550' },
    'Job fair': { bg: 'bg-blue-50 text-blue-700 border-blue-100', dot: 'bg-blue-500' },
    'Career event': { bg: 'bg-green-50 text-green-700 border-green-100', dot: 'bg-green-500' }
  };

  // Group events by date (today, future, past)
  const todayStr = new Date().toISOString().split('T')[0];
  const sortedEvents = [...events].sort((a, b) => new Date(a.date) - new Date(b.date));

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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Career Calendar</h1>
          <p className="text-sm text-slate-500 mt-1">Manage interview schedules, assessment milestones, and job fair events</p>
        </div>
        <button
          onClick={handleOpenCreateModal}
          className="px-5 py-3 text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-xl shadow-sm transition-colors flex items-center gap-2 shrink-0"
        >
          <Plus size={16} />
          <span>Add New Event</span>
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary-600"></div>
        </div>
      ) : events.length > 0 ? (
        /* Event timeline cards */
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
          <div className="relative border-l border-slate-200 ml-4 pl-6 space-y-6 py-2">
            {sortedEvents.map((event) => {
              const evDate = new Date(event.date);
              const formattedDate = evDate.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });
              const formattedTime = evDate.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
              const config = typeConfig[event.type] || typeConfig.Interview;

              return (
                <div key={event._id} className="relative group">
                  {/* Timeline dot */}
                  <div className={`absolute -left-[31px] top-1.5 w-4 h-4 rounded-full border-2 border-white ring-2 ring-slate-100 ${config.dot}`} />

                  {/* Card Container */}
                  <div className="bg-slate-50/50 hover:bg-slate-50 border border-slate-200 rounded-2xl p-5 transition-all duration-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="space-y-1.5 overflow-hidden">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 text-[9px] font-bold rounded-lg border uppercase tracking-wider ${config.bg}`}>
                          {event.type}
                        </span>
                        {event.reminder && (
                          <span className="flex items-center gap-0.5 text-[9px] font-bold text-slate-400 uppercase tracking-wide">
                            <Bell size={10} className="text-slate-400" />
                            Reminder Active
                          </span>
                        )}
                      </div>
                      
                      <h3 className="text-sm font-bold text-slate-800 truncate">{event.title}</h3>
                      
                      <div className="flex items-center gap-3 text-xs font-semibold text-slate-500">
                        <span className="flex items-center gap-1"><CalendarIcon size={13} /> {formattedDate}</span>
                        <span className="flex items-center gap-1"><Clock size={13} /> {formattedTime}</span>
                      </div>
                      
                      {event.description && (
                        <p className="text-xs text-slate-500 max-w-xl leading-relaxed whitespace-pre-line pt-1">
                          {event.description}
                        </p>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      <button
                        onClick={() => handleOpenEditModal(event)}
                        className="p-2 border border-slate-200 rounded-xl text-slate-400 hover:text-primary-600 hover:bg-primary-50 transition-colors"
                        title="Edit event"
                      >
                        <Edit3 size={14} />
                      </button>
                      <button
                        onClick={() => handleDeleteEvent(event._id)}
                        className="p-2 border border-slate-200 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="Delete event"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <EmptyState
          title="Calendar is empty"
          description="Create your first scheduling slot or apply to jobs to automatically populate interview dates."
          onAction={handleOpenCreateModal}
          actionText="Add New Event"
        />
      )}

      {/* Create / Edit Modal overlay */}
      {eventModalOpen && (
        <Modal
          isOpen={eventModalOpen}
          onClose={() => setEventModalOpen(false)}
          title={editingEventId ? 'Edit Event details' : 'Schedule New Event'}
        >
          <form onSubmit={handleSaveEvent} className="space-y-4">
            {/* Title */}
            <div className="space-y-1.5">
              <label htmlFor="ev-title" className="text-xs font-bold text-slate-400 uppercase tracking-wide block">
                Event Title *
              </label>
              <input
                id="ev-title"
                type="text"
                required
                value={eventTitle}
                onChange={(e) => setEventTitle(e.target.value)}
                placeholder="e.g. Mock Coding Session / Zoom round"
                className="block w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              {/* Type */}
              <div className="space-y-1.5">
                <label htmlFor="ev-type" className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">
                  Category
                </label>
                <select
                  id="ev-type"
                  value={eventType}
                  onChange={(e) => setEventType(e.target.value)}
                  className="block w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-2"
                >
                  <option value="Interview">Interview</option>
                  <option value="Assessment">Assessment</option>
                  <option value="Application deadline">Application deadline</option>
                  <option value="Job fair">Job fair</option>
                  <option value="Career event">Career event</option>
                </select>
              </div>

              {/* Date */}
              <div className="space-y-1.5">
                <label htmlFor="ev-date" className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">
                  Event Date
                </label>
                <input
                  id="ev-date"
                  type="date"
                  required
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="block w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              {/* Time */}
              <div className="space-y-1.5">
                <label htmlFor="ev-time" className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">
                  Time Slot
                </label>
                <input
                  id="ev-time"
                  type="time"
                  required
                  value={eventTime}
                  onChange={(e) => setEventTime(e.target.value)}
                  className="block w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5"
                />
              </div>

              {/* Reminder toggle */}
              <div className="flex items-center gap-2 mt-7 pl-1">
                <input
                  id="ev-reminder"
                  type="checkbox"
                  checked={eventReminder}
                  onChange={(e) => setEventReminder(e.target.checked)}
                  className="h-4.5 w-4.5 text-primary-600 focus:ring-primary-500 border-slate-300 rounded"
                />
                <label htmlFor="ev-reminder" className="text-[11px] font-bold text-slate-500 uppercase cursor-pointer">
                  Activate Email Alert
                </label>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label htmlFor="ev-desc" className="text-xs font-bold text-slate-400 uppercase tracking-wide block">
                Description / Details
              </label>
              <textarea
                id="ev-desc"
                value={eventDescription}
                onChange={(e) => setEventDescription(e.target.value)}
                rows={3}
                placeholder="Virtual link details, recruiter name, preparation syllabus notes..."
                className="block w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEventModalOpen(false)}
                className="flex-1 py-3 text-center text-sm font-semibold text-slate-600 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 py-3 text-center text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-xl shadow-md shadow-primary-200 transition-colors flex items-center justify-center gap-1.5"
              >
                {saving ? 'Saving...' : 'Save Event'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default CalendarView;
