import React, { useState, useEffect } from 'react';
import PassengerFooter from './components/Footer';
import AdRotator from './components/AdRotator';
import AdminReport from './pages/AdminReport';
import AdminDashboard from './pages/AdminDashboard';
import DriverPortal from './pages/DriverPortal';
import LandingPage from './pages/LandingPage';
import RouteSelector from './pages/RouteSelector';
import Login from './pages/Login';
import { AuthProvider, useAuth } from './context/AuthContext';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import './App.css';

// Fix for Leaflet default icon issues in React
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

import routeData from './routeData.json';

const MOCK_ROUTE = routeData;

const MOCK_SCHEDULE = [
  { id: 1, time: '06:00 AM', status: 'Departed', direction: 'To CBD', busPlate: 'KCD 123X', crew: 'John (0712345678)' },
  { id: 2, time: '06:30 AM', status: 'Boarding', direction: 'To CBD', busPlate: 'KAB 456Y', crew: 'Peter (0722334455)' },
  { id: 3, time: '07:00 AM', status: 'Scheduled', direction: 'From CBD', busPlate: 'KCD 123X', crew: 'John (0712345678)' },
  { id: 4, time: '07:30 AM', status: 'Scheduled', direction: 'To CBD', busPlate: 'KXY 987Z', crew: 'Mike (0733445566)' },
];

