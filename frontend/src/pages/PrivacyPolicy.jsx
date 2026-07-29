import React from 'react';

function PrivacyPolicy() {
    const navigateTo = (e, path) => {
        e.preventDefault();
        window.history.pushState({}, '', path);
        window.dispatchEvent(new PopStateEvent('popstate'));
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans">
            <header className="bg-slate-900 border-b-4 border-amber-500 px-6 py-4 flex items-center gap-4">
                <a href="/" onClick={(e) => navigateTo(e, '/')} className="text-slate-400 hover:text-white transition-colors">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                </a>
                <div className="flex items-center gap-3">
                    <img src="/transy_logo.jpg" alt="Transy" className="w-8 h-8 rounded-full border border-amber-500" />
                    <div>
                        <h1 className="text-white font-black text-sm tracking-widest uppercase">Transy</h1>
                        <p className="text-slate-400 text-xs">by The Modern Savannah</p>
                    </div>
                </div>
            </header>

            <main className="max-w-2xl mx-auto px-6 py-12">
                <div className="mb-8">
                    <span className="text-xs font-bold uppercase tracking-widest text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">Legal</span>
                    <h2 className="text-3xl font-black text-slate-900 mt-3">Privacy Policy</h2>
                    <p className="text-slate-500 mt-1 text-sm">Last updated: July 2025</p>
                </div>

                <div className="space-y-8 text-slate-700 leading-relaxed">
                    <section>
                        <h3 className="text-lg font-bold text-slate-900 mb-2">1. Who We Are</h3>
                        <p>Transy is a commute management platform operated by <strong>The Modern Savannah</strong> ("TMS", "we", "our"). This policy explains how we collect, use, and protect your data when you use the Transy platform.</p>
                    </section>

                    <section>
                        <h3 className="text-lg font-bold text-slate-900 mb-2">2. What Data We Collect</h3>
                        <ul className="list-disc pl-5 space-y-2">
                            <li><strong>Passengers:</strong> Your name (entered voluntarily at onboarding) and WhatsApp phone number (only if you opt-in to trip notifications). We do not require account creation.</li>
                            <li><strong>Sacco Staff:</strong> Email address and authentication credentials managed via Supabase Auth.</li>
                            <li><strong>Usage Data:</strong> Route views, trip tracking interactions, and in-app events used to improve service quality.</li>
                        </ul>
                    </section>

                    <section>
                        <h3 className="text-lg font-bold text-slate-900 mb-2">3. How We Use Your Data</h3>
                        <ul className="list-disc pl-5 space-y-2">
                            <li>To send you WhatsApp trip departure notifications (only if subscribed).</li>
                            <li>To display your name on the passenger tracking view for a personalized experience.</li>
                            <li>To provide Sacco administrators with access to their fleet management dashboard.</li>
                            <li>To improve the Transy platform by analyzing aggregate, anonymous usage patterns.</li>
                        </ul>
                    </section>

                    <section>
                        <h3 className="text-lg font-bold text-slate-900 mb-2">4. Data Sharing</h3>
                        <p>We do not sell, trade, or rent your personal information to third parties. We may share data with:</p>
                        <ul className="list-disc pl-5 mt-2 space-y-1">
                            <li><strong>Supabase</strong> – our database and authentication provider.</li>
                            <li><strong>Your Sacco</strong> – subscription data may be visible to the Sacco administrator for the route you track.</li>
                        </ul>
                    </section>

                    <section>
                        <h3 className="text-lg font-bold text-slate-900 mb-2">5. Your Rights</h3>
                        <p>You may request deletion of your personal data at any time by contacting us at <a href="mailto:privacy@tmsavannah.com" className="text-amber-600 font-bold hover:underline">privacy@tmsavannah.com</a>. Passengers can also clear their local data by clearing their browser's local storage.</p>
                    </section>

                    <section>
                        <h3 className="text-lg font-bold text-slate-900 mb-2">6. Changes to This Policy</h3>
                        <p>We may update this policy from time to time. Changes will be published on this page with an updated date. Continued use of the platform constitutes acceptance of the updated policy.</p>
                    </section>

                    <section>
                        <h3 className="text-lg font-bold text-slate-900 mb-2">7. Contact</h3>
                        <p>For any privacy-related queries, reach us at <a href="mailto:privacy@tmsavannah.com" className="text-amber-600 font-bold hover:underline">privacy@tmsavannah.com</a> or visit <a href="https://tmsavannah.com" target="_blank" rel="noreferrer" className="text-amber-600 font-bold hover:underline">tmsavannah.com</a>.</p>
                    </section>
                </div>

                <div className="mt-12 pt-6 border-t border-slate-200 flex gap-4">
                    <a href="/terms" onClick={(e) => navigateTo(e, '/terms')} className="text-sm font-bold text-slate-500 hover:text-amber-600 transition-colors">Terms of Service →</a>
                </div>
            </main>

            <footer className="bg-slate-900 py-4 text-center text-slate-500 text-xs border-t-4 border-amber-500 mt-12">
                &copy; {new Date().getFullYear()} Transy by The Modern Savannah. All rights reserved.
            </footer>
        </div>
    );
}

export default PrivacyPolicy;
