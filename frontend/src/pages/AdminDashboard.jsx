import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

function AdminDashboard() {
    const [fleet, setFleet] = useState([]);
    const [loading, setLoading] = useState(true);
    const [trips, setTrips] = useState([]);
    const [activeTab, setActiveTab] = useState('FLEET');
    
    // Editor State
    const [editingVehicle, setEditingVehicle] = useState(null);
    const [newStatus, setNewStatus] = useState('');

    useEffect(() => {
        const fetchFleet = async () => {
            const { data, error } = await supabase.from('fleet').select('*').order('created_at', { ascending: false });
            if (data) setFleet(data);
            setLoading(false);
        };
        const fetchTrips = async () => {
            const { data, error } = await supabase.from('active_trips').select('*').order('scheduled_departure', { ascending: true });
            if (data) setTrips(data);
        };

        fetchFleet();
        fetchTrips();

        const fleetChannel = supabase.channel('public:fleet')
            .on('postgres', { event: '*', schema: 'public', table: 'fleet' }, () => fetchFleet())
            .subscribe();
            
        const tripsChannel = supabase.channel('public:active_trips')
            .on('postgres', { event: '*', schema: 'public', table: 'active_trips' }, () => fetchTrips())
            .subscribe();

        return () => {
            supabase.removeChannel(fleetChannel);
            supabase.removeChannel(tripsChannel);
        };
    }, []);

    const updateVehicleStatus = async () => {
        if (!editingVehicle) return;
        const { error } = await supabase.from('fleet').update({ status: newStatus }).eq('id', editingVehicle.id);
        if (!error) setEditingVehicle(null);
        else alert("Failed to update status.");
    };
    
    const generateEmergencyTrip = async () => {
        const { error } = await supabase.from('active_trips').insert([{
            tenant_id: 'kiungani-01',
            driver_phone: '0700000000',
            vehicle_registration: fleet.length > 0 ? fleet[0].registration_number : 'UNKNOWN',
            status: 'SCHEDULED',
            scheduled_departure: new Date().toISOString()
        }]);
        if (error) alert("Failed to generate trip: " + error.message);
    };

    return (
        <div className="min-h-screen bg-slate-50 p-8 font-sans">
            <div className="max-w-6xl mx-auto relative">
                <header className="mb-8 flex justify-between items-end border-b pb-6 border-slate-200">
                    <div>
                        <h1 className="text-4xl font-black text-slate-800 tracking-tight">Sacco Operations</h1>
                        <p className="text-slate-500 mt-1 font-medium">Control Center & Provisioning Engine</p>
                    </div>
                    <a href="/library/index.html" className="bg-white border border-slate-200 hover:border-sky-500 hover:text-sky-600 text-slate-600 px-4 py-2 rounded-lg font-bold shadow-sm transition-all flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                        Documentation Library
                    </a>
                </header>

                {/* Tabs Navigation */}
                <div className="flex flex-wrap gap-4 mb-8">
                    {['FLEET', 'PERSONNEL', 'ROUTES', 'LEGAL', 'ANALYTICS'].map(tab => (
                        <button 
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-6 py-3 font-bold rounded-xl transition-all shadow-sm ${activeTab === tab ? 'bg-sky-600 text-white shadow-sky-500/20' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'}`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {activeTab === 'FLEET' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* Fleet Roster Module */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                            <div className="flex justify-between items-center mb-6 border-b pb-4 border-slate-100">
                                <div>
                                    <h2 className="text-xl font-bold text-slate-800">Active Fleet</h2>
                                    <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider">Total Vehicles: {fleet.length}</p>
                                </div>
                                {loading && <span className="text-xs font-bold text-sky-500 animate-pulse">Syncing...</span>}
                            </div>
                            
                            <div className="space-y-4">
                                {fleet.length === 0 && !loading ? (
                                    <p className="text-sm text-slate-500 text-center py-4">No vehicles found in fleet.</p>
                                ) : (
                                    fleet.map((vehicle) => (
                                        <div key={vehicle.id} className="flex justify-between items-center bg-slate-50 p-4 rounded-xl border border-slate-100 transition-all hover:border-sky-200 hover:shadow-md group">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-white rounded-lg shadow-sm flex items-center justify-center text-xl border border-slate-200">
                                                    🚌
                                                </div>
                                                <div>
                                                    <p className="font-black text-slate-800">{vehicle.registration_number}</p>
                                                    <p className="text-xs font-bold mt-0.5 tracking-wider uppercase">
                                                        <span className={vehicle.status === 'ACTIVE' ? 'text-emerald-500' : 'text-amber-500'}>{vehicle.status}</span>
                                                    </p>
                                                </div>
                                            </div>
                                            <button 
                                                onClick={() => { setEditingVehicle(vehicle); setNewStatus(vehicle.status); }}
                                                className="text-sky-600 font-bold text-sm px-4 py-2 bg-sky-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-sky-100"
                                            >
                                                Edit
                                            </button>
                                        </div>
                                    ))
                                )}
                                
                                <button className="w-full mt-4 border-2 border-dashed border-slate-300 text-slate-500 font-bold py-3 rounded-xl hover:bg-slate-50 hover:border-sky-300 hover:text-sky-600 transition-colors">
                                    + Add New Vehicle
                                </button>
                            </div>
                        </div>

                        {/* Timetable Override Module */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                            <h2 className="text-xl font-bold text-slate-800 mb-2">Live Timetable Assignments</h2>
                            <p className="text-sm text-slate-500 mb-6 border-b pb-4 border-slate-100">
                                Auto-syncs with driver apps via Realtime.
                            </p>
                            
                            <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                                {trips.length === 0 ? (
                                    <p className="text-sm text-slate-400 text-center py-4">No active trips scheduled today.</p>
                                ) : (
                                    trips.map(trip => (
                                        <div key={trip.id} className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                            <div className="flex justify-between items-center mb-3 pb-2 border-b border-slate-200">
                                                <span className="font-black text-lg text-slate-800">
                                                    {new Date(trip.scheduled_departure).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                                <span className={`text-[10px] font-black px-2.5 py-1 rounded uppercase tracking-widest
                                                    ${trip.status === 'SCHEDULED' ? 'bg-sky-100 text-sky-700' : ''}
                                                    ${trip.status === 'BOARDING' ? 'bg-amber-100 text-amber-700 animate-pulse' : ''}
                                                    ${trip.status === 'IN_TRANSIT' ? 'bg-emerald-100 text-emerald-700' : ''}
                                                `}>
                                                    {trip.status}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                                                    Assigned Vehicle
                                                </span>
                                                <select 
                                                    value={trip.vehicle_registration} 
                                                    onChange={async (e) => {
                                                        await supabase.from('active_trips').update({ vehicle_registration: e.target.value }).eq('id', trip.id);
                                                    }}
                                                    className="border border-slate-200 rounded-lg p-1.5 text-xs font-bold text-slate-700 bg-white cursor-pointer shadow-sm focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                                                >
                                                    {fleet.map(v => <option key={v.id} value={v.registration_number}>{v.registration_number}</option>)}
                                                </select>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            <button onClick={generateEmergencyTrip} className="w-full mt-6 bg-slate-900 text-white font-bold py-3 rounded-xl hover:bg-slate-800 transition-colors shadow-sm">
                                + Schedule Ad-Hoc Trip
                            </button>
                        </div>
                    </div>
                )}

                {activeTab === 'PERSONNEL' && (
                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-3xl mx-auto">
                        <div className="mb-8">
                            <h2 className="text-2xl font-black text-slate-800">Provision Personnel</h2>
                            <p className="text-slate-500 mt-2">
                                This form executes a privileged call to the backend provisioning engine, validating your Admin token before creating new credentials in the Supabase Auth database.
                            </p>
                        </div>
                        
                        <form 
                            onSubmit={async (e) => {
                                e.preventDefault();
                                const email = e.target.email.value;
                                const role = e.target.role.value;
                                alert(`Provisioning request sent for ${email} as ${role}. Awaiting telemetry validation...`);
                                
                                try {
                                    const response = await fetch('http://127.0.0.1:8001/api/v1/admin/provision', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ email, role, tenant_id: 'kiungani-01' })
                                    });
                                    const result = await response.json();
                                    alert(result.message);
                                    e.target.reset();
                                } catch (err) {
                                    alert("Failed to connect to provisioning server.");
                                }
                            }}
                            className="space-y-6 bg-slate-50 p-6 rounded-xl border border-slate-100"
                        >
                            <div>
                                <label className="block text-xs font-black text-slate-600 uppercase tracking-widest mb-2">Email Address</label>
                                <input name="email" type="email" required className="w-full border-slate-300 rounded-xl p-4 bg-white border shadow-sm focus:border-sky-500 focus:ring-2 focus:ring-sky-200 transition-all font-medium" placeholder="driver.name@sacco.com" />
                            </div>
                            
                            <div>
                                <label className="block text-xs font-black text-slate-600 uppercase tracking-widest mb-2">System Role</label>
                                <div className="grid grid-cols-2 gap-4">
                                    <label className="cursor-pointer">
                                        <input type="radio" name="role" value="DRIVER" className="peer sr-only" defaultChecked />
                                        <div className="p-4 rounded-xl border-2 border-slate-200 bg-white hover:bg-slate-50 peer-checked:border-sky-500 peer-checked:bg-sky-50 transition-all">
                                            <p className="font-black text-slate-800 text-lg">Driver</p>
                                            <p className="text-xs text-slate-500 font-medium mt-1">Can access Driver Portal and stream GPS data.</p>
                                        </div>
                                    </label>
                                    <label className="cursor-pointer">
                                        <input type="radio" name="role" value="ADMIN" className="peer sr-only" />
                                        <div className="p-4 rounded-xl border-2 border-slate-200 bg-white hover:bg-slate-50 peer-checked:border-sky-500 peer-checked:bg-sky-50 transition-all">
                                            <p className="font-black text-slate-800 text-lg">Administrator</p>
                                            <p className="text-xs text-slate-500 font-medium mt-1">Full access to Operations and Provisioning.</p>
                                        </div>
                                    </label>
                                </div>
                            </div>

                            <button type="submit" className="w-full bg-emerald-600 text-white font-black text-lg py-4 rounded-xl hover:bg-emerald-500 shadow-lg shadow-emerald-500/20 transition-all">
                                Create Identity Credentials
                            </button>
                        </form>
                    </div>
                )}

                {activeTab === 'ROUTES' && (
                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex justify-between items-center mb-8 border-b pb-6 border-slate-100">
                            <div>
                                <h2 className="text-2xl font-black text-slate-800">Route Provisioning</h2>
                                <p className="text-slate-500 mt-1">Configure paths and publish them to passenger maps.</p>
                            </div>
                            <button className="bg-slate-900 text-white font-bold py-2 px-4 rounded-lg hover:bg-slate-800 shadow-sm transition-all flex items-center gap-2">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                                Draw New Route
                            </button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Existing Route */}
                            <div className="bg-slate-50 border border-slate-200 p-6 rounded-xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[10px] font-black px-3 py-1 uppercase tracking-widest rounded-bl-lg">LIVE</div>
                                <h3 className="font-black text-xl text-slate-800 mb-1">Kiungani Express</h3>
                                <p className="text-sm text-slate-500 mb-4 font-medium">Connects Kiungani Estate to Nairobi CBD via Highway.</p>
                                <div className="flex gap-4">
                                    <div className="flex-1 bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Stops</p>
                                        <p className="font-bold text-slate-700">12 Waypoints</p>
                                    </div>
                                    <div className="flex-1 bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</p>
                                        <p className="font-bold text-emerald-600">Published</p>
                                    </div>
                                </div>
                                <div className="mt-6 flex gap-3">
                                    <button className="flex-1 bg-white border-2 border-slate-200 text-slate-600 font-bold py-2 rounded-lg hover:border-slate-300 transition-colors">Edit Path</button>
                                    <button className="flex-1 bg-amber-100 text-amber-700 font-bold py-2 rounded-lg hover:bg-amber-200 transition-colors">Unpublish</button>
                                </div>
                            </div>

                            {/* Draft Route */}
                            <div className="bg-slate-50 border border-dashed border-slate-300 p-6 rounded-xl opacity-80">
                                <h3 className="font-black text-xl text-slate-800 mb-1">Kiserian Transit</h3>
                                <p className="text-sm text-slate-500 mb-4 font-medium">Pending coordinate mapping and stop designation.</p>
                                <div className="flex gap-4">
                                    <div className="flex-1 bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Stops</p>
                                        <p className="font-bold text-slate-400">0 Waypoints</p>
                                    </div>
                                    <div className="flex-1 bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</p>
                                        <p className="font-bold text-slate-500">Draft</p>
                                    </div>
                                </div>
                                <div className="mt-6">
                                    <button className="w-full bg-sky-600 text-white font-bold py-3 rounded-lg hover:bg-sky-500 shadow-sm transition-colors flex items-center justify-center gap-2">
                                        <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                                        Make Route Live
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'LEGAL' && (
                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="mb-8 border-b pb-6 border-slate-100">
                            <h2 className="text-2xl font-black text-slate-800">Legal & Contracts</h2>
                            <p className="text-slate-500 mt-1">Manage Terms of Service, SLAs, and Employment Contracts.</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-slate-50 border border-slate-200 p-6 rounded-xl hover:shadow-md transition-shadow cursor-pointer">
                                <h3 className="font-bold text-slate-800 mb-2">Driver Agreements</h3>
                                <p className="text-sm text-slate-500 mb-4">Standard contract for new crew onboarding.</p>
                                <span className="text-sky-600 font-bold text-sm">Review Document &rarr;</span>
                            </div>
                            <div className="bg-slate-50 border border-slate-200 p-6 rounded-xl hover:shadow-md transition-shadow cursor-pointer">
                                <h3 className="font-bold text-slate-800 mb-2">Terms of Service</h3>
                                <p className="text-sm text-slate-500 mb-4">Passenger liability and data privacy policy.</p>
                                <span className="text-sky-600 font-bold text-sm">Review Document &rarr;</span>
                            </div>
                            <div className="bg-slate-50 border border-slate-200 p-6 rounded-xl hover:shadow-md transition-shadow cursor-pointer">
                                <h3 className="font-bold text-slate-800 mb-2">Fleet SLAs</h3>
                                <p className="text-sm text-slate-500 mb-4">Maintenance and uptime agreements.</p>
                                <span className="text-sky-600 font-bold text-sm">Review Document &rarr;</span>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'ANALYTICS' && (
                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="mb-8 border-b pb-6 border-slate-100">
                            <h2 className="text-2xl font-black text-slate-800">System Analytics</h2>
                            <p className="text-slate-500 mt-1">High-level visualization of operations and platform health.</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                            <div className="bg-emerald-50 border border-emerald-200 p-6 rounded-xl">
                                <p className="text-xs font-black text-emerald-600 uppercase tracking-widest mb-1">Active Trips Today</p>
                                <p className="text-4xl font-black text-emerald-900">142</p>
                                <p className="text-sm text-emerald-700 mt-2 font-medium">+12% from yesterday</p>
                            </div>
                            <div className="bg-sky-50 border border-sky-200 p-6 rounded-xl">
                                <p className="text-xs font-black text-sky-600 uppercase tracking-widest mb-1">Passenger Volume</p>
                                <p className="text-4xl font-black text-sky-900">4,591</p>
                                <p className="text-sm text-sky-700 mt-2 font-medium">Tracking via web app</p>
                            </div>
                            <div className="bg-amber-50 border border-amber-200 p-6 rounded-xl">
                                <p className="text-xs font-black text-amber-600 uppercase tracking-widest mb-1">Ad Impressions</p>
                                <p className="text-4xl font-black text-amber-900">12.4k</p>
                                <p className="text-sm text-amber-700 mt-2 font-medium">Generating local revenue</p>
                            </div>
                        </div>
                        <div className="bg-slate-50 rounded-xl border border-slate-200 p-6 h-64 flex flex-col items-center justify-center relative overflow-hidden">
                            <p className="font-bold text-slate-500 mb-4 relative z-10">Peak Hours Visualization (Mock)</p>
                            <div className="absolute bottom-0 left-0 w-full flex items-end justify-around px-8 gap-2 h-32 opacity-50">
                                <div className="w-full bg-sky-200 rounded-t-sm h-12"></div>
                                <div className="w-full bg-sky-300 rounded-t-sm h-24"></div>
                                <div className="w-full bg-sky-400 rounded-t-sm h-full"></div>
                                <div className="w-full bg-sky-300 rounded-t-sm h-16"></div>
                                <div className="w-full bg-sky-500 rounded-t-sm h-20"></div>
                                <div className="w-full bg-sky-600 rounded-t-sm h-full"></div>
                                <div className="w-full bg-sky-200 rounded-t-sm h-8"></div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Status Update Modal */}
                {editingVehicle && (
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[100] animate-in fade-in duration-200">
                        <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-md scale-in-95 duration-200">
                            <h3 className="text-2xl font-black text-slate-800 mb-2">Update Status</h3>
                            <p className="text-slate-500 font-medium mb-8">Select current status for <strong className="text-slate-700 bg-slate-100 px-2 py-1 rounded">{editingVehicle.registration_number}</strong></p>
                            
                            <div className="space-y-4 mb-8">
                                <label className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${newStatus === 'ACTIVE' ? 'border-emerald-500 bg-emerald-50 shadow-sm' : 'border-slate-100 hover:bg-slate-50'}`}>
                                    <input type="radio" name="status" value="ACTIVE" checked={newStatus === 'ACTIVE'} onChange={(e) => setNewStatus(e.target.value)} className="w-5 h-5 text-emerald-600 focus:ring-emerald-500" />
                                    <span className="font-black text-slate-700 text-lg">ACTIVE</span>
                                </label>
                                <label className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${newStatus === 'MAINTENANCE' ? 'border-amber-500 bg-amber-50 shadow-sm' : 'border-slate-100 hover:bg-slate-50'}`}>
                                    <input type="radio" name="status" value="MAINTENANCE" checked={newStatus === 'MAINTENANCE'} onChange={(e) => setNewStatus(e.target.value)} className="w-5 h-5 text-amber-600 focus:ring-amber-500" />
                                    <span className="font-black text-slate-700 text-lg">MAINTENANCE</span>
                                </label>
                                <label className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${newStatus === 'RETIRED' ? 'border-red-500 bg-red-50 shadow-sm' : 'border-slate-100 hover:bg-slate-50'}`}>
                                    <input type="radio" name="status" value="RETIRED" checked={newStatus === 'RETIRED'} onChange={(e) => setNewStatus(e.target.value)} className="w-5 h-5 text-red-600 focus:ring-red-500" />
                                    <span className="font-black text-slate-700 text-lg">RETIRED</span>
                                </label>
                            </div>

                            <div className="flex gap-4">
                                <button onClick={() => setEditingVehicle(null)} className="flex-1 py-4 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors">Cancel</button>
                                <button onClick={updateVehicleStatus} className="flex-1 py-4 bg-sky-600 text-white font-bold rounded-xl hover:bg-sky-500 transition-colors shadow-lg shadow-sky-500/20">Save Changes</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default AdminDashboard;
