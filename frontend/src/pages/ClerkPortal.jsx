import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';

const STATUS_COLORS = {
    SCHEDULED: 'bg-slate-100 text-slate-700',
    BOARDING: 'bg-emerald-100 text-emerald-700',
    IN_TRANSIT: 'bg-sky-100 text-sky-700',
    DELAYED: 'bg-amber-100 text-amber-700',
    CANCELLED: 'bg-red-100 text-red-700',
    COMPLETED: 'bg-purple-100 text-purple-700',
};

function ClerkPortal() {
    const { user } = useAuth();
    const [schedules, setSchedules] = useState([]);
    const [fleet, setFleet] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedTrip, setSelectedTrip] = useState(null);
    const [swapModal, setSwapModal] = useState(null); // { tripId, field: 'bus_id'|'driver_phone' }
    const [swapValue, setSwapValue] = useState('');
    const [notifyStatus, setNotifyStatus] = useState({}); // tripId -> 'sending'|'done'|'error'
    const [actionFeedback, setActionFeedback] = useState(null);

    const today = new Date().toLocaleDateString('en-KE', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' });
    const tenantId = 'kiungani-01';

    const showFeedback = (msg, type = 'success') => {
        setActionFeedback({ msg, type });
        setTimeout(() => setActionFeedback(null), 4000);
    };

    const logAction = async (actionType, tripId, details) => {
        await supabase.from('clerk_actions_log').insert([{
            tenant_id: tenantId,
            clerk_user_id: user.id,
            action_type: actionType,
            trip_id: tripId || null,
            details
        }]);
    };

    useEffect(() => {
        const fetchData = async () => {
            const [tripsRes, fleetRes] = await Promise.all([
                supabase.from('active_trips').select('*').eq('tenant_id', tenantId).order('scheduled_departure', { ascending: true }),
                supabase.from('fleet').select('*').eq('tenant_id', tenantId).eq('status', 'ACTIVE')
            ]);
            if (tripsRes.data) setSchedules(tripsRes.data);
            if (fleetRes.data) setFleet(fleetRes.data);
            setLoading(false);
        };
        fetchData();

        const channel = supabase.channel('clerk:active_trips')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'active_trips' }, fetchData)
            .subscribe();

        return () => supabase.removeChannel(channel);
    }, []);

    const updateTripStatus = async (trip, newStatus) => {
        const { error } = await supabase
            .from('active_trips')
            .update({ status: newStatus })
            .eq('id', trip.id);

        if (!error) {
            setSchedules(prev => prev.map(t => t.id === trip.id ? { ...t, status: newStatus } : t));
            await logAction('STATUS_CHANGE', trip.id, { old_status: trip.status, new_status: newStatus });
            showFeedback(`Trip ${trip.vehicle_registration || trip.bus_id} → ${newStatus}`);
        } else {
            showFeedback('Failed to update status: ' + error.message, 'error');
        }
    };

    const handleSwap = async () => {
        if (!swapModal || !swapValue) return;
        const { tripId, field } = swapModal;
        const trip = schedules.find(t => t.id === tripId);
        const { error } = await supabase
            .from('active_trips')
            .update({ [field]: swapValue })
            .eq('id', tripId);

        if (!error) {
            setSchedules(prev => prev.map(t => t.id === tripId ? { ...t, [field]: swapValue } : t));
            await logAction(field === 'vehicle_registration' ? 'VEHICLE_SWAP' : 'DRIVER_SWAP', tripId, {
                field,
                old_value: trip?.[field],
                new_value: swapValue
            });
            showFeedback(`Swapped ${field === 'vehicle_registration' ? 'vehicle' : 'driver'} successfully.`);
            setSwapModal(null);
            setSwapValue('');
        } else {
            showFeedback('Swap failed: ' + error.message, 'error');
        }
    };

    const pullTrip = async (trip) => {
        if (!window.confirm(`Pull / cancel trip for ${trip.vehicle_registration || 'this bus'}? Passengers will see it as cancelled.`)) return;
        const { error } = await supabase
            .from('active_trips')
            .update({ status: 'CANCELLED' })
            .eq('id', trip.id);

        if (!error) {
            setSchedules(prev => prev.map(t => t.id === trip.id ? { ...t, status: 'CANCELLED' } : t));
            await logAction('TRIP_PULLED', trip.id, { reason: 'Clerk cancelled from dispatch board' });
            showFeedback('Trip pulled. Passengers see: CANCELLED.');
        } else {
            showFeedback('Failed to pull trip: ' + error.message, 'error');
        }
    };

    const pushTrip = async (trip) => {
        const { error } = await supabase
            .from('active_trips')
            .update({ status: 'SCHEDULED' })
            .eq('id', trip.id);

        if (!error) {
            setSchedules(prev => prev.map(t => t.id === trip.id ? { ...t, status: 'SCHEDULED' } : t));
            await logAction('TRIP_PUSHED', trip.id, { reinstated: true });
            showFeedback('Trip reinstated as SCHEDULED.');
        } else {
            showFeedback('Failed to reinstate trip: ' + error.message, 'error');
        }
    };

    const notifyPassengers = async (trip) => {
        setNotifyStatus(prev => ({ ...prev, [trip.id]: 'sending' }));
        try {
            const apiUrl = import.meta.env.DEV ? 'http://127.0.0.1:8001' : '';
            const res = await fetch(`${apiUrl}/api/v1/notify/broadcast`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tenant_id: tenantId,
                    trip_id: trip.id,
                    bus_id: trip.vehicle_registration || trip.bus_id,
                    status: trip.status,
                    message: `🚌 Bus ${trip.vehicle_registration || trip.bus_id} is now ${trip.status.replace('_', ' ')}. Get ready!`
                })
            });
            if (res.ok) {
                setNotifyStatus(prev => ({ ...prev, [trip.id]: 'done' }));
                await logAction('NOTIFICATION_SENT', trip.id, { status: trip.status });
                showFeedback('WhatsApp notification sent to all subscribers.');
            } else {
                setNotifyStatus(prev => ({ ...prev, [trip.id]: 'error' }));
                showFeedback('Notification failed. Check API.', 'error');
            }
        } catch {
            setNotifyStatus(prev => ({ ...prev, [trip.id]: 'error' }));
            showFeedback('Network error sending notification.', 'error');
        }
        setTimeout(() => setNotifyStatus(prev => ({ ...prev, [trip.id]: null })), 5000);
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans">
            {/* Feedback Toast */}
            {actionFeedback && (
                <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-full shadow-lg font-bold text-sm animate-in fade-in slide-in-from-top-4 ${
                    actionFeedback.type === 'error' ? 'bg-red-600 text-white' : 'bg-emerald-600 text-white'
                }`}>
                    {actionFeedback.msg}
                </div>
            )}

            <header className="bg-slate-900 border-b-4 border-amber-500 px-6 py-4">
                <div className="max-w-4xl mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <img src="/transy_logo.jpg" alt="Transy" className="w-10 h-10 rounded-full border-2 border-amber-500" />
                        <div>
                            <h1 className="text-white font-black text-lg tracking-tight">Dispatch Board</h1>
                            <p className="text-amber-500 text-xs font-bold tracking-widest uppercase">{today}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                        <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Live</span>
                    </div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-4 py-8">
                {loading ? (
                    <div className="flex items-center justify-center py-16 text-slate-500 font-semibold">Loading dispatch data...</div>
                ) : schedules.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
                        <p className="text-2xl mb-2">📅</p>
                        <p className="font-bold text-slate-700">No trips scheduled for today.</p>
                        <p className="text-slate-500 text-sm mt-1">Check back later or contact the Sacco Manager.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {schedules.map(trip => (
                            <div key={trip.id} className={`bg-white rounded-2xl border-2 shadow-sm transition-all ${
                                trip.status === 'BOARDING' ? 'border-emerald-300' :
                                trip.status === 'CANCELLED' ? 'border-red-200 opacity-60' :
                                trip.status === 'DELAYED' ? 'border-amber-300' :
                                'border-slate-200'
                            }`}>
                                {/* Trip Header */}
                                <div className="flex items-center justify-between p-4 border-b border-slate-100">
                                    <div className="flex items-center gap-3">
                                        <span className="text-2xl">🚌</span>
                                        <div>
                                            <p className="font-black text-slate-800">{trip.vehicle_registration || trip.bus_id || 'Unassigned Bus'}</p>
                                            <p className="text-xs text-slate-500 font-medium">
                                                Driver: {trip.driver_phone || 'Unassigned'} · 
                                                Dep: {trip.scheduled_departure ? new Date(trip.scheduled_departure).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' }) : '—'}
                                            </p>
                                        </div>
                                    </div>
                                    <span className={`text-xs font-black px-3 py-1.5 rounded-full uppercase tracking-wider ${STATUS_COLORS[trip.status] || 'bg-slate-100 text-slate-600'}`}>
                                        {trip.status?.replace('_', ' ')}
                                    </span>
                                </div>

                                {/* Actions */}
                                {trip.status !== 'COMPLETED' && (
                                    <div className="p-4 space-y-3">
                                        {/* Status change buttons */}
                                        {trip.status !== 'CANCELLED' && (
                                            <div className="flex flex-wrap gap-2">
                                                {['SCHEDULED', 'BOARDING', 'IN_TRANSIT', 'DELAYED'].filter(s => s !== trip.status).map(s => (
                                                    <button
                                                        key={s}
                                                        onClick={() => updateTripStatus(trip, s)}
                                                        className={`px-4 py-2 rounded-xl font-bold text-sm transition-all border ${
                                                            s === 'BOARDING' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' :
                                                            s === 'IN_TRANSIT' ? 'bg-sky-50 text-sky-700 border-sky-200 hover:bg-sky-100' :
                                                            s === 'DELAYED' ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100' :
                                                            'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                                                        }`}
                                                    >
                                                        → {s.replace('_', ' ')}
                                                    </button>
                                                ))}
                                            </div>
                                        )}

                                        {/* Swap + Pull/Push + Notify row */}
                                        <div className="flex flex-wrap gap-2 pt-1 border-t border-slate-100">
                                            <button
                                                onClick={() => { setSwapModal({ tripId: trip.id, field: 'vehicle_registration' }); setSwapValue(trip.vehicle_registration || ''); }}
                                                className="px-3 py-2 text-xs font-bold bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
                                            >
                                                🔄 Swap Bus
                                            </button>
                                            <button
                                                onClick={() => { setSwapModal({ tripId: trip.id, field: 'driver_phone' }); setSwapValue(trip.driver_phone || ''); }}
                                                className="px-3 py-2 text-xs font-bold bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
                                            >
                                                🔄 Swap Driver
                                            </button>
                                            {trip.status === 'CANCELLED' ? (
                                                <button
                                                    onClick={() => pushTrip(trip)}
                                                    className="px-3 py-2 text-xs font-bold bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 transition-colors"
                                                >
                                                    ↩ Reinstate Trip
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => pullTrip(trip)}
                                                    className="px-3 py-2 text-xs font-bold bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                                                >
                                                    ✕ Pull Trip
                                                </button>
                                            )}
                                            <button
                                                onClick={() => notifyPassengers(trip)}
                                                disabled={notifyStatus[trip.id] === 'sending'}
                                                className="px-3 py-2 text-xs font-bold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center gap-1.5"
                                            >
                                                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                                                {notifyStatus[trip.id] === 'sending' ? 'Sending...' : notifyStatus[trip.id] === 'done' ? '✓ Sent!' : 'Notify Passengers'}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {/* Swap Modal */}
            {swapModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6">
                        <h3 className="text-xl font-black text-slate-800 mb-1">
                            {swapModal.field === 'vehicle_registration' ? 'Swap Vehicle' : 'Swap Driver'}
                        </h3>
                        <p className="text-slate-500 text-sm mb-4">Enter the new {swapModal.field === 'vehicle_registration' ? 'registration number' : 'driver phone number'}.</p>
                        
                        {swapModal.field === 'vehicle_registration' && fleet.length > 0 && (
                            <div className="mb-4 space-y-2">
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Fleet</p>
                                {fleet.map(v => (
                                    <button
                                        key={v.id}
                                        onClick={() => setSwapValue(v.registration_number)}
                                        className={`w-full text-left px-4 py-2.5 rounded-xl border-2 font-bold text-sm transition-all ${
                                            swapValue === v.registration_number ? 'border-sky-500 bg-sky-50 text-sky-700' : 'border-slate-200 hover:border-slate-300'
                                        }`}
                                    >
                                        🚌 {v.registration_number}
                                    </button>
                                ))}
                            </div>
                        )}

                        <input
                            value={swapValue}
                            onChange={e => setSwapValue(e.target.value)}
                            placeholder={swapModal.field === 'vehicle_registration' ? 'KDC 123X' : '0700000000'}
                            className="w-full border border-slate-300 rounded-xl px-4 py-3 font-bold focus:outline-none focus:border-sky-500 mb-4"
                        />
                        <div className="flex gap-3">
                            <button onClick={() => { setSwapModal(null); setSwapValue(''); }} className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors">
                                Cancel
                            </button>
                            <button onClick={handleSwap} className="flex-1 py-3 bg-sky-600 text-white font-bold rounded-xl hover:bg-sky-500 transition-colors">
                                Confirm Swap
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ClerkPortal;
