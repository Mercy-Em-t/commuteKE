import React, { useState, useEffect } from 'react';
import PassengerFooter from './components/Footer';
import AdRotator from './components/AdRotator';
import AdminReport from './pages/AdminReport';
import AdminDashboard from './pages/AdminDashboard';
import DriverPortal from './pages/DriverPortal';
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

const GATEWAY_MALL = [-1.36434, 36.91214];
const MOCK_ROUTE = [
  [-1.36500, 36.93800], // Junction Syokimau Airport Rd & Kiungani Rd
  [-1.36434, 36.91214], // Gateway Mall (Kiungani Rd)
  [-1.37072, 36.92078], // MEDS centre (Mombasa Rd junction / Expressway)
  [-1.32000, 36.87000], // Mombasa Road transit
  [-1.28650, 36.82580], // Nairobi CBD Bus Station
];

function PassengerView() {
  const [busPosition, setBusPosition] = useState([-1.37072, 36.92078]);
  const [showSchedule, setShowSchedule] = useState(false);

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
        
        <header className="bg-white shadow-sm p-4 text-center z-10 relative">
          <h1 className="text-xl font-bold text-slate-800">Kiungani TransitOS</h1>
          <p className="text-sm text-slate-500">Live Bus Tracker</p>
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
              <div className="bg-sky-50 border border-sky-100 rounded-lg p-3">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sky-900 font-bold">Boarding at Green Tank</p>
                    <p className="text-sm text-sky-700 mt-0.5">Leaving in 10 minutes</p>
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
                onClick={() => setShowSchedule(true)}
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
          <div className="absolute inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
            <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-6 transform transition-all">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-slate-800">Today's Schedule</h3>
                <button onClick={() => setShowSchedule(false)} className="text-slate-400 hover:text-slate-600">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between border-b pb-2"><span className="text-slate-600">06:00 AM</span><span className="text-emerald-600 font-bold">Departed</span></div>
                <div className="flex justify-between border-b pb-2"><span className="text-slate-600">06:30 AM</span><span className="text-sky-600 font-bold">Boarding Now</span></div>
                <div className="flex justify-between border-b pb-2"><span className="text-slate-600">07:00 AM</span><span className="text-slate-400 font-bold">Scheduled</span></div>
                <div className="flex justify-between border-b pb-2"><span className="text-slate-600">07:30 AM</span><span className="text-slate-400 font-bold">Scheduled</span></div>
              </div>
              <button onClick={() => setShowSchedule(false)} className="w-full mt-6 bg-slate-100 text-slate-700 font-semibold py-3 rounded-xl hover:bg-slate-200">
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function App() {
  const [currentRoute, setCurrentRoute] = useState(window.location.pathname);

  useEffect(() => {
    const handleLocationChange = () => setCurrentRoute(window.location.pathname);
    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);

  if (currentRoute === '/admin' || currentRoute === '/report') {
    return <AdminReport />;
  }

  if (currentRoute === '/driver') {
    return <DriverPortal />;
  }

  if (currentRoute === '/roster' || currentRoute === '/operations') {
    return <AdminDashboard />;
  }

  return <PassengerView />;
}

export default App;
