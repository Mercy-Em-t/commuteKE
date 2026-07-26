import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

function AdminLibrary() {
    const { user, userRole, loading } = useAuth();
    const [authBuffer, setAuthBuffer] = useState(true);
    const [unlocked, setUnlocked] = useState(false);
    const [tapCount, setTapCount] = useState(0);

    // Authentication Buffer: Artificially (or realistically) buffer before revealing UI
    useEffect(() => {
        if (!loading) {
            const timer = setTimeout(() => setAuthBuffer(false), 1500);
            return () => clearTimeout(timer);
        }
    }, [loading]);

    // 5-Tap Gesture Logic
    useEffect(() => {
        if (tapCount >= 5) {
            setUnlocked(true);
        }
        
        // Reset tap count if they stop tapping for 1 second
        const timer = setTimeout(() => setTapCount(0), 1000);
        return () => clearTimeout(timer);
    }, [tapCount]);

    if (loading || authBuffer) {
        return (
            <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white">
                <div className="w-12 h-12 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-slate-400 font-bold tracking-widest uppercase text-sm">Verifying Credentials...</p>
                <p className="text-slate-600 text-xs mt-2">Checking Telemetry Headers</p>
            </div>
        );
    }

    if (!user || userRole?.role !== 'ADMIN') {
        return (
            <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white p-4 text-center">
                <h1 className="text-4xl font-black text-red-500 mb-2">ACCESS DENIED</h1>
                <p className="text-slate-400">Your telemetry profile does not have Admin clearance.</p>
            </div>
        );
    }

    return (
        <div className={`min-h-screen transition-colors duration-1000 ${unlocked ? 'bg-black text-emerald-400' : 'bg-slate-50 text-slate-800'} p-8 font-sans`}>
            <div className="max-w-4xl mx-auto">
                <header className="flex justify-between items-center mb-12 border-b pb-4 border-slate-200">
                    <div>
                        <h1 className="text-3xl font-black">Sacco Digital Library</h1>
                        <p className="opacity-70 text-sm mt-1">Official Documentation & Manuals</p>
                    </div>
                    
                    {/* The Hidden Trigger */}
                    <button 
                        onClick={() => setTapCount(c => c + 1)}
                        className={`p-3 rounded-full transition-all ${unlocked ? 'bg-emerald-900/50 text-emerald-400' : 'bg-slate-200 text-slate-500 hover:bg-slate-300'}`}
                    >
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </button>
                </header>

                {!unlocked ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Public Admin Docs */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                            <h2 className="text-xl font-bold mb-2">Driver Onboarding Guide</h2>
                            <p className="text-slate-500 text-sm mb-4">How to provision a new driver and assign them a vehicle.</p>
                            <button className="text-sky-600 font-bold text-sm">Read Manual &rarr;</button>
                        </div>
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                            <h2 className="text-xl font-bold mb-2">Emergency Overrides</h2>
                            <p className="text-slate-500 text-sm mb-4">Standard operating procedures for vehicle breakdown.</p>
                            <button className="text-sky-600 font-bold text-sm">Read Manual &rarr;</button>
                        </div>
                    </div>
                ) : (
                    <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
                        <div className="bg-emerald-900/20 border border-emerald-500/30 rounded-xl p-8 shadow-[0_0_50px_rgba(16,185,129,0.1)]">
                            <div className="flex items-center gap-3 mb-6">
                                <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
                                <h2 className="text-2xl font-black uppercase tracking-widest text-white">TransitOS Architecture (Classified)</h2>
                            </div>
                            
                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-lg font-bold text-white mb-2">1. Core Data Flow</h3>
                                    <p className="text-emerald-300/80 leading-relaxed">The system operates on a highly concurrent WebSocket multiplexer. The Driver Portal streams POSTGIS geometry points directly into the <code>active_trips</code> table. Supabase Realtime immediately broadcasts these row-level changes to thousands of anonymous passenger devices.</p>
                                </div>
                                
                                <div>
                                    <h3 className="text-lg font-bold text-white mb-2">2. Security Telemetry</h3>
                                    <p className="text-emerald-300/80 leading-relaxed">All Admin provisioning requests pass through an IP and User-Agent telemetry wall. Requests lacking valid Admin JWTs or originating from blacklisted IPs are immediately dropped with a 403 status.</p>
                                </div>

                                <div>
                                    <h3 className="text-lg font-bold text-white mb-2">3. The "Express Highway" Filter</h3>
                                    <p className="text-emerald-300/80 leading-relaxed">Passengers do not receive global broadcasts. When Alice clicks the 6 PM Kiungani route, her Service Worker subscribes strictly to <code>tenant_id=eq.kiungani-01&trip_id=eq.123</code>. This guarantees O(1) broadcast complexity per user and eliminates data cross-contamination.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default AdminLibrary;
