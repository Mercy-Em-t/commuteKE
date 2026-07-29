import React, { useState, useEffect } from 'react';

function LandingPage() {
    const [formData, setFormData] = useState({ name: '', email: '', type: 'General', message: '' });
    const [status, setStatus] = useState(null); // 'sending', 'success', 'error'
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [isInstallable, setIsInstallable] = useState(false);

    useEffect(() => {
        const handleBeforeInstallPrompt = (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setIsInstallable(true);
        };
        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            setIsInstallable(false);
        }
        setDeferredPrompt(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus('sending');
        try {
            const apiUrl = import.meta.env.DEV ? 'http://127.0.0.1:8001' : '';
            const res = await fetch(`${apiUrl}/api/v1/inquiry`, {
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

    const navigateTo = (e, path) => {
        e.preventDefault();
        window.history.pushState({}, '', path);
        window.dispatchEvent(new PopStateEvent('popstate'));
    };

    return (
        <div className="min-h-screen bg-white font-sans flex flex-col">
            {isInstallable && (
                <div className="bg-sky-50 border-b border-sky-100 px-4 py-2 flex justify-between items-center text-sm">
                    <span className="text-sky-800 font-medium">Get the Transy App for a better experience!</span>
                    <button onClick={handleInstallClick} className="bg-sky-600 hover:bg-sky-700 text-white px-4 py-1.5 rounded-full font-bold transition-colors shadow-sm">
                        Install Now
                    </button>
                </div>
            )}
            {/* Hero Section */}
            <header className="bg-slate-900 text-white p-8 sm:p-16 text-center border-b-8 border-amber-500 relative">
                <div className="absolute top-4 right-4 sm:top-8 sm:right-8 flex flex-col items-end">
                    <a href="/login" onClick={(e) => navigateTo(e, '/login')} className="text-sm font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-lg transition-colors border border-slate-700">
                        Login
                    </a>
                    <span className="text-xs text-slate-400 mt-1 font-medium">For Sacco Staff Only</span>
                </div>
                <img src="/transy_logo.jpg" alt="Transy Logo" className="mx-auto w-32 h-32 object-cover rounded-full shadow-2xl mb-6 border-4 border-amber-500" />
                <h1 className="text-4xl sm:text-6xl font-black mb-4">Transy</h1>
                <p className="text-xl sm:text-2xl text-slate-300 font-light max-w-2xl mx-auto">
                    Custom Commute Management for Saccos and Private Transport.
                </p>
                <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                    <a href="/routes" onClick={(e) => navigateTo(e, '/routes')} className="bg-amber-500 text-slate-900 px-8 py-3.5 rounded-xl font-bold text-lg hover:bg-amber-400 transition-colors shadow-lg">
                        View Live Routes
                    </a>
                </div>
                <div className="mt-4">
                    <span className="text-sm text-slate-400 font-medium bg-slate-800/50 px-4 py-1.5 rounded-full backdrop-blur-sm border border-slate-700">
                        No account required for passengers
                    </span>
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
            <section className="bg-slate-100 py-16 px-4 border-t border-slate-200">
                <div className="max-w-xl mx-auto bg-white p-8 rounded-3xl shadow-xl border border-slate-200 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-amber-400 to-amber-500"></div>
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
                                <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full border-slate-300 rounded-lg p-3 bg-slate-50 border focus:border-amber-500 focus:ring-1 focus:ring-amber-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Email</label>
                                <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full border-slate-300 rounded-lg p-3 bg-slate-50 border focus:border-amber-500 focus:ring-1 focus:ring-amber-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Inquiry Type</label>
                                <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} className="w-full border-slate-300 rounded-lg p-3 bg-slate-50 border focus:border-amber-500 focus:ring-1 focus:ring-amber-500">
                                    <option>General Inquiry</option>
                                    <option>Sacco Partnership</option>
                                    <option>Ad Placements</option>
                                    <option>Compliment</option>
                                    <option>Complaint/Feedback</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Message</label>
                                <textarea required rows="4" value={formData.message} onChange={e => setFormData({...formData, message: e.target.value})} className="w-full border-slate-300 rounded-lg p-3 bg-slate-50 border focus:border-amber-500 focus:ring-1 focus:ring-amber-500"></textarea>
                            </div>
                            
                            {status === 'error' && <p className="text-red-500 text-sm font-semibold">Failed to send message. Please try again.</p>}
                            
                            <button type="submit" disabled={status === 'sending'} className="w-full bg-slate-900 text-white font-bold py-3.5 rounded-xl hover:bg-slate-800 transition-all disabled:opacity-50">
                                {status === 'sending' ? 'Sending...' : 'Send Inquiry'}
                            </button>
                        </form>
                    )}
                </div>
            </section>
            
            {/* Flat Footer */}
            <footer className="bg-slate-900 py-6 text-center text-slate-400 text-sm border-t-4 border-amber-500">
                <div className="flex justify-center gap-6 mb-2">
                    <a href="https://tmsavannah.com" target="_blank" rel="noreferrer" className="hover:text-amber-500 transition-colors">About Us</a>
                    <a href="/privacy" onClick={(e) => navigateTo(e, '/privacy')} className="hover:text-amber-500 transition-colors">Privacy Policy</a>
                    <a href="/terms" onClick={(e) => navigateTo(e, '/terms')} className="hover:text-amber-500 transition-colors">Terms of Service</a>
                </div>
                <p>&copy; {new Date().getFullYear()} Transy by The Modern Savannah. All rights reserved.</p>
            </footer>
        </div>
    );
}

export default LandingPage;
