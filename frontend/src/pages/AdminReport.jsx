import React, { useState, useEffect } from 'react';

export function AdminReport() {
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fetch report from FastAPI backend
        const fetchReport = async () => {
            try {
                const response = await fetch('http://127.0.0.1:8001/api/v1/analytics/report?tenant_id=kiungani-01');
                const data = await response.json();
                setReportData(data);
                setLoading(false);
            } catch (error) {
                console.error("Failed to fetch report:", error);
                setLoading(false);
            }
        };

        fetchReport();
    }, []);

    if (loading) return <div className="p-8 text-center text-slate-500">Loading Analytics...</div>;
    if (!reportData) return <div className="p-8 text-center text-red-500">Failed to load analytics.</div>;

    return (
        <div className="min-h-screen bg-slate-50 p-6 font-sans print:bg-white print:p-0">
            <header className="mb-8 flex justify-between items-start print:mb-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800">TM Savannah</h1>
                    <h2 className="text-xl text-slate-600">Route Analytics & Monetization Report</h2>
                    <p className="text-sm text-slate-400 mt-1">Tenant: {reportData.tenant_id} | Date: {new Date().toLocaleDateString()}</p>
                </div>
                <button 
                    onClick={() => window.print()}
                    className="bg-indigo-600 text-white font-bold px-4 py-2 rounded-lg shadow hover:bg-indigo-500 transition-colors print:hidden"
                >
                    🖨️ Save as PDF
                </button>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 print:block print:space-y-6">
                {/* Total Views Card */}
                <div className="bg-white rounded-lg shadow p-6 border-t-4 border-sky-500 print:shadow-none print:border print:border-slate-200">
                    <h3 className="text-lg font-semibold text-slate-700">Total Views Today</h3>
                    <p className="text-4xl font-bold text-sky-600 mt-2">{reportData.total_views_today.toLocaleString()}</p>
                    <p className="text-sm text-slate-400 mt-2">Active unique passenger map loads.</p>
                </div>

                {/* Peak Hours Card */}
                <div className="bg-white rounded-lg shadow p-6 border-t-4 border-emerald-500 print:shadow-none print:border print:border-slate-200">
                    <h3 className="text-lg font-semibold text-slate-700 mb-4">Peak Traffic Hours</h3>
                    <div className="space-y-3">
                        {reportData.peak_hours.map((peak, index) => (
                            <div key={index} className="flex justify-between items-center">
                                <span className="font-medium text-slate-600">{peak.hour}</span>
                                <div className="flex-grow mx-4 bg-slate-100 rounded-full h-2">
                                    <div 
                                        className="bg-emerald-400 h-2 rounded-full" 
                                        style={{ width: `${(peak.views / 500) * 100}%` }}
                                    ></div>
                                </div>
                                <span className="text-sm font-bold text-emerald-600">{peak.views} views</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Sponsor Impressions Card */}
            <div className="bg-white rounded-lg shadow p-6 border-t-4 border-indigo-500 print:shadow-none print:border print:border-slate-200">
                <h3 className="text-lg font-semibold text-slate-700 mb-4">Ad Slot Impressions Delivered</h3>
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-slate-200">
                            <th className="py-2 text-slate-500 font-medium">Sponsor Name</th>
                            <th className="py-2 text-slate-500 font-medium">Total Impressions</th>
                            <th className="py-2 text-slate-500 font-medium text-right">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {reportData.sponsor_impressions.map((sponsor, idx) => (
                            <tr key={idx} className="border-b border-slate-100 last:border-0">
                                <td className="py-3 font-medium text-slate-700">{sponsor.sponsor_name}</td>
                                <td className="py-3 text-indigo-600 font-bold">{sponsor.impressions.toLocaleString()}</td>
                                <td className="py-3 text-right">
                                    <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-semibold">Active</span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            
            <p className="text-center text-xs text-slate-400 mt-8">Report generated for B2B Ad Sales. Confidential.</p>
        </div>
    );
}

export default AdminReport;
