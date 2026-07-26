import React from 'react';

function AdminDashboard() {
    return (
        <div className="min-h-screen bg-slate-100 p-8 font-sans">
            <div className="max-w-5xl mx-auto">
                <header className="mb-8 flex justify-between items-end">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-800">Sacco Operations</h1>
                        <p className="text-slate-500">Fleet & Timetable Management</p>
                    </div>
                    <button className="bg-sky-600 hover:bg-sky-700 text-white px-6 py-2 rounded-lg shadow-sm font-semibold transition-colors">
                        Save Changes
                    </button>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Fleet Roster Module */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                        <h2 className="text-xl font-bold text-slate-800 mb-4 border-b pb-2">Active Fleet Roster</h2>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center bg-slate-50 p-3 rounded-lg border border-slate-100">
                                <div>
                                    <p className="font-bold text-slate-700">KCD 123X</p>
                                    <p className="text-sm text-slate-500">Driver: John Doe</p>
                                </div>
                                <button className="text-red-500 hover:text-red-700 font-semibold text-sm">Remove</button>
                            </div>
                            <div className="flex justify-between items-center bg-slate-50 p-3 rounded-lg border border-slate-100">
                                <div>
                                    <p className="font-bold text-slate-700">KAB 456Y</p>
                                    <p className="text-sm text-slate-500">Driver: Peter Smith</p>
                                </div>
                                <button className="text-red-500 hover:text-red-700 font-semibold text-sm">Remove</button>
                            </div>
                            <button className="w-full mt-2 border-2 border-dashed border-sky-300 text-sky-600 font-bold py-2 rounded-lg hover:bg-sky-50 transition-colors">
                                + Add Vehicle
                            </button>
                        </div>
                    </div>

                    {/* Timetable Override Module */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                        <h2 className="text-xl font-bold text-slate-800 mb-4 border-b pb-2">Daily Timetable</h2>
                        <p className="text-sm text-slate-500 mb-4">
                            Trips are auto-generated daily at 3:00 AM by the backend CRON job. Use this to override.
                        </p>
                        
                        <div className="space-y-3">
                            <div className="flex justify-between items-center p-2">
                                <span className="font-bold text-slate-700">06:00 AM (Morning Rush)</span>
                                <select className="border border-slate-300 rounded p-1 text-sm text-slate-600">
                                    <option>Assigned: KCD 123X</option>
                                    <option>Reassign: KAB 456Y</option>
                                </select>
                            </div>
                            <div className="flex justify-between items-center p-2">
                                <span className="font-bold text-slate-700">06:30 AM</span>
                                <select className="border border-slate-300 rounded p-1 text-sm text-slate-600">
                                    <option>Assigned: KAB 456Y</option>
                                    <option>Reassign: KCD 123X</option>
                                </select>
                            </div>
                        </div>

                        <div className="mt-6 pt-4 border-t border-slate-100">
                            <button className="w-full bg-slate-800 text-white font-bold py-2 rounded-lg hover:bg-slate-700">
                                Generate Emergency Override Trip
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AdminDashboard;
