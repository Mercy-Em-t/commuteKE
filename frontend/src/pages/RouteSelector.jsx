import React from 'react';

function RouteSelector() {
    const routes = [
        {
            id: 'kiungani-cbd',
            name: 'Kiungani ⇄ Nairobi CBD',
            status: 'Active',
            description: 'Via Syokimau Airport Rd and Mombasa Road.',
            icon: '🏙️'
        },
        {
            id: 'demo-route',
            name: 'Kitengela ⇄ Nairobi CBD',
            status: 'Coming Soon',
            description: 'Via Namanga Rd and Mombasa Road.',
            icon: '🚧'
        }
    ];

    return (
        <div className="min-h-screen bg-slate-100 font-sans flex flex-col items-center py-12 px-4">
            <div className="w-full max-w-md">
                <header className="mb-8 text-center">
                    <h1 className="text-3xl font-black text-slate-800">Select Route</h1>
                    <p className="text-slate-500">Choose your daily commute.</p>
                </header>

                <div className="space-y-4">
                    {routes.map(route => (
                        <a 
                            key={route.id}
                            href={route.status === 'Active' ? `/track/${route.id}` : '#'}
                            className={`block p-6 rounded-2xl border-2 transition-all ${
                                route.status === 'Active' 
                                ? 'bg-white border-transparent hover:border-sky-300 shadow-md cursor-pointer' 
                                : 'bg-slate-200/50 border-transparent opacity-75 cursor-not-allowed'
                            }`}
                        >
                            <div className="flex items-start gap-4">
                                <div className="text-4xl">{route.icon}</div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-center mb-1">
                                        <h2 className="font-bold text-slate-800 text-lg">{route.name}</h2>
                                        <span className={`text-xs px-2 py-1 rounded-full font-bold uppercase tracking-wider ${
                                            route.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-300 text-slate-600'
                                        }`}>
                                            {route.status}
                                        </span>
                                    </div>
                                    <p className="text-sm text-slate-500">{route.description}</p>
                                </div>
                            </div>
                        </a>
                    ))}
                </div>

                <div className="mt-8 text-center">
                    <a href="/" className="text-sky-600 font-bold hover:underline">&larr; Back to Home</a>
                </div>
            </div>
        </div>
    );
}

export default RouteSelector;
