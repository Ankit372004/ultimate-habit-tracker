import React, { useState, useRef, useEffect } from 'react';
import HabitGrid from './components/HabitGrid';
import Analytics from './components/Analytics';
import VisualizationPage from './components/VisualizationPage';
import JournalPage from './components/JournalPage';
import ProfilePage from './components/ProfilePage';
import { LayoutDashboard, Calendar, Settings, Activity, Download, BarChart2, User } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { getProfile } from './utils/api';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isDownloading, setIsDownloading] = useState(false);
  const [userInitial, setUserInitial] = useState('U');
  const contentRef = useRef(null);

  useEffect(() => {
    // Determine user initial
    getProfile().then(p => {
      if (p && p.name) {
        setUserInitial(p.name.charAt(0).toUpperCase());
      }
    });
  }, [activeTab]); // Refresh when tab changes to profile/back

  const handleDownloadPDF = async () => {
    if (!contentRef.current) return;
    setIsDownloading(true);
    try {
      const canvas = await html2canvas(contentRef.current, {
        scale: 2, // Higher quality
        backgroundColor: '#0f172a', // Match background
        logging: false,
        useCORS: true
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [canvas.width, canvas.height]
      });

      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      pdf.save('Ultimate-Tracker-Report.pdf');
    } catch (err) {
      console.error("PDF generation failed:", err);
      alert("Failed to download PDF.");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200">
      {/* Abstract Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-[100px] -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[100px] translate-y-1/2"></div>
      </div>

      {/* Navigation */}
      <nav className="border-b border-white/5 bg-slate-900/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-indigo-500/20">
              U
            </div>
            <span className="font-bold text-xl text-white tracking-tight">Ultimate<span className="text-indigo-400">Tracker</span></span>
          </div>

          <div className="hidden md:flex items-center gap-1 bg-white/5 p-1 rounded-lg border border-white/5">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'dashboard' ? 'bg-indigo-500 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
            >
              <LayoutDashboard size={16} /> Dashboard
            </button>
            <button
              onClick={() => setActiveTab('visualization')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'visualization' ? 'bg-indigo-500 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
            >
              <BarChart2 size={16} /> Visualization
            </button>
            <button
              onClick={() => setActiveTab('journal')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'journal' ? 'bg-indigo-500 text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
            >
              <Calendar size={16} /> Journal
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'profile' ? 'bg-indigo-500 text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
            >
              <User size={16} /> Profile
            </button>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={handleDownloadPDF}
              disabled={isDownloading}
              className={`btn-icon text-slate-400 hover:text-white ${isDownloading ? 'opacity-50 cursor-wait' : ''}`}
              title="Download PDF Report"
            >
              <Download size={20} />
            </button>
            <button onClick={() => setActiveTab('profile')} className="w-9 h-9 rounded-full bg-gradient-to-tr from-slate-700 to-slate-600 border border-slate-500/30 flex items-center justify-center text-sm font-bold text-white hover:border-slate-400 transition-colors">
              {userInitial}
            </button>
          </div>
        </div>
      </nav>

      <main ref={contentRef} className="container mx-auto px-4 py-8 relative z-10">
        {activeTab === 'dashboard' && (
          <>
            <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <h1 className="text-4xl font-bold text-white mb-2">My Dashboard</h1>
                <p className="text-slate-400 max-w-2xl">
                  "Success is the product of daily habits—not once-in-a-lifetime transformations."
                </p>
              </div>
              <div className="text-right hidden md:block">
                <div className="text-sm text-slate-400 font-medium uppercase tracking-wider mb-1">Current Streak</div>
                <div className="text-3xl font-bold text-white flex items-center justify-end gap-2">
                  <Activity className="text-emerald-500" />
                  7 Days
                </div>
              </div>
            </div>

            <Analytics />
            <HabitGrid />
          </>
        )}

        {activeTab === 'visualization' && (
          <VisualizationPage />
        )}

        {activeTab === 'journal' && (
          <JournalPage />
        )}

        {activeTab === 'profile' && (
          <ProfilePage />
        )}
      </main>
    </div>
  );
}

export default App;
