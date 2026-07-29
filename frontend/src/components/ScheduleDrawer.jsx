import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

// Format "06:15:00" → "6:15 AM"
function fmtTime(timeStr) {
    if (!timeStr) return '';
    const [h, m] = timeStr.split(':').map(Number);
    const period = h >= 12 ? 'PM' : 'AM';
    const hour = h % 12 || 12;
    return `${hour}:${String(m).padStart(2, '0')} ${period}`;
}

// Format phone for display: "0727699222" → "0727 699 222"
function fmtPhone(phone) {
    if (!phone) return '';
    const p = phone.replace(/\s+/g, '');
    if (p.length === 10) return `${p.slice(0,4)} ${p.slice(4,7)} ${p.slice(7)}`;
    return phone;
}

const DAY_ORDER = ['WEEKDAY', 'SATURDAY', 'SUNDAY'];
const DAY_LABEL = { WEEKDAY: 'Weekdays', SATURDAY: 'Saturday', SUNDAY: 'Sunday' };

export default function ScheduleDrawer({ tenantId, routeName, onClose }) {
    const [sacco, setSacco] = useState(null);
    const [slots, setSlots] = useState({});
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!tenantId) return;

        const fetchSchedule = async () => {
            setLoading(true);
            setError(null);

            // Fetch sacco + slots in one go using Supabase nested select
            const { data, error: err } = await supabase
                .from('saccos')
                .select('*, schedule_slots(*)')
                .eq('tenant_id', tenantId)
                .single();

            if (err || !data) {
                setError('Could not load schedule. Please try again.');
                setLoading(false);
                return;
            }

            setSacco(data);

            // Group slots by day_type, sorted by sort_order
            const grouped = {};
            (data.schedule_slots || [])
                .sort((a, b) => a.sort_order - b.sort_order || a.departure_time.localeCompare(b.departure_time))
                .forEach(slot => {
                    if (!grouped[slot.day_type]) grouped[slot.day_type] = [];
                    grouped[slot.day_type].push(slot);
                });
            setSlots(grouped);
            setLoading(false);
        };

        fetchSchedule();
    }, [tenantId]);

    const availableDays = DAY_ORDER.filter(d => slots[d]?.length > 0);

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
                onClick={onClose}
            />

            {/* Drawer */}
            <div className="fixed bottom-0 left-0 right-0 z-50 max-h-[90vh] flex flex-col bg-white rounded-t-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-300">
                {/* Handle */}
                <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
                    <div className="w-10 h-1 bg-slate-200 rounded-full" />
                </div>

                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-start flex-shrink-0">
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Crew Contacts</p>
                        <h2 className="text-xl font-black text-slate-800">{routeName}</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-700 text-2xl leading-none mt-1"
                    >✕</button>
                </div>

                {/* Content */}
                <div className="overflow-y-auto flex-1 px-6 pb-8">
                    {loading && (
                        <div className="py-12 text-center">
                            <div className="w-6 h-6 border-2 border-slate-200 border-t-sky-500 rounded-full animate-spin mx-auto mb-3" />
                            <p className="text-slate-400 text-sm font-medium">Loading schedule…</p>
                        </div>
                    )}

                    {error && (
                        <div className="py-12 text-center text-red-500 font-semibold">{error}</div>
                    )}

                    {!loading && !error && (
                        <>
                            {/* Schedule by day */}
                            {availableDays.length === 0 ? (
                                <p className="text-center text-slate-400 py-10 font-medium">No schedule published yet.</p>
                            ) : (
                                <div className="mt-4 space-y-6">
                                    {!selectedSlot ? (
                                        availableDays.map(day => (
                                            <section key={day} className="mb-6">
                                                <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3 pb-2 border-b border-slate-100">
                                                    {DAY_LABEL[day]}
                                                </h3>
                                                <div className="space-y-3">
                                                    {slots[day].map(slot => (
                                                        <div 
                                                            key={slot.id} 
                                                            onClick={() => setSelectedSlot(slot)}
                                                            className="border border-slate-200 rounded-xl p-4 cursor-pointer hover:border-sky-300 hover:shadow-md transition-all group bg-white"
                                                        >
                                                            <div className="flex justify-between items-center mb-1">
                                                                <span className="font-black text-xl text-slate-800">
                                                                    {fmtTime(slot.departure_time)}
                                                                </span>
                                                                <span className="text-xs bg-sky-50 text-sky-600 px-2 py-1 rounded-md font-bold uppercase tracking-wide">
                                                                    SCHEDULED
                                                                </span>
                                                            </div>
                                                            <div className="flex justify-between text-sm items-center mt-2">
                                                                <span className="text-slate-500 font-medium text-xs">
                                                                    Route: {routeName}
                                                                </span>
                                                                <span className="text-sky-600 font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                                                                    View Details &rarr;
                                                                </span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </section>
                                        ))
                                    ) : (
                                        <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                                            <button 
                                                onClick={() => setSelectedSlot(null)}
                                                className="text-sm text-sky-600 font-bold mb-4 flex items-center gap-1"
                                            >
                                                &larr; Back to Schedule
                                            </button>
                                            <div className="bg-slate-50 rounded-xl p-6 border border-slate-200 shadow-sm">
                                                <h4 className="text-3xl font-black text-slate-800 mb-1">
                                                    {fmtTime(selectedSlot.departure_time)}
                                                </h4>
                                                <p className="text-slate-500 font-medium mb-6 pb-4 border-b border-slate-200">
                                                    {DAY_LABEL[selectedSlot.day_type]} Schedule
                                                </p>
                                                
                                                <div className="space-y-5">
                                                    <div>
                                                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Status</p>
                                                        <p className="font-semibold text-slate-800">Scheduled Departure</p>
                                                    </div>
                                                    
                                                    <div>
                                                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Route</p>
                                                        <p className="font-semibold text-slate-800">{routeName}</p>
                                                    </div>

                                                    <div>
                                                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-2">Crew Contacts</p>
                                                        <div className="flex flex-col gap-3">
                                                            {selectedSlot.driver_phones.map((phone, i) => (
                                                                <div key={i} className="flex justify-between items-center bg-white border border-slate-200 p-3 rounded-lg">
                                                                    <span className="font-bold text-slate-700 text-lg">{fmtPhone(phone)}</span>
                                                                    <a 
                                                                        href={`tel:${phone}`} 
                                                                        className="bg-emerald-500 text-white text-xs px-4 py-2 rounded-lg font-bold shadow-sm hover:bg-emerald-400 active:scale-95 transition-all flex items-center gap-2"
                                                                    >
                                                                        <span>📞</span> Call
                                                                    </a>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Contacts section */}
                            {sacco && (
                                <div className="mt-8 pt-6 border-t border-dashed border-slate-200 space-y-5">
                                    {(sacco.parcels_cbd_phone || sacco.parcels_cbd_contact) && (
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                                                Parcels Dispatch from CBD
                                            </p>
                                            {sacco.parcels_cbd_phone && (
                                                <a href={`tel:${sacco.parcels_cbd_phone}`} className="text-sky-600 font-bold block">
                                                    Tel. {fmtPhone(sacco.parcels_cbd_phone)}
                                                </a>
                                            )}
                                            {sacco.parcels_cbd_contact && (
                                                <p className="text-slate-600 font-medium text-sm">{sacco.parcels_cbd_contact}</p>
                                            )}
                                        </div>
                                    )}

                                    {(sacco.parcels_office_phone || sacco.parcels_office_address) && (
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                                                Parcels Office
                                            </p>
                                            {sacco.parcels_office_address && (
                                                <p className="text-slate-600 font-medium text-sm">{sacco.parcels_office_address}</p>
                                            )}
                                            {sacco.parcels_office_phone && (
                                                <a href={`tel:${sacco.parcels_office_phone}`} className="text-sky-600 font-bold block">
                                                    Tel. {fmtPhone(sacco.parcels_office_phone)}
                                                </a>
                                            )}
                                        </div>
                                    )}

                                    {sacco.manager_phone && (
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                                                Complaints or Compliments
                                            </p>
                                            <p className="text-slate-500 text-xs font-medium mb-0.5">Manager contact</p>
                                            <a href={`tel:${sacco.manager_phone}`} className="text-sky-600 font-bold">
                                                {fmtPhone(sacco.manager_phone)}
                                            </a>
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </>
    );
}
