import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';

function Sandbox() {
    const [logs, setLogs] = useState([]);
    const [simulating, setSimulating] = useState(false);
    const logsEndRef = useRef(null);

    const scrollToBottom = () => {
        logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [logs]);

    const startSimulation = () => {
        if (simulating) return;
        setSimulating(true);
        
        let logCount = 0;
        
        // The Ingestion Engine: Replaying a month of compressed telemetry in 5 minutes
        const interval = setInterval(() => {
            const types = ['GPS', 'PAGEVIEW', 'PAGEVIEW', 'PAGEVIEW', 'AD_CLICK'];
            const type = types[Math.floor(Math.random() * types.length)];
            
            let message = '';
            let color = '';
            
            if (type === 'GPS') {
                const lat = (-1.3 + (Math.random() * 0.1)).toFixed(5);
                const lng = (36.8 + (Math.random() * 0.1)).toFixed(5);
                message = `Vehicle KCD ${Math.floor(Math.random()*900)+100}X pinged location POINT(${lng} ${lat})`;
                color = 'text-amber-400';
            } else if (type === 'PAGEVIEW') {
                const routes = ['kiungani', 'cbd', 'westlands', 'kiserian'];
                const route = routes[Math.floor(Math.random() * routes.length)];
                message = `Anonymous device connected. Subscribed to route [${route}]. Express Highway open.`;
                color = 'text-sky-400';
            } else if (type === 'AD_CLICK') {
                const sponsors = ['Local Butchery', 'School Supplies', 'Hardware Store'];
                const sponsor = sponsors[Math.floor(Math.random() * sponsors.length)];
                message = `Ad interaction: User tapped on [${sponsor}] banner. Earning $0.05.`;
                color = 'text-emerald-400';
            }
            
            const newLog = {
                id: logCount++,
                time: new Date().toISOString().split('T')[1].replace('Z', ''),
                type: type,
                message: message,
                color: color
            };

            setLogs(prev => [...prev, newLog].slice(-100)); // Keep last 100 for UI performance
            
        }, 300); // Emits a log every 300ms (fast playback)

        // Stop after 5 minutes
        setTimeout(() => {
            clearInterval(interval);
            setSimulating(false);
            setLogs(prev => [...prev, {
                id: logCount++,
                time: new Date().toISOString().split('T')[1].replace('Z', ''),
                type: 'SYSTEM',
                message: 'Simulation Complete. Month of telemetry successfully ingested.',
                color: 'text-white'
            }]);
        }, 5 * 60 * 1000);
    };

    return (
        <div className="min-h-screen bg-slate-900 text-slate-300 font-mono p-8 flex flex-col h-screen">
            <header className="bg-slate-900 shadow-sm p-6 text-center border-b border-slate-700 flex flex-col items-center">
                <h1 className="text-3xl font-black text-rose-500 tracking-tight mb-2">TransitOS Sandbox</h1>
                <p className="text-slate-400 font-medium mb-1">Local Testing Environment</p>
                <div className="bg-rose-900/40 border border-rose-800 text-rose-300 text-xs font-bold px-3 py-1 rounded-full mb-6 flex items-center gap-2">
                    <span className="w-2 h-2 bg-rose-500 rounded-full animate-pulse"></span>
                    Executing under: Kiungani Shuttle Sacco (kiungani-01)
                </div>
                
                <div className="flex gap-4 justify-center">
                    <a href="/library/index.html" target="_blank" className="bg-slate-800 hover:bg-slate-700 text-sky-400 font-bold py-2 px-4 rounded border border-slate-700 flex items-center gap-2">
                        <span>📚</span> Docs Library
                    </a>
                    <button 
                        onClick={startSimulation} 
                        disabled={simulating}
                        className={`font-bold py-2 px-6 rounded shadow-lg transition-colors ${simulating ? 'bg-slate-700 text-slate-500 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-500 text-white'}`}
                    >
                        {simulating ? 'Ingesting Data Stream...' : '▶ Run "Busy Day" Simulation'}
                    </button>
                    <a href="/sadmin" className="bg-slate-800 hover:bg-slate-700 text-white py-2 px-4 rounded border border-slate-700">Exit</a>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-grow min-h-0">
                {/* Persona Switcher */}
                <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 flex flex-col gap-4">
                    <h2 className="text-xl font-bold text-white border-b border-slate-700 pb-2 mb-2">Persona Testing</h2>
                    <p className="text-sm text-slate-400 mb-4">Quickly jump into any role without authenticating.</p>
                    
                    <a href="/admin" target="_blank" className="flex items-center justify-between bg-slate-700 p-4 rounded-lg hover:bg-sky-900 hover:border-sky-500 border border-slate-600 transition-all group">
                        <div className="flex items-center gap-3">
                            <span className="text-2xl">👨‍💼</span>
                            <div>
                                <p className="font-bold text-white group-hover:text-sky-300">Sacco Admin</p>
                                <p className="text-xs text-slate-400">View Dashboards & Roster</p>
                            </div>
                        </div>
                        <span className="text-sky-500">&rarr;</span>
                    </a>

                    <a href="/driver" target="_blank" className="flex items-center justify-between bg-slate-700 p-4 rounded-lg hover:bg-amber-900 hover:border-amber-500 border border-slate-600 transition-all group">
                        <div className="flex items-center gap-3">
                            <span className="text-2xl">🚌</span>
                            <div>
                                <p className="font-bold text-white group-hover:text-amber-300">Driver (KCD 123X)</p>
                                <p className="text-xs text-slate-400">Start Trip & Stream GPS</p>
                            </div>
                        </div>
                        <span className="text-amber-500">&rarr;</span>
                    </a>

                    <a href="/clerk" target="_blank" className="flex items-center justify-between bg-slate-700 p-4 rounded-lg hover:bg-purple-900 hover:border-purple-500 border border-slate-600 transition-all group">
                        <div className="flex items-center gap-3">
                            <span className="text-2xl">📋</span>
                            <div>
                                <p className="font-bold text-white group-hover:text-purple-300">Clerk</p>
                                <p className="text-xs text-slate-400">Manage Dispatch & Live Map</p>
                            </div>
                        </div>
                        <span className="text-purple-500">&rarr;</span>
                    </a>

                    <a href="/track/kiungani" target="_blank" className="flex items-center justify-between bg-slate-700 p-4 rounded-lg hover:bg-emerald-900 hover:border-emerald-500 border border-slate-600 transition-all group">
                        <div className="flex items-center gap-3">
                            <span className="text-2xl">🧍</span>
                            <div>
                                <p className="font-bold text-white group-hover:text-emerald-300">Passenger (Alice)</p>
                                <p className="text-xs text-slate-400">View Map & Subscriptions</p>
                            </div>
                        </div>
                        <span className="text-emerald-500">&rarr;</span>
                    </a>
                </div>

                {/* Telemetry Stream */}
                <div className="lg:col-span-2 bg-black rounded-xl p-6 border border-slate-700 flex flex-col shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-sky-500 to-amber-500 opacity-50"></div>
                    <div className="flex justify-between items-center border-b border-slate-800 pb-2 mb-4">
                        <h2 className="text-sm font-bold text-slate-400 tracking-widest uppercase">Live Ingestion Stream</h2>
                        <span className="flex items-center gap-2 text-xs text-emerald-500">
                            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                            CONNECTED
                        </span>
                    </div>
                    
                    <div className="flex-grow overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                        {logs.length === 0 ? (
                            <div className="h-full flex items-center justify-center text-slate-600 italic">
                                Waiting for telemetry data... Run simulation or use the apps.
                            </div>
                        ) : (
                            logs.map((log) => (
                                <div key={log.id} className="text-xs bg-slate-900/50 p-2 rounded border-l-2 border-slate-700 hover:border-slate-500 transition-colors flex gap-4">
                                    <span className="text-slate-500 shrink-0">{log.time}</span>
                                    <span className={`font-bold shrink-0 w-24 ${log.color}`}>
                                        [{log.type}]
                                    </span>
                                    <span className="text-slate-300 break-all">{log.message}</span>
                                </div>
                            ))
                        )}
                        <div ref={logsEndRef} />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Sandbox;
