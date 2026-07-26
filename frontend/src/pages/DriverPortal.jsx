import React, { useState } from 'react';
import PassengerFooter from '../components/Footer';

function DriverPortal() {
    const [status, setStatus] = useState('OFFLINE');
    const [loading, setLoading] = useState(false);
    const busPlate = "KCD 123X"; // Hardcoded for MVP

    const updateStatus = async (newStatus) => {
        setLoading(true);
        try {
            await fetch('http://127.0.0.1:8001/api/v1/driver/status', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    bus_plate: busPlate,
                    status: newStatus,
                    timestamp: new Date().toISOString()
                })
            });
            setStatus(newStatus);
        } catch (error) {
            console.error("Failed to update status:", error);
            alert("Network error. Could not reach dispatch server.");
        }
        setLoading(false);
    };

    return (
        <div className="flex flex-col min-h-screen bg-slate-900 font-sans sm:items-center text-white">
            <div className="w-full sm:max-w-md flex flex-col min-h-screen relative shadow-2xl bg-slate-800">
                <header className="bg-slate-900 shadow-sm p-5 text-center border-b border-slate-700">
                    <h1 className="text-2xl font-bold text-amber-500">Driver Portal</h1>
                    <p className="text-sm text-slate-400">Bus: {busPlate}</p>
                </header>

                <main className="flex-grow p-6 flex flex-col gap-6">
                    <div className="bg-slate-700 rounded-xl p-5 text-center shadow-inner">
                        <p className="text-slate-300 text-sm font-semibold uppercase tracking-wider mb-2">Current Status</p>
                        <p className={`text-3xl font-black ${status === 'OFFLINE' ? 'text-slate-400' : 'text-emerald-400'}`}>
                            {status}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-4 flex-grow content-center">
                        <button 
                            disabled={loading}
                            onClick={() => updateStatus('BOARDING')}
                            className="bg-sky-600 hover:bg-sky-500 active:scale-95 transition-all text-white font-bold py-6 rounded-2xl shadow-lg text-xl"
                        >
                            🟩 BOARDING (Green Tank)
                        </button>

                        <button 
                            disabled={loading}
                            onClick={() => updateStatus('DEPARTED')}
                            className="bg-amber-600 hover:bg-amber-500 active:scale-95 transition-all text-white font-bold py-6 rounded-2xl shadow-lg text-xl"
                        >
                            🚀 DEPARTED
                        </button>

                        <button 
                            disabled={loading}
                            onClick={() => updateStatus('ARRIVED CBD')}
                            className="bg-emerald-600 hover:bg-emerald-500 active:scale-95 transition-all text-white font-bold py-6 rounded-2xl shadow-lg text-xl"
                        >
                            🏁 ARRIVED (CBD)
                        </button>

                        <button 
                            disabled={loading}
                            onClick={() => updateStatus('OFFLINE')}
                            className="bg-slate-600 hover:bg-slate-500 active:scale-95 transition-all text-white font-bold py-6 rounded-2xl shadow-lg text-xl mt-4 border-2 border-slate-500"
                        >
                            🛑 END SHIFT
                        </button>
                    </div>
                </main>
            </div>
        </div>
    );
}

export default DriverPortal;
