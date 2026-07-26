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
            setCurrentIndex((prev) => {
                const nextIndex = (prev + 1) % sponsors.length;
                logImpression(sponsors[nextIndex].id);
                return nextIndex;
            });
        }, 10000);

        return () => clearInterval(timer);
    }, [currentIndex]);

    return (
        <div className="w-full bg-slate-900 rounded-xl overflow-hidden shadow-lg border border-slate-800 relative group cursor-pointer h-32 flex items-center justify-center">
            <img 
                src={sponsors[currentIndex].image} 
                alt={sponsors[currentIndex].alt}
                className="w-full h-full object-cover transition-opacity duration-500"
            />
            <div className="absolute top-2 right-2 bg-black/60 text-white/80 text-[10px] px-2 py-0.5 rounded backdrop-blur-sm">
                Sponsored
            </div>
        </div>
    );
}

export default AdRotator;
