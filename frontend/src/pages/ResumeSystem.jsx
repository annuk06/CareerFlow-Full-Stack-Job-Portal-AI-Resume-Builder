import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { resumeAPI, profileAPI } from '../services/api';
import EmptyState from '../components/EmptyState';
import Modal from '../components/Modal';
import { 
  FileText, Upload, Plus, Download, Save, Trash2, Eye, 
  ChevronLeft, LayoutGrid, Check, Settings, Sparkles, AlertCircle, CheckCircle2 
} from 'lucide-react';

const ResumeSystem = () => {
  const { user, profile, refreshProfile } = useAuth();
  
  // View states: 'dashboard', 'builder', 'extractor'
  const [currentView, setCurrentView] = useState('dashboard');
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Builder state
  const [activeResumeId, setActiveResumeId] = useState(null);
  const [resumeTitle, setResumeTitle] = useState('My Resume');
  const [selectedTemplate, setSelectedTemplate] = useState('modern');
  const [fontFamily, setFontFamily] = useState('font-sans');
  const [primaryColor, setPrimaryColor] = useState('#2563eb');
  
  // Section visibility toggles
  const [visibleSections, setVisibleSections] = useState({
    summary: true,
    skills: true,
    education: true,
    experience: true,
    projects: true,
    certifications: true,
    achievements: true
  });

  // Builder editable resume data
  const [resumeData, setResumeData] = useState({
    personal: { name: '', email: '', phone: '', location: '', linkedin: '', github: '', portfolio: '', summary: '' },
    education: [],
    skills: { technical: [], programmingLanguages: [], frameworks: [], databases: [], tools: [] },
    experience: [],
    projects: [],
    certifications: [],
    achievements: []
  });

  // Resume Extractor State (Option B)
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [extractedResult, setExtractedResult] = useState(null); // hold parsed data before save
  const [extractionAlert, setExtractionAlert] = useState(null);

  // Common UI State
  const [toastText, setToastText] = useState('');
  const [toastType, setToastType] = useState('success');

  const triggerToast = (type, text) => {
    setToastType(type);
    setToastText(text);
    setTimeout(() => setToastText(''), 4000);
  };

  const fetchResumes = async () => {
    setLoading(true);
    try {
      const res = await resumeAPI.getResumes();
      setResumes(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResumes();
  }, []);

  // Option A - Launch blank builder or populate with profile details
  const handleLaunchBuilder = (existingResume = null) => {
    if (existingResume) {
      setActiveResumeId(existingResume._id);
      setResumeTitle(existingResume.title);
      setSelectedTemplate(existingResume.template || 'modern');
      setResumeData(existingResume.resumeData);
    } else {
      // Create new: seed form fields from active Career Profile if available
      setActiveResumeId(null);
      setResumeTitle('My Professional Resume');
      setSelectedTemplate('modern');
      
      setResumeData({
        personal: {
          name: profile?.personal?.name || user?.name || '',
          email: profile?.personal?.email || user?.email || '',
          phone: profile?.personal?.phone || user?.phone || '',
          location: profile?.personal?.location || '',
          linkedin: profile?.personal?.linkedin || '',
          github: profile?.personal?.github || '',
          portfolio: profile?.personal?.portfolio || '',
          summary: 'Motivated professional with expertise in technical delivery and system architecture.'
        },
        education: profile?.education || [],
        skills: profile?.skills || { technical: [], programmingLanguages: [], frameworks: [], databases: [], tools: [] },
        experience: profile?.experience || [],
        projects: profile?.projects || [],
        certifications: profile?.certifications || [],
        achievements: profile?.achievements || []
      });
    }
    setCurrentView('builder');
  };

  // Option B - Handle resume upload and extract text
  const handleFileUploadChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploadFile(file);
    }
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!uploadFile) return;

    setUploadLoading(true);
    setExtractionAlert(null);
    const formData = new FormData();
    formData.append('resume', uploadFile);

    try {
      const res = await resumeAPI.uploadResume(formData);
      // Backend returns message, subMessage, and parsed extractedData
      setExtractedResult(res.data.extractedData);
      setExtractionAlert({
        message: res.data.message, // "Resume uploaded successfully"
        subMessage: res.data.subMessage // "Review extracted information before saving."
      });
      setCurrentView('extractor');
    } catch (err) {
      triggerToast('danger', err.response?.data?.message || 'Resume upload parsing failed.');
    } finally {
      setUploadLoading(false);
      setUploadFile(null);
    }
  };

  // Confirm Extracted Data -> Save to Profile & Save to Resumes
  const handleConfirmExtraction = async () => {
    try {
      // 1. Save to profile first (Mongoose Profile model update)
      const profilePayload = {
        personal: {
          name: extractedResult.personal.name,
          email: extractedResult.personal.email,
          phone: extractedResult.personal.phone,
          location: extractedResult.personal.location,
          linkedin: extractedResult.personal.linkedin,
          github: extractedResult.personal.github,
          portfolio: extractedResult.personal.portfolio,
          photo: profile?.personal?.photo || ''
        },
        education: extractedResult.education,
        skills: extractedResult.skills,
        experience: extractedResult.experience,
        projects: extractedResult.projects,
        certifications: extractedResult.certifications,
        achievements: extractedResult.achievements
      };
      
      await profileAPI.updateProfile(profilePayload);
      await refreshProfile();

      // 2. Create resume in resumes list
      await resumeAPI.createResume({
        title: `Extracted: ${extractedResult.personal.name || 'CV'}`,
        resumeData: extractedResult,
        template: 'ats'
      });

      triggerToast('success', 'Profile and Resume generated successfully!');
      fetchResumes();
      setCurrentView('dashboard');
      setExtractedResult(null);
      setExtractionAlert(null);
    } catch (err) {
      triggerToast('danger', 'Error updating profile database details.');
    }
  };

  // Resume builder saving
  const handleSaveResume = async () => {
    try {
      if (activeResumeId) {
        // Update existing
        await resumeAPI.updateResume(activeResumeId, {
          title: resumeTitle,
          resumeData,
          template: selectedTemplate
        });
        triggerToast('success', 'Resume updated successfully!');
      } else {
        // Create new
        const res = await resumeAPI.createResume({
          title: resumeTitle,
          resumeData,
          template: selectedTemplate
        });
        setActiveResumeId(res.data._id);
        triggerToast('success', 'Resume created successfully!');
      }
      fetchResumes();
    } catch (err) {
      triggerToast('danger', 'Error saving resume.');
    }
  };

  // Resume deletion
  const handleDeleteResume = async (id) => {
    if (!window.confirm('Are you sure you want to delete this resume?')) return;
    try {
      await resumeAPI.deleteResume(id);
      setResumes(resumes.filter(r => r._id !== id));
      triggerToast('success', 'Resume deleted.');
    } catch (err) {
      triggerToast('danger', 'Failed to delete resume.');
    }
  };

  // PDF print trigger
  const handleDownloadPDF = () => {
    window.print();
  };

  // Heuristic handlers for nested arrays in builder
  const addArrayItem = (section, blankObj) => {
    setResumeData({
      ...resumeData,
      [section]: [...resumeData[section], blankObj]
    });
  };

  const removeArrayItem = (section, idx) => {
    const arr = [...resumeData[section]];
    arr.splice(idx, 1);
    setResumeData({ ...resumeData, [section]: arr });
  };

  const handleArrayChange = (section, idx, field, val) => {
    const arr = [...resumeData[section]];
    arr[idx] = { ...arr[idx], [field]: val };
    setResumeData({ ...resumeData, [section]: arr });
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastText && (
        <div className={`fixed bottom-5 right-5 z-50 p-4 rounded-xl shadow-lg border flex items-center gap-3 animate-slide-in text-xs font-semibold ${
          toastType === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          {toastType === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          <span>{toastText}</span>
        </div>
      )}

      {/* DASHBOARD VIEW */}
      {currentView === 'dashboard' && (
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Resume Management</h1>
            <p className="text-sm text-slate-500 mt-1">Generate automated ATS-friendly resumes or parse details from files</p>
          </div>

          {/* Option Boxes (A & B) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Option A Box */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="inline-flex p-3 bg-blue-50 text-blue-600 rounded-2xl border border-blue-100">
                  <Sparkles size={24} />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Option A: Build ATS Resume</h3>
                <p className="text-slate-500 text-sm leading-relaxed">
                  Fill in your professional career profile details and instantly generate a formatted, printer-ready ATS-compliant resume card using clean styles.
                </p>
              </div>
              <button
                onClick={() => handleLaunchBuilder(null)}
                className="w-full py-3 text-center text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2"
              >
                <Plus size={16} />
                <span>Create New Resume</span>
              </button>
            </div>

            {/* Option B Box */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="inline-flex p-3 bg-purple-50 text-purple-600 rounded-2xl border border-purple-100">
                  <Upload size={24} />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Option B: Upload Resume & Parse</h3>
                <p className="text-slate-500 text-sm leading-relaxed">
                  Upload an existing PDF, DOC, or DOCX resume. Our system automatically extracts education, skills, and experience to fill in your profile!
                </p>
              </div>
              
              <form onSubmit={handleUploadSubmit} className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={handleFileUploadChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="border border-dashed border-slate-200 hover:border-primary-400 bg-slate-50 rounded-xl px-3 py-2.5 text-xs text-slate-500 text-center font-bold truncate">
                    {uploadFile ? uploadFile.name : 'Choose PDF/Word file...'}
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={uploadLoading || !uploadFile}
                  className="px-4 py-2.5 bg-navy-800 text-white rounded-xl text-xs font-semibold hover:bg-navy-950 transition-colors disabled:opacity-50 flex items-center gap-1.5"
                >
                  {uploadLoading ? 'Extracting...' : 'Upload & Parse'}
                </button>
              </form>
            </div>
          </div>

          {/* Resumes List */}
          <div className="space-y-3">
            <h2 className="text-base font-bold text-slate-800">My Saved Resumes</h2>
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[1, 2].map(idx => (
                  <div key={idx} className="h-28 bg-white border rounded-2xl animate-pulse"></div>
                ))}
              </div>
            ) : resumes.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {resumes.map(res => (
                  <div 
                    key={res._id} 
                    className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-slate-50 text-slate-400 rounded-xl border">
                        <FileText size={20} />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-800 truncate max-w-[150px]">{res.title}</h4>
                        <span className="text-[10px] text-primary-600 font-bold uppercase tracking-wide block mt-0.5">
                          {res.template} template
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleLaunchBuilder(res)}
                        className="p-2 border border-slate-200 rounded-xl text-slate-400 hover:text-primary-600 hover:bg-primary-50 transition-colors"
                        title="Edit Resume"
                      >
                        <Eye size={15} />
                      </button>
                      <button
                        onClick={() => handleDeleteResume(res._id)}
                        className="p-2 border border-slate-200 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="Delete Resume"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState 
                title="No Resumes Saved" 
                description="Create your first ATS-friendly resume to begin applying to jobs." 
                icon={FileText}
              />
            )}
          </div>
        </div>
      )}

      {/* EXTRACTOR REVIEW FORM (Option B confirmation) */}
      {currentView === 'extractor' && extractedResult && (
        <div className="space-y-6">
          {extractionAlert && (
            <div className="p-5 bg-green-50 border border-green-200 rounded-2xl flex items-start gap-4">
              <div className="p-1 bg-green-500 rounded-full text-white">
                <Check size={18} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-green-900">{extractionAlert.message}</h3>
                <p className="text-xs text-green-700 mt-0.5">{extractionAlert.subMessage}</p>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <button
              onClick={() => { setCurrentView('dashboard'); setExtractedResult(null); }}
              className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800"
            >
              <ChevronLeft size={16} />
              Back to Dashboard
            </button>
            <button
              onClick={handleConfirmExtraction}
              className="px-5 py-3 text-sm font-bold text-white bg-green-600 hover:bg-green-700 rounded-xl shadow-md shadow-green-100 transition-colors"
            >
              Confirm & Save Extracted Info to Profile
            </button>
          </div>

          {/* Editable Confirmation Form */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
            <h2 className="text-base font-extrabold text-slate-800 pb-3 border-b border-slate-100">Review Parsed Data</h2>

            {/* Personal Details */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Name</label>
                <input
                  type="text"
                  value={extractedResult.personal.name}
                  onChange={(e) => setExtractedResult({
                    ...extractedResult,
                    personal: { ...extractedResult.personal, name: e.target.value }
                  })}
                  className="block w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Email</label>
                <input
                  type="text"
                  value={extractedResult.personal.email}
                  onChange={(e) => setExtractedResult({
                    ...extractedResult,
                    personal: { ...extractedResult.personal, email: e.target.value }
                  })}
                  className="block w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Phone</label>
                <input
                  type="text"
                  value={extractedResult.personal.phone}
                  onChange={(e) => setExtractedResult({
                    ...extractedResult,
                    personal: { ...extractedResult.personal, phone: e.target.value }
                  })}
                  className="block w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800"
                />
              </div>
            </div>

            {/* Extracted Education list */}
            <div className="space-y-3 pt-3 border-t border-slate-100">
              <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">Education History</h3>
              {extractedResult.education.map((ed, idx) => (
                <div key={idx} className="grid grid-cols-1 sm:grid-cols-4 gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="sm:col-span-2">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Degree & Major</label>
                    <input
                      type="text"
                      value={ed.degree}
                      onChange={(e) => {
                        const newEd = [...extractedResult.education];
                        newEd[idx].degree = e.target.value;
                        setExtractedResult({ ...extractedResult, education: newEd });
                      }}
                      className="block w-full mt-1 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-850"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Institution</label>
                    <input
                      type="text"
                      value={ed.college}
                      onChange={(e) => {
                        const newEd = [...extractedResult.education];
                        newEd[idx].college = e.target.value;
                        setExtractedResult({ ...extractedResult, education: newEd });
                      }}
                      className="block w-full mt-1 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-850"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">GPA</label>
                    <input
                      type="text"
                      value={ed.cgpa}
                      onChange={(e) => {
                        const newEd = [...extractedResult.education];
                        newEd[idx].cgpa = e.target.value;
                        setExtractedResult({ ...extractedResult, education: newEd });
                      }}
                      className="block w-full mt-1 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-850"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Extracted Experience list */}
            <div className="space-y-3 pt-3 border-t border-slate-100">
              <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">Experience History</h3>
              {extractedResult.experience.map((exp, idx) => (
                <div key={idx} className="space-y-2 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Position</label>
                      <input
                        type="text"
                        value={exp.position}
                        onChange={(e) => {
                          const newExp = [...extractedResult.experience];
                          newExp[idx].position = e.target.value;
                          setExtractedResult({ ...extractedResult, experience: newExp });
                        }}
                        className="block w-full mt-1 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-850"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Company</label>
                      <input
                        type="text"
                        value={exp.company}
                        onChange={(e) => {
                          const newExp = [...extractedResult.experience];
                          newExp[idx].company = e.target.value;
                          setExtractedResult({ ...extractedResult, experience: newExp });
                        }}
                        className="block w-full mt-1 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-850"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Start Date</label>
                        <input
                          type="text"
                          value={exp.startDate}
                          onChange={(e) => {
                            const newExp = [...extractedResult.experience];
                            newExp[idx].startDate = e.target.value;
                            setExtractedResult({ ...extractedResult, experience: newExp });
                          }}
                          className="block w-full mt-1 bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-850"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">End Date</label>
                        <input
                          type="text"
                          value={exp.endDate}
                          onChange={(e) => {
                            const newExp = [...extractedResult.experience];
                            newExp[idx].endDate = e.target.value;
                            setExtractedResult({ ...extractedResult, experience: newExp });
                          }}
                          className="block w-full mt-1 bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-850"
                        />
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Duties Description</label>
                    <textarea
                      value={exp.description}
                      onChange={(e) => {
                        const newExp = [...extractedResult.experience];
                        newExp[idx].description = e.target.value;
                        setExtractedResult({ ...extractedResult, experience: newExp });
                      }}
                      rows={2}
                      className="block w-full mt-1 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-850 resize-none"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Extracted Skills */}
            <div className="space-y-3 pt-3 border-t border-slate-100">
              <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">Skills Categorized</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Programming Languages (Comma-separated)</label>
                  <input
                    type="text"
                    value={extractedResult.skills.programmingLanguages.join(', ')}
                    onChange={(e) => setExtractedResult({
                      ...extractedResult,
                      skills: { 
                        ...extractedResult.skills, 
                        programmingLanguages: e.target.value.split(',').map(s => s.trim()).filter(Boolean) 
                      }
                    })}
                    className="block w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Frameworks & Technologies</label>
                  <input
                    type="text"
                    value={extractedResult.skills.frameworks.join(', ')}
                    onChange={(e) => setExtractedResult({
                      ...extractedResult,
                      skills: { 
                        ...extractedResult.skills, 
                        frameworks: e.target.value.split(',').map(s => s.trim()).filter(Boolean) 
                      }
                    })}
                    className="block w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* LIVE RESUME BUILDER PANEL (Option A) */}
      {currentView === 'builder' && (
        <div className="space-y-4 no-print">
          {/* Top Panel Bar */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4.5 rounded-2xl border border-slate-200 shadow-sm">
            <button
              onClick={() => setCurrentView('dashboard')}
              className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 shrink-0"
            >
              <ChevronLeft size={16} />
              Exit Resume Builder
            </button>
            
            {/* Title Editing Input */}
            <input
              type="text"
              value={resumeTitle}
              onChange={(e) => setResumeTitle(e.target.value)}
              className="text-sm font-extrabold text-slate-700 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-500 text-center sm:text-left flex-1 max-w-sm"
              placeholder="Resume Document Title"
            />

            {/* Builder Action Buttons */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleSaveResume}
                className="px-3.5 py-2 text-xs font-bold text-white bg-primary-600 hover:bg-primary-700 rounded-xl flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <Save size={14} />
                <span>Save</span>
              </button>
              <button
                onClick={handleDownloadPDF}
                className="px-3.5 py-2 text-xs font-bold text-navy-800 bg-slate-100 hover:bg-slate-250 border rounded-xl flex items-center gap-1.5 transition-colors"
              >
                <Download size={14} />
                <span>Download PDF</span>
              </button>
            </div>
          </div>

          {/* Builder Columns */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            
            {/* Left side: Form Settings & Fields */}
            <div className="space-y-4 max-h-[80vh] overflow-y-auto pr-1">
              
              {/* Template Styling Controls */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1">
                  <Settings size={14} />
                  Template Formatting Controls
                </h3>
                
                <div className="grid grid-cols-2 gap-3.5 text-xs">
                  {/* Select Template Style */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Style Style</label>
                    <select
                      value={selectedTemplate}
                      onChange={(e) => setSelectedTemplate(e.target.value)}
                      className="block w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-700 focus:outline-none"
                    >
                      <option value="modern">Modern Sidebar</option>
                      <option value="professional">Professional Centered</option>
                      <option value="minimal">Minimal Text</option>
                      <option value="ats">Standard ATS (1-Column)</option>
                    </select>
                  </div>

                  {/* Fonts */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Font Family</label>
                    <select
                      value={fontFamily}
                      onChange={(e) => setFontFamily(e.target.value)}
                      className="block w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-700 focus:outline-none"
                    >
                      <option value="font-sans">Inter Sans-Serif</option>
                      <option value="font-serif">Georgia Serif</option>
                      <option value="font-mono">Fira Mono-space</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Personal Details fields */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Personal Header</h3>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400">Name</label>
                    <input
                      type="text"
                      value={resumeData.personal.name}
                      onChange={(e) => setResumeData({
                        ...resumeData,
                        personal: { ...resumeData.personal, name: e.target.value }
                      })}
                      className="block w-full mt-1 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400">Email</label>
                    <input
                      type="text"
                      value={resumeData.personal.email}
                      onChange={(e) => setResumeData({
                        ...resumeData,
                        personal: { ...resumeData.personal, email: e.target.value }
                      })}
                      className="block w-full mt-1 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400">Phone</label>
                    <input
                      type="text"
                      value={resumeData.personal.phone}
                      onChange={(e) => setResumeData({
                        ...resumeData,
                        personal: { ...resumeData.personal, phone: e.target.value }
                      })}
                      className="block w-full mt-1 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400">Location</label>
                    <input
                      type="text"
                      value={resumeData.personal.location}
                      onChange={(e) => setResumeData({
                        ...resumeData,
                        personal: { ...resumeData.personal, location: e.target.value }
                      })}
                      className="block w-full mt-1 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400">LinkedIn URL</label>
                    <input
                      type="text"
                      value={resumeData.personal.linkedin}
                      onChange={(e) => setResumeData({
                        ...resumeData,
                        personal: { ...resumeData.personal, linkedin: e.target.value }
                      })}
                      className="block w-full mt-1 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400">GitHub URL</label>
                    <input
                      type="text"
                      value={resumeData.personal.github}
                      onChange={(e) => setResumeData({
                        ...resumeData,
                        personal: { ...resumeData.personal, github: e.target.value }
                      })}
                      className="block w-full mt-1 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400">Summary Statement</label>
                  <textarea
                    value={resumeData.personal.summary}
                    onChange={(e) => setResumeData({
                      ...resumeData,
                      personal: { ...resumeData.personal, summary: e.target.value }
                    })}
                    rows={3}
                    className="block w-full mt-1 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs resize-none"
                  />
                </div>
              </div>

              {/* Education section */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Education</h3>
                  <button
                    type="button"
                    onClick={() => addArrayItem('education', { degree: 'B.S.', college: 'University', university: '', startYear: '2020', endYear: '2024', cgpa: '' })}
                    className="text-xs text-primary-600 font-bold hover:text-primary-800 flex items-center gap-0.5"
                  >
                    + Add Education
                  </button>
                </div>
                {resumeData.education.map((ed, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 rounded-xl space-y-2 border border-slate-250 text-xs relative">
                    <button
                      type="button"
                      onClick={() => removeArrayItem('education', idx)}
                      className="absolute top-2 right-2 text-slate-400 hover:text-red-500 font-bold"
                    >
                      Delete
                    </button>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <div>
                        <label className="text-[9px] font-bold text-slate-400">Degree</label>
                        <input
                          type="text"
                          value={ed.degree}
                          onChange={(e) => handleArrayChange('education', idx, 'degree', e.target.value)}
                          className="block w-full bg-white border border-slate-200 rounded px-2 py-1"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-bold text-slate-400">College/University</label>
                        <input
                          type="text"
                          value={ed.college}
                          onChange={(e) => handleArrayChange('education', idx, 'college', e.target.value)}
                          className="block w-full bg-white border border-slate-200 rounded px-2 py-1"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-1.5">
                        <div>
                          <label className="text-[9px] font-bold text-slate-400">Start Year</label>
                          <input
                            type="text"
                            value={ed.startYear}
                            onChange={(e) => handleArrayChange('education', idx, 'startYear', e.target.value)}
                            className="block w-full bg-white border border-slate-200 rounded px-1.5 py-1"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] font-bold text-slate-400">End Year</label>
                          <input
                            type="text"
                            value={ed.endYear}
                            onChange={(e) => handleArrayChange('education', idx, 'endYear', e.target.value)}
                            className="block w-full bg-white border border-slate-200 rounded px-1.5 py-1"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-[9px] font-bold text-slate-400">CGPA / %</label>
                        <input
                          type="text"
                          value={ed.cgpa}
                          onChange={(e) => handleArrayChange('education', idx, 'cgpa', e.target.value)}
                          className="block w-full bg-white border border-slate-200 rounded px-2 py-1"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Work Experience */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Experience</h3>
                  <button
                    type="button"
                    onClick={() => addArrayItem('experience', { company: 'Company', position: 'Position', startDate: '2023', endDate: 'Present', description: '' })}
                    className="text-xs text-primary-600 font-bold hover:text-primary-800"
                  >
                    + Add Experience
                  </button>
                </div>
                {resumeData.experience.map((exp, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 rounded-xl space-y-2 border border-slate-250 text-xs relative">
                    <button
                      type="button"
                      onClick={() => removeArrayItem('experience', idx)}
                      className="absolute top-2 right-2 text-slate-400 hover:text-red-500 font-bold"
                    >
                      Delete
                    </button>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <div>
                        <label className="text-[9px] font-bold text-slate-400">Position</label>
                        <input
                          type="text"
                          value={exp.position}
                          onChange={(e) => handleArrayChange('experience', idx, 'position', e.target.value)}
                          className="block w-full bg-white border border-slate-200 rounded px-2 py-1"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-bold text-slate-400">Company</label>
                        <input
                          type="text"
                          value={exp.company}
                          onChange={(e) => handleArrayChange('experience', idx, 'company', e.target.value)}
                          className="block w-full bg-white border border-slate-200 rounded px-2 py-1"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-bold text-slate-400">Start Date</label>
                        <input
                          type="text"
                          value={exp.startDate}
                          onChange={(e) => handleArrayChange('experience', idx, 'startDate', e.target.value)}
                          className="block w-full bg-white border border-slate-200 rounded px-2 py-1"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-bold text-slate-400">End Date</label>
                        <input
                          type="text"
                          value={exp.endDate}
                          onChange={(e) => handleArrayChange('experience', idx, 'endDate', e.target.value)}
                          className="block w-full bg-white border border-slate-200 rounded px-2 py-1"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-slate-400">Description</label>
                      <textarea
                        value={exp.description}
                        onChange={(e) => handleArrayChange('experience', idx, 'description', e.target.value)}
                        rows={2}
                        className="block w-full bg-white border border-slate-200 rounded px-2 py-1 resize-none"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right side: Live Resume preview sheet (can print directly) */}
            <div className="lg:sticky lg:top-4 space-y-4">
              <div className="bg-slate-200/50 p-2.5 rounded-xl border flex items-center justify-between text-xs text-slate-500 font-medium">
                <span>📄 Live PDF Sheet Print Area</span>
                <span className="text-[10px] text-primary-500 font-bold uppercase">Ready</span>
              </div>

              {/* Dynamic Theme Resume Card Preview */}
              <div 
                id="resume-print-area" 
                className={`bg-white border border-slate-350 p-8 shadow-lg max-w-[8.5in] min-h-[11in] mx-auto text-slate-850 font-normal leading-relaxed ${fontFamily}`}
              >
                {/* MODERN Side-bar style */}
                {selectedTemplate === 'modern' && (
                  <div className="grid grid-cols-3 gap-6">
                    {/* Left sidebar info */}
                    <div className="col-span-1 border-r pr-6 space-y-5">
                      <div className="space-y-1 pb-3 border-b">
                        <h2 className="text-xl font-extrabold" style={{ color: primaryColor }}>{resumeData.personal.name || 'Your Name'}</h2>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Software Developer</span>
                      </div>
                      
                      <div className="text-[11px] space-y-2 text-slate-600">
                        <p className="font-semibold text-slate-900 border-b pb-0.5 uppercase tracking-wide text-[10px]">Contact</p>
                        <p className="truncate">{resumeData.personal.email}</p>
                        <p>{resumeData.personal.phone}</p>
                        <p>{resumeData.personal.location}</p>
                        
                        {resumeData.personal.linkedin && (
                          <p className="truncate text-slate-400 font-semibold cursor-pointer">LinkedIn</p>
                        )}
                        {resumeData.personal.github && (
                          <p className="truncate text-slate-400 font-semibold cursor-pointer">GitHub</p>
                        )}
                      </div>

                      {/* Skills list sidebar */}
                      <div className="text-[11px] space-y-2">
                        <p className="font-semibold text-slate-900 border-b pb-0.5 uppercase tracking-wide text-[10px]">Core Skills</p>
                        <div className="flex flex-wrap gap-1">
                          {[
                            ...(resumeData.skills.programmingLanguages || []),
                            ...(resumeData.skills.frameworks || []),
                            ...(resumeData.skills.technical || [])
                          ].map((sk, idx) => (
                            <span key={idx} className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-600 text-[10px]">
                              {sk}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Right side content */}
                    <div className="col-span-2 space-y-5">
                      {/* Summary */}
                      {resumeData.personal.summary && (
                        <div className="space-y-1 text-xs text-slate-650 leading-relaxed">
                          <p className="font-bold text-[11px] text-slate-800 border-b pb-1 uppercase tracking-wider">Professional Profile</p>
                          <p className="whitespace-pre-line">{resumeData.personal.summary}</p>
                        </div>
                      )}

                      {/* Experience list */}
                      {resumeData.experience?.length > 0 && (
                        <div className="space-y-3">
                          <p className="font-bold text-[11px] text-slate-800 border-b pb-1 uppercase tracking-wider">Work History</p>
                          {resumeData.experience.map((exp, idx) => (
                            <div key={idx} className="space-y-1 text-xs">
                              <div className="flex justify-between items-start font-bold">
                                <span className="text-slate-800">{exp.position}</span>
                                <span className="text-slate-400 text-[10px]">{exp.startDate} – {exp.endDate}</span>
                              </div>
                              <div className="text-[11px] font-semibold text-primary-600">{exp.company}</div>
                              <p className="text-[11px] text-slate-600 whitespace-pre-line mt-1">{exp.description}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Education list */}
                      {resumeData.education?.length > 0 && (
                        <div className="space-y-3">
                          <p className="font-bold text-[11px] text-slate-800 border-b pb-1 uppercase tracking-wider">Education</p>
                          {resumeData.education.map((ed, idx) => (
                            <div key={idx} className="space-y-1 text-xs">
                              <div className="flex justify-between items-start font-bold">
                                <span className="text-slate-800">{ed.degree}</span>
                                <span className="text-slate-400 text-[10px]">{ed.startYear} – {ed.endYear}</span>
                              </div>
                              <div className="text-[11px] text-slate-600 font-semibold">{ed.college}</div>
                              {ed.cgpa && <div className="text-[10px] text-slate-400">Score: {ed.cgpa}</div>}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* TRADITIONAL PROFESSIONAL STYLE */}
                {selectedTemplate !== 'modern' && (
                  <div className="space-y-5">
                    {/* Header */}
                    <div className="text-center space-y-1 pb-4 border-b border-slate-200">
                      <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 uppercase">{resumeData.personal.name || 'Your Name'}</h2>
                      <div className="flex flex-wrap items-center justify-center gap-3 text-xs font-medium text-slate-500">
                        <span>{resumeData.personal.email}</span>
                        {resumeData.personal.phone && <span>• {resumeData.personal.phone}</span>}
                        {resumeData.personal.location && <span>• {resumeData.personal.location}</span>}
                      </div>
                      <div className="flex justify-center gap-3 text-[10px] text-slate-400 font-bold">
                        {resumeData.personal.linkedin && <span>LINKEDIN: {resumeData.personal.linkedin}</span>}
                        {resumeData.personal.github && <span>GITHUB: {resumeData.personal.github}</span>}
                      </div>
                    </div>

                    {/* Summary (Minimal/ATS style uses plain blocks) */}
                    {resumeData.personal.summary && (
                      <div className="space-y-1 text-xs">
                        <h3 className="font-bold text-slate-900 border-b pb-0.5 uppercase tracking-wide text-[11px]">Professional Summary</h3>
                        <p className="text-slate-600 leading-normal whitespace-pre-line">{resumeData.personal.summary}</p>
                      </div>
                    )}

                    {/* Core Skills section */}
                    {((resumeData.skills.programmingLanguages?.length > 0) || (resumeData.skills.frameworks?.length > 0)) && (
                      <div className="space-y-1 text-xs">
                        <h3 className="font-bold text-slate-900 border-b pb-0.5 uppercase tracking-wide text-[11px]">Skills & Technical Proficiencies</h3>
                        <div className="grid grid-cols-4 gap-2 pt-1 text-[11px]">
                          {resumeData.skills.programmingLanguages?.length > 0 && (
                            <div className="col-span-4 flex items-start gap-2">
                              <span className="font-bold text-slate-800">Languages:</span>
                              <span className="text-slate-600">{resumeData.skills.programmingLanguages.join(', ')}</span>
                            </div>
                          )}
                          {resumeData.skills.frameworks?.length > 0 && (
                            <div className="col-span-4 flex items-start gap-2">
                              <span className="font-bold text-slate-800">Frameworks:</span>
                              <span className="text-slate-600">{resumeData.skills.frameworks.join(', ')}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Experience section */}
                    {resumeData.experience?.length > 0 && (
                      <div className="space-y-3">
                        <h3 className="font-bold text-slate-900 border-b pb-0.5 uppercase tracking-wide text-[11px]">Employment History</h3>
                        {resumeData.experience.map((exp, idx) => (
                          <div key={idx} className="space-y-1 text-xs">
                            <div className="flex justify-between items-start font-bold">
                              <div>
                                <span className="text-slate-800">{exp.position}</span>
                                <span className="text-slate-400 font-semibold ml-1.5">@ {exp.company}</span>
                              </div>
                              <span className="text-slate-400 text-[10px] font-semibold">{exp.startDate} – {exp.endDate}</span>
                            </div>
                            <p className="text-[11px] text-slate-600 whitespace-pre-line">{exp.description}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Education section */}
                    {resumeData.education?.length > 0 && (
                      <div className="space-y-3">
                        <h3 className="font-bold text-slate-900 border-b pb-0.5 uppercase tracking-wide text-[11px]">Academic Background</h3>
                        {resumeData.education.map((ed, idx) => (
                          <div key={idx} className="space-y-1 text-xs">
                            <div className="flex justify-between items-start font-bold">
                              <div>
                                <span className="text-slate-800">{ed.degree}</span>
                                <span className="text-slate-400 font-semibold ml-1.5">| {ed.college}</span>
                              </div>
                              <span className="text-slate-400 text-[10px] font-semibold">{ed.startYear} – {ed.endYear}</span>
                            </div>
                            {ed.cgpa && <div className="text-[10px] text-slate-500 font-semibold">Grade/Result: {ed.cgpa}</div>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResumeSystem;
