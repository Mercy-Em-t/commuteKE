import React, { useState, useEffect } from 'react';

// Mock list of active sponsors from the DB
const MOCK_SPONSORS = [
    { id: '1', name: 'Kiungani Fresh Butchery', message: 'Get 10% off beef today! Call 07XX...', rate: 3000 },
    { id: '2', name: 'Katani Pizza', message: 'Order fresh pizza at Katani Junction! Dial 0712...', rate: 2500 },
];

export function AdRotator() {
    const [currentIndex, setCurrentIndex] = useState(0);
    const sponsors = [
        {
            id: 'sponsor-01',
            image: '/ad_school_supplies_1785051072735.jpg',
            alt: 'Back to School Sale'
        },
        {
            id: 'sponsor-02',
            image: '/ad_local_butchery_1785051094811.jpg',
            alt: 'Premium Butchery BBQ Special'
        }
    ];

    const [isClicking, setIsClicking] = useState(false);
    const [showAdModal, setShowAdModal] = useState(false);

    useEffect(() => {
        const logImpression = async (sponsorId) => {
            try {
                await fetch('http://127.0.0.1:8001/api/v1/analytics/impression', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        sponsor_id: sponsorId,
                        tenant_id: 'kiungani-01',
                        timestamp: new Date().toISOString()
                    })
                });
            } catch (err) {
                console.error("Failed to log ad impression:", err);
            }
        };

        logImpression(sponsors[currentIndex].id);

        const timer = setInterval(() => {
            if (!showAdModal) {
                setCurrentIndex((prev) => {
                    const nextIndex = (prev + 1) % sponsors.length;
                    logImpression(sponsors[nextIndex].id);
                    return nextIndex;
                });
            }
        }, 10000);

        return () => clearInterval(timer);
    }, [currentIndex, showAdModal]);

    const handleAdClick = () => {
        if (isClicking) return;
        setIsClicking(true);
        setShowAdModal(true);
        
        // Debounce: allow next click only after 1 second
        setTimeout(() => {
            setIsClicking(false);
        }, 1000);
    };

    return (
        <>
            <div onClick={handleAdClick} className={`w-full bg-slate-900 rounded-xl overflow-hidden shadow-lg border border-slate-800 relative group cursor-pointer h-32 flex items-center justify-center transition-all ${isClicking ? 'opacity-50 scale-95' : 'hover:scale-[1.02]'}`}>
                <img 
                    src={sponsors[currentIndex].image} 
                    alt={sponsors[currentIndex].alt}
                    className="w-full h-full object-cover transition-opacity duration-500"
                />
                <div className="absolute top-2 right-2 bg-black/60 text-white/80 text-[10px] px-2 py-0.5 rounded backdrop-blur-sm">
                    Sponsored
                </div>
            </div>

            {/* Ad Destination Modal */}
            {showAdModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[200] p-4 animate-in fade-in duration-300">
                    <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl relative">
                        <button onClick={() => setShowAdModal(false)} className="absolute top-4 right-4 bg-slate-900/50 text-white rounded-full p-2 hover:bg-slate-900/80 transition-colors z-10">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                        
                        <img 
                            src={sponsors[currentIndex].image} 
                            alt={sponsors[currentIndex].alt}
                            className="w-full h-48 object-cover"
                        />
                        <div className="p-6">
                            <span className="text-[10px] font-black tracking-widest uppercase text-emerald-600 bg-emerald-50 px-2 py-1 rounded">Exclusive Offer</span>
                            <h2 className="text-2xl font-black text-slate-800 mt-2 mb-2">{sponsors[currentIndex].alt}</h2>
                            <p className="text-slate-500 font-medium text-sm mb-6">
                                Thanks for supporting local transit! Claim this exclusive offer today by visiting us or calling.
                            </p>
                            <button className="w-full bg-emerald-600 text-white font-bold py-3.5 rounded-xl hover:bg-emerald-500 transition-colors shadow-sm flex items-center justify-center gap-2">
                                <span>Get Directions</span>
                                <span>&rarr;</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export default AdRotator;
