import React, { useState } from 'react';
import ScheduleDrawer from '../components/ScheduleDrawer';

const routes = [
    {
        id: 'kiungani-cbd',
        tenantId: 'kiungani-01',
        name: 'Kiungani ⇄ Nairobi CBD',
        status: 'Active',
        description: 'Via Syokimau Airport Rd and Mombasa Road.',
        icon: '🏙️'
    },
    {
        id: 'demo-route',
        tenantId: null,
        name: 'Kitengela ⇄ Nairobi CBD',
        status: 'Coming Soon',
        description: 'Via Namanga Rd and Mombasa Road.',
        icon: '🚧'
    }
];

function RouteSelector() {
    const [scheduleFor, setScheduleFor] = useState(null); // { tenantId, name }
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');

    const filteredRoutes = routes.filter(route => {
        const matchesSearch = route.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              route.description.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'All' || route.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    return (
        <div className="min-h-screen bg-slate-100 font-sans flex flex-col items-center py-12 px-4">
            <div className="w-full max-w-md">
                <header className="mb-8 text-center">
                    <h1 className="text-3xl font-black text-slate-800">Select Route</h1>
                    <p className="text-slate-500 mt-1">Choose your daily commute.</p>
                </header>

                <div className="mb-6 space-y-4">
                    {/* Search Bar */}
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <span className="text-slate-400">🔍</span>
                        </div>
                        <input
                            type="text"
                            placeholder="Search routes..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent text-slate-800 font-medium"
                        />
                    </div>

                    {/* Filters */}
                    <div className="flex gap-2 bg-slate-200/50 p-1 rounded-xl">
                        {['All', 'Active', 'Coming Soon'].map(status => (
                            <button
                                key={status}
                                onClick={() => setStatusFilter(status)}
                                className={`flex-1 py-1.5 text-sm font-bold rounded-lg transition-all ${
                                    statusFilter === status 
                                        ? 'bg-white text-slate-800 shadow-sm' 
                                        : 'text-slate-500 hover:text-slate-700'
                                }`}
                            >
                                {status}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="space-y-4">
                    {filteredRoutes.length === 0 ? (
                        <div className="text-center py-8">
                            <p className="text-slate-500 font-medium">No routes found matching your criteria.</p>
                        </div>
                    ) : (
                        filteredRoutes.map(route => (
                            <div
                                key={route.id}
                                className={`bg-white rounded-2xl border-2 transition-all shadow-sm ${
                                    route.status === 'Active'
                                        ? 'border-transparent hover:border-sky-200 hover:shadow-md'
                                        : 'border-transparent opacity-75'
                                }`}
                            >
                                {/* Card header */}
                                <div className="flex items-start gap-4 p-5">
                                    <div className="text-4xl">{route.icon}</div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-center mb-1 gap-2">
                                            <h2 className="font-bold text-slate-800 text-lg leading-tight">{route.name}</h2>
                                            <span className={`shrink-0 text-xs px-2 py-1 rounded-full font-bold uppercase tracking-wider ${
                                                route.status === 'Active'
                                                    ? 'bg-emerald-100 text-emerald-700'
                                                    : 'bg-slate-200 text-slate-500'
                                            }`}>
                                                {route.status}
                                            </span>
                                        </div>
                                        <p className="text-sm text-slate-500">{route.description}</p>
                                    </div>
                                </div>

                                {route.status === 'Active' && (
                                    <div className="px-5 pb-5 flex gap-3">
                                        <button
                                            onClick={() => setScheduleFor({ tenantId: route.tenantId, name: route.name })}
                                            className="flex-1 flex items-center justify-center gap-2 bg-slate-100 hover:bg-sky-50 hover:text-sky-700 text-slate-600 font-bold py-2.5 rounded-xl transition-all text-sm border border-slate-200 hover:border-sky-200"
                                        >
                                            📅 Schedule
                                        </button>
                                        <a
                                            href={`/track/${route.id}`}
                                            onClick={(e) => {
                                                e.preventDefault();
                                                window.history.pushState({}, '', `/track/${route.id}`);
                                                window.dispatchEvent(new PopStateEvent('popstate'));
                                            }}
                                            className="flex-1 flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 rounded-xl transition-all text-sm"
                                        >
                                            📍 Track Live
                                        </a>
                                    </div>
                                )}

                                {route.status === 'Coming Soon' && (
                                    <div className="px-5 pb-5">
                                        <p className="text-xs text-slate-400 font-medium text-center">
                                            Schedule and tracking coming soon
                                        </p>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>

                <div className="mt-8 text-center">
                    <a 
                        href="/" 
                        onClick={(e) => {
                            e.preventDefault();
                            window.history.pushState({}, '', '/');
                            window.dispatchEvent(new PopStateEvent('popstate'));
                        }}
                        className="text-sky-600 font-bold hover:underline"
                    >
                        &larr; Back to Home
                    </a>
                </div>
            </div>

            {/* Schedule Drawer */}
            {scheduleFor && (
                <ScheduleDrawer
                    tenantId={scheduleFor.tenantId}
                    routeName={scheduleFor.name}
                    onClose={() => setScheduleFor(null)}
                />
            )}
        </div>
    );
}

export default RouteSelector;
