import React, { useState } from 'react';

function LandingPage() {
    const [formData, setFormData] = useState({ name: '', email: '', type: 'General', message: '' });
    const [status, setStatus] = useState(null); // 'sending', 'success', 'error'

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus('sending');
        try {
            const res = await fetch('http://127.0.0.1:8001/api/v1/inquiry', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            if (res.ok) {
                setStatus('success');
                setFormData({ name: '', email: '', type: 'General', message: '' });
            } else {
                setStatus('error');
            }
        } catch (err) {
            setStatus('error');
        }
    };

    return (
        <div className="min-h-screen bg-white font-sans flex flex-col">
            {/* Hero Section */}
            <header className="bg-slate-900 text-white p-8 sm:p-16 text-center border-b-8 border-amber-500">
                <h1 className="text-4xl sm:text-6xl font-black mb-4">Transy</h1>
                <p className="text-xl sm:text-2xl text-slate-300 font-light max-w-2xl mx-auto">
                    Custom Commute Management for Saccos and Private Transport.
                </p>
                <div className="mt-8 flex justify-center gap-4">
                    <a href="/routes" className="bg-amber-500 text-slate-900 px-8 py-3 rounded-xl font-bold text-lg hover:bg-amber-400 transition-colors shadow-lg">
                        View Live Routes
                    </a>
                </div>
            </header>

            {/* Features */}
            <section className="py-16 px-4 max-w-5xl mx-auto text-center">
                <h2 className="text-3xl font-bold text-slate-800 mb-12">Why Transy?</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 shadow-sm">
                        <div className="text-4xl mb-4">📍</div>
                        <h3 className="text-xl font-bold mb-2">Live Tracking</h3>
                        <p className="text-slate-600">Passengers can see exactly where their bus is, reducing wait times and anxiety.</p>
                    </div>
                    <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 shadow-sm">
                        <div className="text-4xl mb-4">🔔</div>
                        <h3 className="text-xl font-bold mb-2">Push Alerts</h3>
                        <p className="text-slate-600">Automated notifications alert passengers when the bus is 15 minutes away.</p>
                    </div>
                    <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 shadow-sm">
                        <div className="text-4xl mb-4">📊</div>
                        <h3 className="text-xl font-bold mb-2">Fleet Analytics</h3>
                        <p className="text-slate-600">Sacco admins get real-time dashboards on trip punctuality and route density.</p>
                    </div>
                </div>
            </section>

            {/* Contact / Inquiry Form */}
            <section className="bg-slate-100 py-16 px-4">
                <div className="max-w-xl mx-auto bg-white p-8 rounded-3xl shadow-xl border border-slate-200">
                    <h2 className="text-2xl font-bold text-slate-800 mb-2">Get in Touch</h2>
                    <p className="text-slate-500 mb-6">Want to deploy Transy for your Sacco? Send us an inquiry.</p>
                    
                    {status === 'success' ? (
                        <div className="bg-emerald-50 text-emerald-700 p-4 rounded-xl font-bold text-center border border-emerald-200">
                            Message sent successfully! We will contact you soon.
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Name</label>
                                <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full border-slate-300 rounded-lg p-3 bg-slate-50 border focus:border-sky-500 focus:ring-1 focus:ring-sky-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Email</label>
                                <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full border-slate-300 rounded-lg p-3 bg-slate-50 border focus:border-sky-500 focus:ring-1 focus:ring-sky-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Inquiry Type</label>
                                <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} className="w-full border-slate-300 rounded-lg p-3 bg-slate-50 border focus:border-sky-500 focus:ring-1 focus:ring-sky-500">
                                    <option>General Inquiry</option>
                                    <option>Sacco Partnership</option>
                                    <option>Ad Placements</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Message</label>
                                <textarea required rows="4" value={formData.message} onChange={e => setFormData({...formData, message: e.target.value})} className="w-full border-slate-300 rounded-lg p-3 bg-slate-50 border focus:border-sky-500 focus:ring-1 focus:ring-sky-500"></textarea>
                            </div>
                            
                            {status === 'error' && <p className="text-red-500 text-sm font-semibold">Failed to send message. Please try again.</p>}
                            
                            <button type="submit" disabled={status === 'sending'} className="w-full bg-slate-900 text-white font-bold py-3.5 rounded-xl hover:bg-slate-800 transition-all disabled:opacity-50">
                                {status === 'sending' ? 'Sending...' : 'Send Inquiry'}
                            </button>
                        </form>
                    )}
                </div>
            </section>
        </div>
    );
}

export default LandingPage;
