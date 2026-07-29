import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';

function DriverPortal() {
    const { user } = useAuth();
    const [trips, setTrips] = useState([]);
    const [activeTrip, setActiveTrip] = useState(null);
    const [status, setStatus] = useState('OFFLINE');
    const [loading, setLoading] = useState(true);
    
    const watchIdRef = useRef(null);
    const lastPingRef = useRef(0);

    useEffect(() => {
        // Fetch trips assigned to this specific driver (using their phone number or ID)
        // For MVP, we'll fetch trips where tenant_id='kiungani-01' and driver_phone is not null
        const fetchTrips = async () => {
            const { data, error } = await supabase
                .from('active_trips')
                .select('*')
                .eq('tenant_id', 'kiungani-01')
                .order('scheduled_departure', { ascending: true });
            
            if (data && data.length > 0) {
                setTrips(data);
                setActiveTrip(data[0]); // Default to first trip
                setStatus(data[0].status);
            }
            setLoading(false);
        };
        fetchTrips();
    }, []);

    const startGpsStreaming = (tripId) => {
        if (!navigator.geolocation) {
            alert("Geolocation is not supported by your browser");
            return;
        }

        // Throttle updates to once every 5 seconds to save database/battery
        const PING_INTERVAL_MS = 5000;

        watchIdRef.current = navigator.geolocation.watchPosition(
            async (position) => {
                const now = Date.now();
                if (now - lastPingRef.current < PING_INTERVAL_MS) return;
                lastPingRef.current = now;

                const { latitude, longitude } = position.coords;
                // Update PostGIS GEOMETRY column using WKT (Well-Known Text)
                await supabase
                    .from('active_trips')
                    .update({ 
                        current_location: `POINT(${longitude} ${latitude})`,
                        last_ping_at: new Date().toISOString()
                    })
                    .eq('id', tripId);
            },
            (error) => console.error("GPS Error:", error),
            { enableHighAccuracy: true, maximumAge: 0 }
        );
    };

    const stopGpsStreaming = () => {
        if (watchIdRef.current !== null) {
            navigator.geolocation.clearWatch(watchIdRef.current);
            watchIdRef.current = null;
        }
    };

    const updateStatus = async (newStatus) => {
        if (!activeTrip) return;
        setLoading(true);
        
        const { error } = await supabase
            .from('active_trips')
            .update({ status: newStatus })
            .eq('id', activeTrip.id);
            
        if (!error) {
            setStatus(newStatus);
            if (newStatus === 'IN_TRANSIT') {
                startGpsStreaming(activeTrip.id);
            } else if (newStatus === 'COMPLETED' || newStatus === 'OFFLINE') {
                stopGpsStreaming();
            }
        } else {
            alert("Network error. Could not reach dispatch server.");
        }
        setLoading(false);
    };

    if (loading && !activeTrip) return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">Loading Assignments...</div>;

    return (
        <div className="flex flex-col min-h-screen bg-slate-900 font-sans sm:items-center text-white">
            <div className="w-full sm:max-w-md flex flex-col min-h-screen relative shadow-2xl bg-slate-800">
                <header className="bg-slate-900 shadow-sm p-5 text-center border-b border-slate-700">
                    <h1 className="text-2xl font-bold text-amber-500">Driver Portal</h1>
                    <p className="text-sm text-slate-400">Vehicle: {activeTrip?.vehicle_registration || 'None Assigned'}</p>
                </header>

                <main className="flex-grow p-6 flex flex-col gap-6">
                    {activeTrip ? (
                        <>
                            <div className="bg-slate-700 rounded-xl p-5 text-center shadow-inner relative overflow-hidden">
                                {status === 'IN_TRANSIT' && (
                                    <div className="absolute top-2 right-2 flex items-center gap-1">
                                        <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                                        <span className="text-[10px] text-red-400 font-bold uppercase tracking-widest">LIVE GPS</span>
                                    </div>
                                )}
                                <p className="text-slate-300 text-sm font-semibold uppercase tracking-wider mb-2">Current Status</p>
                                <p className={`text-3xl font-black ${status === 'OFFLINE' ? 'text-slate-400' : 'text-emerald-400'}`}>
                                    {status}
                                </p>
                            </div>

                            <div className="grid grid-cols-1 gap-4 flex-grow content-center">
                                <button 
                                    disabled={loading || status === 'BOARDING'}
                                    onClick={() => updateStatus('BOARDING')}
                                    className="bg-sky-600 hover:bg-sky-500 disabled:opacity-50 active:scale-95 transition-all text-white font-bold py-6 rounded-2xl shadow-lg text-xl"
                                >
                                    🟩 BOARDING
                                </button>

                                <button 
                                    disabled={loading || status === 'IN_TRANSIT'}
                                    onClick={() => updateStatus('IN_TRANSIT')}
                                    className="bg-amber-600 hover:bg-amber-500 disabled:opacity-50 active:scale-95 transition-all text-white font-bold py-6 rounded-2xl shadow-lg text-xl"
                                >
                                    🚀 IN TRANSIT (Start GPS)
                                </button>

                                <button 
                                    disabled={loading || status === 'COMPLETED'}
                                    onClick={() => updateStatus('COMPLETED')}
                                    className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 active:scale-95 transition-all text-white font-bold py-6 rounded-2xl shadow-lg text-xl"
                                >
                                    🏁 COMPLETED TRIP
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="flex-grow flex items-center justify-center text-slate-500 font-bold">
                            No trips assigned for today.
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}

export default DriverPortal;