function PassengerView() {
  const [busPosition, setBusPosition] = useState([-1.37072, 36.92078]);
  const [showSchedule, setShowSchedule] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState(null);
  
  const today = new Date().toLocaleDateString('en-KE', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' });

  useEffect(() => {
    // Simulate live bus movement along the route
    let index = 0;
    const interval = setInterval(() => {
      setBusPosition(MOCK_ROUTE[index]);
      index = (index + 1) % MOCK_ROUTE.length;
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Log page view when the passenger map loads
    fetch('http://127.0.0.1:8001/api/v1/analytics/pageview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tenant_id: 'kiungani-01' })
    }).catch(err => console.error("Failed to log page view:", err));
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-slate-100 font-sans sm:items-center">
      {/* Mobile-first container constraining width on desktop */}
      <div className="w-full sm:max-w-md flex flex-col min-h-screen bg-white shadow-xl relative">
        
        <header className="bg-slate-900 shadow-sm p-4 text-center z-10 relative border-b-4 border-amber-500 flex justify-between items-center">
          <a href="/routes" className="text-slate-400 hover:text-white transition-colors">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </a>
          <div>
            <p className="text-xs text-amber-500 font-bold tracking-widest uppercase mb-1">{today}</p>
            <h1 className="text-xl font-black text-white">Kiungani TransitOS</h1>
          </div>
          <div className="w-6"></div> {/* Spacer for centering */}
        </header>

        <main className="flex-grow flex flex-col relative">
          
          {/* Map Section - Takes up upper half */}
          <div className="w-full h-[45vh] relative z-0">
            <MapContainer center={[-1.36434, 36.91214]} zoom={15} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }}>
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                keepBuffer={8}
                updateWhenIdle={false}
                updateWhenZooming={false}
              />
              <Polyline positions={MOCK_ROUTE} color="blue" weight={5} opacity={0.8} />
              
              <Marker position={busPosition}>
                <Popup>Bus KCD 123X <br/> Live Tracking</Popup>
              </Marker>
            </MapContainer>
          </div>

          {/* Status Section - Bottom half */}
          <div className="p-4 flex flex-col gap-4 bg-slate-50 flex-grow relative z-10 -mt-4 rounded-t-2xl shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
            <div className="bg-white rounded-xl shadow-sm p-4 border border-slate-100">
              <h2 className="font-semibold text-lg mb-3 text-slate-800">Next Departure</h2>
              <div className="bg-sky-50 border border-sky-100 rounded-lg p-3 cursor-pointer hover:bg-sky-100 transition-colors" onClick={() => setShowSchedule(true)}>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sky-900 font-bold">Boarding at Green Tank</p>
                    <p className="text-sm text-sky-700 mt-0.5">Leaving in 10 minutes</p>
                    <p className="text-xs text-sky-600 mt-1 font-semibold">Direction: To CBD 🏙️</p>
                  </div>
                  <span className="bg-sky-200 text-sky-800 text-xs px-2 py-1 rounded-full font-semibold animate-pulse">LIVE</span>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <button 
                onClick={() => {
                  if(window.confirm("TM Savannah wants to send you Notifications (Push Alerts). Allow?")) {
                    alert("Subscribed! You will get a notification when the bus is 15 minutes away.");
                  }
                }}
                className="flex-1 bg-slate-800 text-white font-semibold py-3.5 rounded-xl shadow-md hover:bg-slate-700 active:scale-[0.98] transition-all">
                🔔 Notify Me
              </button>
              
              <button 
                onClick={() => {
                  setSelectedTrip(null);
                  setShowSchedule(true);
                }}
                className="flex-1 bg-white border border-slate-200 text-slate-700 font-semibold py-3.5 rounded-xl shadow-sm hover:bg-slate-50 active:scale-[0.98] transition-all">
                📅 Schedule
              </button>
            </div>

            {/* Dynamic Ad Rotator */}
            <div className="mt-auto pb-4">
              <AdRotator />
            </div>
          </div>
        </main>

        <PassengerFooter />

        {/* Schedule Modal */}
        {showSchedule && (
          <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex flex-col justify-end sm:justify-center">
            <div className="bg-white w-full sm:max-w-sm sm:mx-auto rounded-t-3xl sm:rounded-2xl shadow-2xl p-6 transform transition-all max-h-[80vh] overflow-y-auto">
              
              <div className="flex justify-between items-center mb-6 sticky top-0 bg-white pb-2 border-b">
                <h3 className="text-xl font-bold text-slate-800">Daily Schedule</h3>
                <button onClick={() => setShowSchedule(false)} className="bg-slate-100 p-2 rounded-full text-slate-600 hover:bg-slate-200 transition-colors">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              {!selectedTrip ? (
                <div className="space-y-3">
                  {MOCK_SCHEDULE.map((trip) => (
                    <div 
                      key={trip.id} 
                      onClick={() => setSelectedTrip(trip)}
                      className="border border-slate-200 rounded-xl p-4 cursor-pointer hover:border-sky-300 hover:shadow-md transition-all group"
                    >
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-black text-lg text-slate-800">{trip.time}</span>
                        <span className={`text-xs px-2 py-1 rounded-md font-bold uppercase tracking-wide
                          ${trip.status === 'Departed' ? 'bg-slate-100 text-slate-500' : ''}
                          ${trip.status === 'Boarding' ? 'bg-emerald-100 text-emerald-700 animate-pulse' : ''}
                          ${trip.status === 'Scheduled' ? 'bg-sky-50 text-sky-600' : ''}
                        `}>
                          {trip.status}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600 font-medium">
                           {trip.direction === 'To CBD' ? '🏙️ Towards Town' : '🏡 Towards Kiungani'}
                        </span>
                        <span className="text-sky-600 font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                          View Crew &rarr;
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                  <button 
                    onClick={() => setSelectedTrip(null)}
                    className="text-sm text-sky-600 font-bold mb-4 flex items-center gap-1"
                  >
                    &larr; Back to Schedule
                  </button>
                  <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
                    <h4 className="text-2xl font-black text-slate-800 mb-1">{selectedTrip.time}</h4>
                    <p className="text-slate-500 font-medium mb-6 pb-4 border-b border-slate-200">
                      {selectedTrip.direction === 'To CBD' ? 'Route: Kiungani to CBD' : 'Route: CBD to Kiungani'}
                    </p>
                    
                    <div className="space-y-4">
                      <div>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Status</p>
                        <p className="font-semibold text-slate-800">{selectedTrip.status}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Vehicle Details</p>
                        <p className="font-semibold text-slate-800">{selectedTrip.busPlate} (County Link)</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Crew Contact</p>
                        <div className="flex items-center gap-3">
                          <p className="font-semibold text-slate-800">{selectedTrip.crew}</p>
                          <a href={`tel:${selectedTrip.crew.match(/\d+/)[0]}`} className="bg-emerald-500 text-white text-xs px-3 py-1.5 rounded-lg font-bold shadow-sm hover:bg-emerald-400">
                            📞 Call
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Security Wrapper: Checks if user is authenticated before rendering Admin/Driver portals
function ProtectedRoute({ children }) {
    const { user, loading } = useAuth();

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center font-bold text-slate-500">Authenticating...</div>;
    }

    if (!user) {
        // Redirect unauthorized users to the login screen
        window.location.href = '/login';
        return null;
    }

    return children;
}

function MainApp() {
  const [currentRoute, setCurrentRoute] = useState(window.location.pathname);

  useEffect(() => {
    const handleLocationChange = () => setCurrentRoute(window.location.pathname);
    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);

  if (currentRoute === '/') {
    return <LandingPage />;
  }

  if (currentRoute === '/routes') {
    return <RouteSelector />;
  }

  if (currentRoute.startsWith('/track/')) {
    return <PassengerView />;
  }

  if (currentRoute === '/login') {
    return <Login />;
  }

  if (currentRoute === '/admin' || currentRoute === '/report') {
    return <ProtectedRoute><AdminReport /></ProtectedRoute>;
  }

  if (currentRoute === '/driver') {
    return <ProtectedRoute><DriverPortal /></ProtectedRoute>;
  }

  if (currentRoute === '/roster' || currentRoute === '/operations') {
    return <ProtectedRoute><AdminDashboard /></ProtectedRoute>;
  }

  // Fallback to landing page for unknown routes
  return <LandingPage />;
}

function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}

export default App;
