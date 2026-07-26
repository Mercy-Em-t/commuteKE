import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import ReactMarkdown from 'react-markdown';
import architectureDoc from '../assets/architecture_summary.md?raw';

function AdminLibrary() {
    const { user, userRole, loading } = useAuth();
    const [authBuffer, setAuthBuffer] = useState(true);
    const [unlocked, setUnlocked] = useState(false);
    const [tapCount, setTapCount] = useState(0);
    const [activeTab, setActiveTab] = useState('FEATURED');

    // Authentication Buffer
    useEffect(() => {
        if (!loading) {
            const timer = setTimeout(() => setAuthBuffer(false), 1200);
            return () => clearTimeout(timer);
        }
    }, [loading]);

    // 5-Tap Gesture Logic for Classified Docs
    useEffect(() => {
        if (tapCount >= 5) {
            setUnlocked(true);
            setActiveTab('CLASSIFIED');
        }
        const timer = setTimeout(() => setTapCount(0), 1000);
        return () => clearTimeout(timer);
    }, [tapCount]);

    if (loading || authBuffer) {
        return (
            <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white">
                <div className="w-12 h-12 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-slate-400 font-bold tracking-widest uppercase text-sm">Accessing Archives...</p>
                <p className="text-slate-600 text-xs mt-2">Verifying clearance</p>
            </div>
        );
    }

    if (!user || userRole?.role !== 'ADMIN') {
        return (
            <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white p-4 text-center">
                <h1 className="text-4xl font-black text-red-500 mb-2">RESTRICTED SECTION</h1>
                <p className="text-slate-400">Your profile lacks the necessary clearance to enter the Library.</p>
            </div>
        );
    }

    return (
        <div className={`min-h-screen transition-colors duration-1000 ${unlocked ? 'bg-black text-emerald-400' : 'bg-slate-50 text-slate-800'} font-sans flex flex-col md:flex-row`}>
            
            {/* Sidebar Navigation */}
            <aside className={`w-full md:w-64 p-6 border-r ${unlocked ? 'border-emerald-900/30 bg-black' : 'border-slate-200 bg-white shadow-sm'} flex flex-col`}>
                <div className="mb-10 flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-black tracking-tight">Sacco Library</h1>
                        <p className={`text-xs font-bold uppercase tracking-widest mt-1 ${unlocked ? 'text-emerald-600' : 'text-slate-400'}`}>Knowledge Base</p>
                    </div>
                    {/* The Hidden Trigger */}
                    <button 
                        onClick={() => setTapCount(c => c + 1)}
                        className={`p-2 rounded-full transition-all ${unlocked ? 'text-emerald-500' : 'text-slate-300 hover:text-slate-400'}`}
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
                        </svg>
                    </button>
                </div>

                <nav className="space-y-2 flex-grow">
                    {['FEATURED', 'BOOKS', 'JOURNALS', 'IMPLEMENTATIONS'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => {
                                if (unlocked && tab !== 'CLASSIFIED') setUnlocked(false);
                                setActiveTab(tab);
                            }}
                            className={`w-full text-left px-4 py-3 rounded-xl font-bold transition-all text-sm tracking-wide ${activeTab === tab && !unlocked ? 'bg-sky-50 text-sky-700' : (unlocked ? 'text-emerald-600/50 hover:text-emerald-400' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800')}`}
                        >
                            {tab}
                        </button>
                    ))}
                    
                    <a href="/admin/sandbox" className={`block w-full text-left px-4 py-3 rounded-xl font-bold transition-all text-sm tracking-wide ${unlocked ? 'bg-emerald-900/20 text-emerald-500 border border-emerald-500/30' : 'bg-slate-900 text-white shadow-md hover:bg-slate-800'} mt-8`}>
                        <div className="flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                            The Lab (Sandbox)
                        </div>
                    </a>

                    {unlocked && (
                        <button
                            onClick={() => setActiveTab('CLASSIFIED')}
                            className={`w-full text-left px-4 py-3 rounded-xl font-black transition-all text-sm tracking-widest uppercase mt-4 ${activeTab === 'CLASSIFIED' ? 'bg-emerald-900/40 text-emerald-400 border-l-4 border-emerald-500' : 'text-emerald-700 hover:bg-emerald-900/20'}`}
                        >
                            CLASSIFIED
                        </button>
                    )}
                </nav>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 p-8 overflow-y-auto h-screen custom-scrollbar">
                
                {/* Standard Sections */}
                {!unlocked && activeTab === 'FEATURED' && (
                    <div className="animate-in fade-in duration-500">
                        <h2 className="text-3xl font-black text-slate-800 mb-8">Featured Archives</h2>
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            
                            {/* Featured Book */}
                            <div className="col-span-1 lg:col-span-2 bg-gradient-to-br from-slate-900 to-slate-800 p-8 rounded-3xl shadow-xl text-white relative overflow-hidden group">
                                <div className="relative z-10">
                                    <span className="bg-sky-500 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full mb-4 inline-block">Best Seller</span>
                                    <h3 className="text-3xl font-black mb-4 w-3/4 leading-tight">The Modern Transit Conductor</h3>
                                    <p className="text-slate-300 font-medium w-2/3 mb-8">A comprehensive guide on managing fleet telemetry and mastering the Kiungani ecosystem.</p>
                                    <button className="bg-white text-slate-900 font-bold px-6 py-3 rounded-xl hover:bg-slate-100 transition-colors shadow-lg">Read Book</button>
                                </div>
                                <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-sky-500 rounded-full mix-blend-multiply filter blur-3xl opacity-50 group-hover:scale-110 transition-transform duration-700"></div>
                            </div>

                            {/* Recent Journal */}
                            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 flex flex-col">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Latest Journal</span>
                                <h3 className="text-xl font-black text-slate-800 mb-2">Q3 Urban Mobility Report</h3>
                                <p className="text-sm text-slate-500 flex-grow mb-6">Analysis of peak hours vs fleet deployment efficiency along the CBD routes.</p>
                                <button className="w-full bg-slate-100 text-slate-600 font-bold px-4 py-3 rounded-xl hover:bg-slate-200 transition-colors">View Report</button>
                            </div>
                        </div>

                        <h3 className="text-xl font-black text-slate-800 mt-12 mb-6">Iteration Samples</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {[1, 2, 3, 4].map(item => (
                                <div key={item} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow cursor-pointer">
                                    <div className="w-10 h-10 bg-sky-50 rounded-lg flex items-center justify-center text-sky-600 mb-4">
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                                    </div>
                                    <h4 className="font-bold text-slate-800 mb-1">Experiment v{item}.0</h4>
                                    <p className="text-xs text-slate-500">Testing Sandbox Environment Models</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Classified Easter Egg Section */}
                {unlocked && activeTab === 'CLASSIFIED' && (
                    <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 h-full">
                        <div className="bg-emerald-900/10 border border-emerald-500/20 rounded-3xl p-10 shadow-[0_0_80px_rgba(16,185,129,0.05)] h-full flex flex-col">
                            <div className="flex items-center justify-between mb-8 pb-6 border-b border-emerald-900/50">
                                <div className="flex items-center gap-4">
                                    <span className="w-4 h-4 bg-red-500 rounded-full animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.5)]"></span>
                                    <h2 className="text-3xl font-black uppercase tracking-widest text-emerald-400 drop-shadow-md">Architecture Docs</h2>
                                </div>
                                <span className="text-xs font-black text-emerald-700 bg-emerald-900/30 px-3 py-1 rounded-full uppercase tracking-widest border border-emerald-800/50">Classified</span>
                            </div>
                            
                            <div className="prose prose-invert prose-emerald max-w-none text-emerald-100/90 leading-relaxed overflow-y-auto flex-grow pr-4 custom-scrollbar">
                                <ReactMarkdown>{architectureDoc}</ReactMarkdown>
                            </div>
                        </div>
                    </div>
                )}

                {/* Empty State for other tabs */}
                {!unlocked && activeTab !== 'FEATURED' && (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 animate-in fade-in">
                        <svg className="w-16 h-16 mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                        <p className="font-bold text-lg">{activeTab} section is currently empty.</p>
                        <p className="text-sm mt-1">Check back later for more publications.</p>
                    </div>
                )}

            </main>
        </div>
    );
}

export default AdminLibrary;
