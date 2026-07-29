import React from 'react';

function TermsOfService() {
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
                    <h2 className="text-3xl font-black text-slate-900 mt-3">Terms of Service</h2>
                    <p className="text-slate-500 mt-1 text-sm">Last updated: July 2025</p>
                </div>

                <div className="space-y-8 text-slate-700 leading-relaxed">
                    <section>
                        <h3 className="text-lg font-bold text-slate-900 mb-2">1. Acceptance of Terms</h3>
                        <p>By accessing or using Transy (the "Platform"), you agree to be bound by these Terms of Service and our Privacy Policy. If you do not agree, please discontinue use immediately.</p>
                    </section>

                    <section>
                        <h3 className="text-lg font-bold text-slate-900 mb-2">2. Description of Service</h3>
                        <p>Transy is a commute management platform that provides live bus tracking, trip scheduling, and passenger notification services for Saccos and private transport operators in Kenya. The platform is operated by <strong>The Modern Savannah</strong>.</p>
                    </section>

                    <section>
                        <h3 className="text-lg font-bold text-slate-900 mb-2">3. User Responsibilities</h3>
                        <ul className="list-disc pl-5 space-y-2">
                            <li>You are responsible for ensuring your use of the platform complies with all applicable Kenyan laws and regulations.</li>
                            <li>Sacco administrators must ensure they have the lawful authority to enter into these terms on behalf of their organization.</li>
                            <li>You must not attempt to reverse-engineer, scrape, or abuse the platform's APIs.</li>
                            <li>WhatsApp notification subscriptions are for personal use only. You must not subscribe on behalf of others without their consent.</li>
                        </ul>
                    </section>

                    <section>
                        <h3 className="text-lg font-bold text-slate-900 mb-2">4. Accuracy of Information</h3>
                        <p>Live tracking data is provided in good faith based on GPS telemetry and may not be 100% accurate at all times. The Modern Savannah does not guarantee the accuracy or timeliness of trip information and accepts no liability for missed connections arising from delays or inaccuracies in tracking data.</p>
                    </section>

                    <section>
                        <h3 className="text-lg font-bold text-slate-900 mb-2">5. Sacco Partner Agreements</h3>
                        <p>Saccos and transport operators who deploy the Transy platform operate under a separate partnership agreement with The Modern Savannah. These Terms apply to end-users (passengers and staff). Pricing, SLAs, and white-labeling terms are governed by that separate agreement.</p>
                    </section>

                    <section>
                        <h3 className="text-lg font-bold text-slate-900 mb-2">6. Intellectual Property</h3>
                        <p>The Transy brand, platform code, design, and all associated assets are the intellectual property of The Modern Savannah. No part of the platform may be reproduced, modified, or distributed without explicit written consent.</p>
                    </section>

                    <section>
                        <h3 className="text-lg font-bold text-slate-900 mb-2">7. Limitation of Liability</h3>
                        <p>To the fullest extent permitted by law, The Modern Savannah shall not be liable for any indirect, incidental, or consequential damages arising from your use of the platform, including but not limited to missed trips, data loss, or service interruption.</p>
                    </section>

                    <section>
                        <h3 className="text-lg font-bold text-slate-900 mb-2">8. Termination</h3>
                        <p>We reserve the right to suspend or terminate access to the platform at any time, with or without notice, for conduct that we believe violates these Terms or is harmful to the platform, users, or third parties.</p>
                    </section>

                    <section>
                        <h3 className="text-lg font-bold text-slate-900 mb-2">9. Governing Law</h3>
                        <p>These Terms are governed by the laws of the Republic of Kenya. Any disputes shall be resolved under the jurisdiction of Kenyan courts.</p>
                    </section>

                    <section>
                        <h3 className="text-lg font-bold text-slate-900 mb-2">10. Contact</h3>
                        <p>For questions about these Terms, contact us at <a href="mailto:legal@tmsavannah.com" className="text-amber-600 font-bold hover:underline">legal@tmsavannah.com</a> or visit <a href="https://tmsavannah.com" target="_blank" rel="noreferrer" className="text-amber-600 font-bold hover:underline">tmsavannah.com</a>.</p>
                    </section>
                </div>

                <div className="mt-12 pt-6 border-t border-slate-200 flex gap-4">
                    <a href="/privacy" onClick={(e) => navigateTo(e, '/privacy')} className="text-sm font-bold text-slate-500 hover:text-amber-600 transition-colors">Privacy Policy →</a>
                </div>
            </main>

            <footer className="bg-slate-900 py-4 text-center text-slate-500 text-xs border-t-4 border-amber-500 mt-12">
                &copy; {new Date().getFullYear()} Transy by The Modern Savannah. All rights reserved.
            </footer>
        </div>
    );
}

export default TermsOfService;
