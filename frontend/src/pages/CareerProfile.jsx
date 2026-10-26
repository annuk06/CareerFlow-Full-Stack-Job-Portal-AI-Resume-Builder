import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { profileAPI } from '../services/api';
import { 
  User, BookOpen, Brain, Briefcase, Rocket, 
  Award, CheckCircle, Save, Plus, Trash2, CheckCircle2 
} from 'lucide-react';

const CareerProfile = () => {
  const { profile, updateProfileState } = useAuth();
  
  // Tab control: 'personal', 'education', 'skills', 'experience', 'projects', 'certifications'
  const [activeTab, setActiveTab] = useState('personal');
  const [loading, setLoading] = useState(false);
  const [toastText, setToastText] = useState('');
  
  // Local state copy of profile
  const [localProfile, setLocalProfile] = useState({
    personal: { name: '', email: '', phone: '', location: '', linkedin: '', github: '', portfolio: '', photo: '' },
    education: [],
    skills: { technical: [], programmingLanguages: [], frameworks: [], databases: [], tools: [] },
    experience: [],
    projects: [],
    certifications: [],
    achievements: []
  });

  useEffect(() => {
    if (profile) {
      setLocalProfile(JSON.parse(JSON.stringify(profile)));
    }
  }, [profile]);

  const triggerToast = (text) => {
    setToastText(text);
    setTimeout(() => setToastText(''), 4000);
  };

  const handlePersonalChange = (e) => {
    setLocalProfile({
      ...localProfile,
      personal: { ...localProfile.personal, [e.target.name]: e.target.value }
    });
  };

  const addArrayItem = (section, blankObj) => {
    setLocalProfile({
      ...localProfile,
      [section]: [...(localProfile[section] || []), blankObj]
    });
  };

  const removeArrayItem = (section, idx) => {
    const arr = [...localProfile[section]];
    arr.splice(idx, 1);
    setLocalProfile({ ...localProfile, [section]: arr });
  };

  const handleArrayChange = (section, idx, field, val) => {
    const arr = [...localProfile[section]];
    arr[idx] = { ...arr[idx], [field]: val };
    setLocalProfile({ ...localProfile, [section]: arr });
  };

  const handleSkillsChange = (category, valueString) => {
    // Convert comma-separated string to array
    const arr = valueString.split(',').map(s => s.trim()).filter(Boolean);
    setLocalProfile({
      ...localProfile,
      skills: { ...localProfile.skills, [category]: arr }
    });
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateProfileState(localProfile);
      triggerToast('Career Profile saved successfully!');
    } catch (err) {
      console.error(err);
      triggerToast('Failed to save profile.');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'personal', title: 'Personal Info', icon: User },
    { id: 'education', title: 'Education', icon: BookOpen },
    { id: 'skills', title: 'Skills', icon: Brain },
    { id: 'experience', title: 'Experience', icon: Briefcase },
    { id: 'projects', title: 'Projects', icon: Rocket },
    { id: 'certifications', title: 'Credentials', icon: Award }
  ];

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
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Professional Profile</h1>
          <p className="text-sm text-slate-500 mt-1">Keep your credentials updated to sync with job matching and ATS resumes</p>
        </div>
        <button
          onClick={handleSaveProfile}
          disabled={loading}
          className="px-5 py-3 text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-xl shadow-sm transition-colors flex items-center gap-2 disabled:opacity-50 shrink-0"
        >
          <Save size={16} />
          {loading ? 'Saving...' : 'Save Profile'}
        </button>
      </div>

      {/* Profile workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Navigation Tabs */}
        <div className="lg:col-span-1 bg-white rounded-2xl border border-slate-200 p-4.5 shadow-sm space-y-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left text-xs font-bold uppercase tracking-wider ${
                  active 
                    ? 'bg-primary-50 text-primary-600 border border-primary-100' 
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                }`}
              >
                <Icon size={16} className={active ? 'text-primary-600' : 'text-slate-400'} />
                <span>{tab.title}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Forms column */}
        <div className="lg:col-span-3 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm min-h-[50vh]">
          {/* PERSONAL INFO TAB */}
          {activeTab === 'personal' && (
            <div className="space-y-6">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-3">Personal Contact Details</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold text-slate-500">
                <div className="space-y-1">
                  <label>Full Name</label>
                  <input
                    type="text"
                    name="name"
                    value={localProfile.personal.name || ''}
                    onChange={handlePersonalChange}
                    className="block w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-850 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  />
                </div>
                <div className="space-y-1">
                  <label>Email Address</label>
                  <input
                    type="email"
                    name="email"
                    value={localProfile.personal.email || ''}
                    onChange={handlePersonalChange}
                    className="block w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-850 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  />
                </div>
                <div className="space-y-1">
                  <label>Phone Number</label>
                  <input
                    type="tel"
                    name="phone"
                    value={localProfile.personal.phone || ''}
                    onChange={handlePersonalChange}
                    className="block w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-850"
                  />
                </div>
                <div className="space-y-1">
                  <label>Location (City, State/Country)</label>
                  <input
                    type="text"
                    name="location"
                    value={localProfile.personal.location || ''}
                    onChange={handlePersonalChange}
                    className="block w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-850"
                  />
                </div>
                <div className="space-y-1">
                  <label>LinkedIn URL</label>
                  <input
                    type="url"
                    name="linkedin"
                    value={localProfile.personal.linkedin || ''}
                    onChange={handlePersonalChange}
                    className="block w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-850"
                  />
                </div>
                <div className="space-y-1">
                  <label>GitHub Profile URL</label>
                  <input
                    type="url"
                    name="github"
                    value={localProfile.personal.github || ''}
                    onChange={handlePersonalChange}
                    className="block w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-850"
                  />
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <label>Portfolio Site / Personal Link</label>
                  <input
                    type="url"
                    name="portfolio"
                    value={localProfile.personal.portfolio || ''}
                    onChange={handlePersonalChange}
                    className="block w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-850"
                  />
                </div>
              </div>
            </div>
          )}

          {/* EDUCATION TAB */}
          {activeTab === 'education' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Education Degrees</h3>
                <button
                  type="button"
                  onClick={() => addArrayItem('education', { degree: '', college: '', university: '', startYear: '', endYear: '', cgpa: '' })}
                  className="px-3.5 py-1.5 bg-slate-150 border border-slate-200 rounded-xl text-xs font-bold text-slate-650 hover:bg-slate-200"
                >
                  + Add Degree
                </button>
              </div>

              <div className="space-y-4">
                {(localProfile.education || []).map((ed, idx) => (
                  <div key={idx} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-500 relative space-y-3">
                    <button
                      type="button"
                      onClick={() => removeArrayItem('education', idx)}
                      className="absolute top-4 right-4 text-slate-400 hover:text-red-500"
                    >
                      <Trash2 size={16} />
                    </button>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                      <div className="space-y-1">
                        <label>Degree / Major (e.g. B.Tech CS)</label>
                        <input
                          type="text"
                          value={ed.degree || ''}
                          onChange={(e) => handleArrayChange('education', idx, 'degree', e.target.value)}
                          className="block w-full mt-1 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-850"
                        />
                      </div>
                      <div className="space-y-1">
                        <label>College / School Name</label>
                        <input
                          type="text"
                          value={ed.college || ''}
                          onChange={(e) => handleArrayChange('education', idx, 'college', e.target.value)}
                          className="block w-full mt-1 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-850"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label>Start Year</label>
                          <input
                            type="text"
                            value={ed.startYear || ''}
                            onChange={(e) => handleArrayChange('education', idx, 'startYear', e.target.value)}
                            className="block w-full mt-1 bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-850"
                          />
                        </div>
                        <div className="space-y-1">
                          <label>End Year</label>
                          <input
                            type="text"
                            value={ed.endYear || ''}
                            onChange={(e) => handleArrayChange('education', idx, 'endYear', e.target.value)}
                            className="block w-full mt-1 bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-850"
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label>CGPA / Percentage</label>
                        <input
                          type="text"
                          value={ed.cgpa || ''}
                          onChange={(e) => handleArrayChange('education', idx, 'cgpa', e.target.value)}
                          className="block w-full mt-1 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-850"
                        />
                      </div>
                    </div>
                  </div>
                ))}

                {(localProfile.education || []).length === 0 && (
                  <div className="py-12 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                    No education records added.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SKILLS TAB */}
          {activeTab === 'skills' && (
            <div className="space-y-6">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-3">Technical Skills & Categories</h3>
              <p className="text-xs text-slate-400">Provide comma-separated values (e.g. React, Vue, Angular)</p>
              
              <div className="space-y-4 text-xs font-semibold text-slate-500">
                <div className="space-y-1">
                  <label>Programming Languages</label>
                  <input
                    type="text"
                    defaultValue={(localProfile.skills.programmingLanguages || []).join(', ')}
                    onBlur={(e) => handleSkillsChange('programmingLanguages', e.target.value)}
                    placeholder="e.g. JavaScript, Python, C++"
                    className="block w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800"
                  />
                </div>
                <div className="space-y-1">
                  <label>Frameworks & Libraries</label>
                  <input
                    type="text"
                    defaultValue={(localProfile.skills.frameworks || []).join(', ')}
                    onBlur={(e) => handleSkillsChange('frameworks', e.target.value)}
                    placeholder="e.g. React, Next.js, Django"
                    className="block w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800"
                  />
                </div>
                <div className="space-y-1">
                  <label>Databases</label>
                  <input
                    type="text"
                    defaultValue={(localProfile.skills.databases || []).join(', ')}
                    onBlur={(e) => handleSkillsChange('databases', e.target.value)}
                    placeholder="e.g. MongoDB, PostgreSQL, Redis"
                    className="block w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800"
                  />
                </div>
                <div className="space-y-1">
                  <label>Tools & Platforms</label>
                  <input
                    type="text"
                    defaultValue={(localProfile.skills.tools || []).join(', ')}
                    onBlur={(e) => handleSkillsChange('tools', e.target.value)}
                    placeholder="e.g. Docker, AWS, Git, Figma"
                    className="block w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800"
                  />
                </div>
                <div className="space-y-1">
                  <label>Additional Technical Skills</label>
                  <input
                    type="text"
                    defaultValue={(localProfile.skills.technical || []).join(', ')}
                    onBlur={(e) => handleSkillsChange('technical', e.target.value)}
                    placeholder="e.g. REST APIs, Agile, CI/CD"
                    className="block w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800"
                  />
                </div>
              </div>
            </div>
          )}

          {/* EXPERIENCE TAB */}
          {activeTab === 'experience' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Employment History</h3>
                <button
                  type="button"
                  onClick={() => addArrayItem('experience', { company: '', position: '', startDate: '', endDate: '', description: '' })}
                  className="px-3.5 py-1.5 bg-slate-150 border border-slate-200 rounded-xl text-xs font-bold text-slate-650 hover:bg-slate-200"
                >
                  + Add Experience
                </button>
              </div>

              <div className="space-y-4">
                {(localProfile.experience || []).map((exp, idx) => (
                  <div key={idx} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-500 relative space-y-3">
                    <button
                      type="button"
                      onClick={() => removeArrayItem('experience', idx)}
                      className="absolute top-4 right-4 text-slate-400 hover:text-red-500"
                    >
                      <Trash2 size={16} />
                    </button>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                      <div className="space-y-1">
                        <label>Job Title / Position</label>
                        <input
                          type="text"
                          value={exp.position || ''}
                          onChange={(e) => handleArrayChange('experience', idx, 'position', e.target.value)}
                          className="block w-full mt-1 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-855"
                        />
                      </div>
                      <div className="space-y-1">
                        <label>Company Name</label>
                        <input
                          type="text"
                          value={exp.company || ''}
                          onChange={(e) => handleArrayChange('experience', idx, 'company', e.target.value)}
                          className="block w-full mt-1 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-855"
                        />
                      </div>
                      <div className="space-y-1">
                        <label>Start Date (Month, Year)</label>
                        <input
                          type="text"
                          value={exp.startDate || ''}
                          onChange={(e) => handleArrayChange('experience', idx, 'startDate', e.target.value)}
                          className="block w-full mt-1 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-855"
                        />
                      </div>
                      <div className="space-y-1">
                        <label>End Date (or 'Present')</label>
                        <input
                          type="text"
                          value={exp.endDate || ''}
                          onChange={(e) => handleArrayChange('experience', idx, 'endDate', e.target.value)}
                          className="block w-full mt-1 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-855"
                        />
                      </div>
                      <div className="space-y-1 sm:col-span-2">
                        <label>Duties Description</label>
                        <textarea
                          value={exp.description || ''}
                          onChange={(e) => handleArrayChange('experience', idx, 'description', e.target.value)}
                          rows={3}
                          className="block w-full mt-1 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-855 resize-none"
                        />
                      </div>
                    </div>
                  </div>
                ))}
                
                {(localProfile.experience || []).length === 0 && (
                  <div className="py-12 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                    No work experience added.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* PROJECTS TAB */}
          {activeTab === 'projects' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Key Projects</h3>
                <button
                  type="button"
                  onClick={() => addArrayItem('projects', { name: '', description: '', technologies: [], github: '', live: '' })}
                  className="px-3.5 py-1.5 bg-slate-150 border border-slate-200 rounded-xl text-xs font-bold text-slate-650 hover:bg-slate-200"
                >
                  + Add Project
                </button>
              </div>

              <div className="space-y-4">
                {(localProfile.projects || []).map((proj, idx) => (
                  <div key={idx} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-500 relative space-y-3">
                    <button
                      type="button"
                      onClick={() => removeArrayItem('projects', idx)}
                      className="absolute top-4 right-4 text-slate-400 hover:text-red-500"
                    >
                      <Trash2 size={16} />
                    </button>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                      <div className="space-y-1">
                        <label>Project Name</label>
                        <input
                          type="text"
                          value={proj.name || ''}
                          onChange={(e) => handleArrayChange('projects', idx, 'name', e.target.value)}
                          className="block w-full mt-1 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-855"
                        />
                      </div>
                      <div className="space-y-1">
                        <label>Technologies Used (Comma-separated)</label>
                        <input
                          type="text"
                          value={(proj.technologies || []).join(', ')}
                          onChange={(e) => handleArrayChange('projects', idx, 'technologies', e.target.value.split(',').map(s => s.trim()))}
                          className="block w-full mt-1 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-855"
                        />
                      </div>
                      <div className="space-y-1">
                        <label>GitHub Link</label>
                        <input
                          type="url"
                          value={proj.github || ''}
                          onChange={(e) => handleArrayChange('projects', idx, 'github', e.target.value)}
                          className="block w-full mt-1 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-855"
                        />
                      </div>
                      <div className="space-y-1">
                        <label>Live Demo URL</label>
                        <input
                          type="url"
                          value={proj.live || ''}
                          onChange={(e) => handleArrayChange('projects', idx, 'live', e.target.value)}
                          className="block w-full mt-1 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-855"
                        />
                      </div>
                      <div className="space-y-1 sm:col-span-2">
                        <label>Project Summary Description</label>
                        <textarea
                          value={proj.description || ''}
                          onChange={(e) => handleArrayChange('projects', idx, 'description', e.target.value)}
                          rows={2.5}
                          className="block w-full mt-1 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-855 resize-none"
                        />
                      </div>
                    </div>
                  </div>
                ))}
                
                {(localProfile.projects || []).length === 0 && (
                  <div className="py-12 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                    No projects added.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* CERTIFICATIONS TAB */}
          {activeTab === 'certifications' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Certifications & Achievements</h3>
                <button
                  type="button"
                  onClick={() => addArrayItem('certifications', { name: '', organization: '', date: '', url: '' })}
                  className="px-3.5 py-1.5 bg-slate-150 border border-slate-200 rounded-xl text-xs font-bold text-slate-650 hover:bg-slate-200"
                >
                  + Add Certification
                </button>
              </div>

              <div className="space-y-4">
                {(localProfile.certifications || []).map((cert, idx) => (
                  <div key={idx} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-500 relative space-y-3">
                    <button
                      type="button"
                      onClick={() => removeArrayItem('certifications', idx)}
                      className="absolute top-4 right-4 text-slate-400 hover:text-red-500"
                    >
                      <Trash2 size={16} />
                    </button>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                      <div className="space-y-1">
                        <label>Certificate Name</label>
                        <input
                          type="text"
                          value={cert.name || ''}
                          onChange={(e) => handleArrayChange('certifications', idx, 'name', e.target.value)}
                          className="block w-full mt-1 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-855"
                        />
                      </div>
                      <div className="space-y-1">
                        <label>Issuing Organization</label>
                        <input
                          type="text"
                          value={cert.organization || ''}
                          onChange={(e) => handleArrayChange('certifications', idx, 'organization', e.target.value)}
                          className="block w-full mt-1 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-855"
                        />
                      </div>
                      <div className="space-y-1">
                        <label>Issue Date</label>
                        <input
                          type="text"
                          value={cert.date || ''}
                          onChange={(e) => handleArrayChange('certifications', idx, 'date', e.target.value)}
                          className="block w-full mt-1 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-855"
                        />
                      </div>
                      <div className="space-y-1">
                        <label>Credential URL</label>
                        <input
                          type="url"
                          value={cert.url || ''}
                          onChange={(e) => handleArrayChange('certifications', idx, 'url', e.target.value)}
                          className="block w-full mt-1 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-855"
                        />
                      </div>
                    </div>
                  </div>
                ))}
                
                {(localProfile.certifications || []).length === 0 && (
                  <div className="py-12 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                    No certifications added.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CareerProfile;
