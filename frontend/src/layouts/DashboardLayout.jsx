import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, Briefcase, FileText, User, 
  Calendar, Flag, Bell, Bookmark, Settings, 
  LogOut, Shield, Menu, X, ChevronRight
} from 'lucide-react';

const DashboardLayout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  if (!user) {
    // Handled in router redirects, but guard anyway
    return null;
  }

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Jobs', path: '/jobs', icon: Briefcase },
    { name: 'Applications', path: '/applications', icon: FileText },
    { name: 'Resume System', path: '/resume', icon: FileText },
    { name: 'Career Profile', path: '/profile', icon: User },
    { name: 'Calendar & events', path: '/calendar', icon: Calendar },
    { name: 'Saved Jobs', path: '/saved-jobs', icon: Bookmark },
    { name: 'Notifications', path: '/notifications', icon: Bell },
    { name: 'Settings', path: '/settings', icon: Settings }
  ];

  // If user is admin, add Admin Panel route
  if (user.role === 'admin') {
    navItems.splice(1, 0, { name: 'Admin Panel', path: '/admin', icon: Shield });
  }

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-navy-900 text-white">
      {/* Brand Header */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-navy-800">
        <div className="bg-primary-500 p-2 rounded-lg text-white">
          <Briefcase size={20} />
        </div>
        <div>
          <h1 className="text-lg font-bold tracking-tight">CareerFlow</h1>
          <span className="text-xs text-primary-300 font-medium">Career Manager & Builder</span>
        </div>
      </div>

      {/* User Role Card */}
      <div className="px-4 py-3 mx-4 my-4 rounded-xl bg-navy-800 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center font-bold text-white text-sm">
          {user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
        </div>
        <div className="overflow-hidden">
          <h4 className="text-sm font-semibold truncate">{user.name}</h4>
          <span className="text-xs text-slate-400 capitalize">{user.role} Account</span>
        </div>
      </div>

      {/* Nav Menu */}
      <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          return (
            <Link
              key={item.name}
              to={item.path}
              onClick={() => setMobileSidebarOpen(false)}
              className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group ${
                active 
                  ? 'bg-primary-600 text-white font-medium shadow-md shadow-primary-900/10' 
                  : 'text-slate-300 hover:bg-navy-800 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon size={18} className={active ? 'text-white' : 'text-slate-400 group-hover:text-white'} />
                <span className="text-sm">{item.name}</span>
              </div>
              {active && <ChevronRight size={14} />}
            </Link>
          );
        })}
      </nav>

      {/* Logout button */}
      <div className="p-4 border-t border-navy-800">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-4 py-3 text-slate-300 hover:bg-red-950 hover:text-red-200 rounded-xl transition-colors duration-200 text-left"
        >
          <LogOut size={18} className="text-slate-400 group-hover:text-red-200" />
          <span className="text-sm font-medium">Logout</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Desktop Sidebar (visible on lg screens) */}
      <aside className="hidden lg:block w-64 h-full shrink-0 border-r border-slate-200 shadow-sm z-20">
        <SidebarContent />
      </aside>

      {/* Mobile Slide-over Sidebar Drawer */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 flex z-40 lg:hidden" role="dialog" aria-modal="true">
          {/* Overlay */}
          <div 
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" 
            onClick={() => setMobileSidebarOpen(false)}
          ></div>

          {/* Drawer container */}
          <div className="relative flex flex-col max-w-xs w-full h-full bg-navy-900 shadow-2xl animate-slide-in">
            {/* Close button inside panel */}
            <div className="absolute top-4 right-4 z-50">
              <button 
                onClick={() => setMobileSidebarOpen(false)}
                className="p-1 rounded-full text-slate-300 hover:text-white hover:bg-navy-800"
              >
                <X size={20} />
              </button>
            </div>
            <SidebarContent />
          </div>
        </div>
      )}

      {/* Main Area */}
      <div className="flex flex-col flex-1 h-full overflow-hidden">
        {/* Top Navbar */}
        <header className="flex items-center justify-between h-16 px-6 bg-white border-b border-slate-200 shrink-0 z-10 shadow-sm">
          {/* Hamburger button on mobile */}
          <button
            onClick={() => setMobileSidebarOpen(true)}
            className="lg:hidden p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800 rounded-xl"
          >
            <Menu size={20} />
          </button>

          {/* Welcome Text / Dashboard context */}
          <div className="hidden sm:block">
            <h2 className="text-sm font-medium text-slate-500">
              CareerFlow Dashboard & Portal
            </h2>
          </div>

          {/* User Info / Notifications indicator */}
          <div className="flex items-center gap-4 ml-auto">
            <Link to="/notifications" className="relative p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
              <Bell size={18} />
              {/* Dummy red dot for notification check */}
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white"></span>
            </Link>
            
            <div className="h-6 w-px bg-slate-200"></div>

            <Link to="/profile" className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-xs group-hover:ring-2 group-hover:ring-primary-500 transition-all">
                {user.name[0].toUpperCase()}
              </div>
              <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900 transition-colors hidden md:inline-block">
                {user.name.split(' ')[0]}
              </span>
            </Link>
          </div>
        </header>

        {/* Content Outlet View */}
        <main className="flex-1 overflow-y-auto p-6 focus:outline-none">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
