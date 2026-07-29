import React, { useState, useEffect } from 'react';
import PassengerFooter from './components/Footer';
import AdRotator from './components/AdRotator';
import AdminReport from './pages/AdminReport';
import AdminDashboard from './pages/AdminDashboard';
import DriverPortal from './pages/DriverPortal';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import LandingPage from './pages/LandingPage';
import RouteSelector from './pages/RouteSelector';
import Login from './pages/Login';
import Sandbox from './pages/Sandbox';
import ScheduleDrawer from './components/ScheduleDrawer';
import { AuthProvider, useAuth } from './context/AuthContext';
import { supabase } from './supabaseClient';
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


function PassengerView() {
  const [busPosition, setBusPosition] = useState([-1.37072, 36.92078]);
  const [showSchedule, setShowSchedule] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [liveTrips, setLiveTrips] = useState([]);
  
  // Passenger State
  const [passengerName, setPassengerName] = useState('');
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [subscriptionMessage, setSubscriptionMessage] = useState(null);
  
  const today = new Date().toLocaleDateString('en-KE', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' });

  // Helper function to extract Lat/Lng from PostGIS WKT Point string
  const parsePoint = (wkt) => {
    if (!wkt) return null;
    const match = wkt.match(/POINT\(([^ ]+) ([^ ]+)\)/);
    if (match) {
        return [parseFloat(match[2]), parseFloat(match[1])]; // Leaflet expects [Lat, Lng]
    }
    return null;
  };

  const [saccoData, setSaccoData] = useState(null);

  useEffect(() => {
    // Check if the passenger is recognized
    const storedName = localStorage.getItem('passenger_name');
    if (storedName) {
      setPassengerName(storedName);
    } else {
      setShowOnboarding(true);
    }
    
    // Fetch Sacco Data
    const fetchSacco = async () => {
        const { data } = await supabase.from('saccos').select('*').eq('id', 'kiungani-01').single();
        if (data) setSaccoData(data);
    };
    fetchSacco();

    // Fetch initial trips from Supabase
    const fetchTrips = async () => {
        const { data, error } = await supabase
            .from('active_trips')
            .select('*')
            .eq('tenant_id', 'kiungani-01')
            .order('scheduled_departure', { ascending: true });
        
        if (data && data.length > 0) {
            setLiveTrips(data);
            const active = data.find(t => t.status === 'IN_TRANSIT' || t.status === 'BOARDING') || data[0];
            if (active && active.current_location) {
                const pos = parsePoint(active.current_location);
                if (pos) setBusPosition(pos);
            }
        }
    };
    fetchTrips();

    // Subscribe to real-time Postgres changes for GPS updates
    const channel = supabase
        .channel('public:active_trips')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'active_trips' }, (payload) => {
            if (payload.new && payload.new.current_location) {
                const pos = parsePoint(payload.new.current_location);
                if (pos) setBusPosition(pos);
            }
            // Update the liveTrips list
            setLiveTrips(prev => {
                const updated = prev.map(t => t.id === payload.new.id ? payload.new : t);
                return updated;
            });
        })
        .subscribe();

    return () => {
        supabase.removeChannel(channel);
    };
  }, []);

  const [showWhatsAppInput, setShowWhatsAppInput] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!phoneNumber) {
        setShowWhatsAppInput(true);
        return;
    }
    
    setIsLoading(true);
    try {
        const apiUrl = import.meta.env.DEV ? 'http://127.0.0.1:8001' : '';
        const res = await fetch(`${apiUrl}/api/v1/subscribe/whatsapp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                phone_number: phoneNumber,
                tenant_id: 'kiungani-01',
                route_id: 'kiungani-cbd',
                passenger_name: passengerName
            })
        });
        if (res.ok) {
            setSubscriptionMessage(`Subscribed! We will notify ${phoneNumber} via WhatsApp.`);
            setShowWhatsAppInput(false);
            setPhoneNumber('');
        } else {
            setSubscriptionMessage("Failed to subscribe. Please try again.");
        }
    } catch (err) {
        setSubscriptionMessage("Network error during subscription.");
    } finally {
        setIsLoading(false);
        setTimeout(() => setSubscriptionMessage(null), 5000);
    }
  };

  const activeTrip = liveTrips.find(t => t.status === 'IN_TRANSIT' || t.status === 'BOARDING') || liveTrips[0];

  return (
    <div className="flex flex-col min-h-screen bg-slate-100 font-sans sm:items-center">
      
      {/* Subscription Toast Notification */}
      {subscriptionMessage && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-emerald-600 text-white px-6 py-3 rounded-full shadow-lg font-bold text-sm animate-in fade-in slide-in-from-top-4 w-[90%] max-w-md text-center">
            {subscriptionMessage}
        </div>
      )}

      {/* Mobile-first container constraining width on desktop */}
      <div className="w-full sm:max-w-md flex flex-col min-h-screen bg-white shadow-xl relative">
        
        <header className="bg-slate-900 shadow-sm p-4 text-center z-10 relative border-b-4 border-amber-500 flex justify-between items-center">
          <a 
            href="/routes" 
            onClick={(e) => {
              e.preventDefault();
              window.history.pushState({}, '', '/routes');
              window.dispatchEvent(new PopStateEvent('popstate'));
            }}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </a>
          <div>
            <p className="text-xs text-amber-500 font-bold tracking-widest uppercase mb-1">{today}</p>
            <h1 className="text-xl font-black text-white">Kiungani Transy</h1>
          </div>
          <div className="w-6"></div> {/* Spacer for centering */}
        </header>

        {passengerName && (
            <div className="bg-emerald-50 border-b border-emerald-100 py-2 text-center shadow-sm relative z-10">
                <p className="text-xs font-bold text-emerald-800 uppercase tracking-widest">
                    <span className="inline-block w-2 h-2 bg-emerald-500 rounded-full mr-2 animate-pulse"></span>
                    Welcome back, {passengerName}
                </p>
            </div>
        )}

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
              <h2 className="font-semibold text-lg mb-3 text-slate-800">Trip Status</h2>
              {activeTrip ? (
                  <div className="bg-sky-50 border border-sky-100 rounded-lg p-3 cursor-pointer hover:bg-sky-100 transition-colors" onClick={() => setShowSchedule(true)}>
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sky-900 font-bold">Bus {activeTrip.bus_id} &rarr; CBD</p>
                        <p className="text-sm text-sky-700 mt-1 font-black uppercase tracking-wider flex items-center gap-2">
                            <span className="w-2 h-2 bg-sky-500 rounded-full animate-pulse"></span>
                            {activeTrip.status.replace('_', ' ')}
                        </p>
                        <p className="text-xs text-sky-600 mt-1 font-semibold">
                            {activeTrip.status === 'BOARDING' ? 'Bus is stationary. Journey starting soon.' : 'Bus is en route.'}
                        </p>
                      </div>
                      <span className="bg-sky-200 text-sky-800 text-xs px-2 py-1 rounded-full font-semibold">LIVE</span>
                    </div>
                  </div>
              ) : (
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-center cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => setShowSchedule(true)}>
                      <p className="text-slate-600 font-medium">No active trips right now.</p>
                      <p className="text-sm text-sky-600 font-bold mt-1">Tap to view schedule &rarr;</p>
                  </div>
              )}
            </div>

            <div className="flex flex-col gap-2">
              {showWhatsAppInput ? (
                <form onSubmit={handleSubscribe} className="flex gap-2 w-full animate-in fade-in slide-in-from-top-2">
                  <input 
                    type="tel" 
                    placeholder="e.g. +254700000000"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    required
                    className="flex-1 bg-white border border-slate-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-semibold"
                  />
                  <button 
                    type="submit"
                    disabled={isLoading}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-3 rounded-xl transition-colors disabled:opacity-50"
                  >
                    {isLoading ? '...' : 'Done'}
                  </button>
                </form>
              ) : (
                <div className="flex flex-col gap-2">
                    <div className="flex gap-2">
                      <div className="flex-1 flex flex-col gap-1">
                        <button 
                          onClick={handleSubscribe}
                          className="w-full bg-emerald-600 text-white font-semibold py-3.5 rounded-xl shadow-md hover:bg-emerald-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2">
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                          Notify Me
                        </button>
                        <span className="text-[10px] text-slate-400 text-center font-semibold uppercase tracking-wider">Via WhatsApp</span>
                      </div>
                      
                      <button 
                        onClick={() => {
                          setSelectedTrip(null);
                          setShowSchedule(true);
                        }}
                        className="flex-1 bg-white border border-slate-200 text-slate-700 font-semibold py-3.5 rounded-xl shadow-sm hover:bg-slate-50 active:scale-[0.98] transition-all">
                        📅 Schedule
                      </button>
                    </div>
                    
                    {saccoData?.whatsapp_channel_link && (
                      <a href={saccoData.whatsapp_channel_link} target="_blank" rel="noreferrer" className="w-full bg-slate-800 text-white font-semibold py-3 rounded-xl shadow-md hover:bg-slate-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2">
                          <svg className="w-5 h-5 text-emerald-400" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                          Join our WhatsApp Channel
                      </a>
                    )}
                </div>
              )}
            </div>

            {/* Dynamic Ad Rotator */}
            <div className="mt-auto pb-4">
              <AdRotator />
            </div>
          </div>
        </main>

        <PassengerFooter />

        {/* Onboarding Modal */}
        {showOnboarding && (
            <div className="absolute inset-0 z-[100] bg-slate-900/80 backdrop-blur-md flex flex-col items-center justify-center p-6">
                <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-sm text-center animate-in zoom-in-95 duration-300">
                    <div className="w-16 h-16 bg-sky-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-3xl">👋</span>
                    </div>
                    <h2 className="text-2xl font-black text-slate-800 mb-2">Welcome Aboard!</h2>
                    <p className="text-slate-500 font-medium mb-6">To personalize your trip tracking, what should we call you?</p>
                    
                    <form onSubmit={(e) => {
                        e.preventDefault();
                        const name = e.target.pname.value;
                        localStorage.setItem('passenger_name', name);
                        setPassengerName(name);
                        setShowOnboarding(false);
                    }}>
                        <input name="pname" type="text" required placeholder="Enter your name" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-center font-bold text-slate-800 mb-4 focus:outline-none focus:ring-2 focus:ring-sky-500" />
                        <button type="submit" className="w-full bg-sky-600 text-white font-bold py-4 rounded-xl shadow-md hover:bg-sky-700 transition-colors">
                            Start Tracking
                        </button>
                    </form>
                </div>
            </div>
        )}
        {/* Schedule Drawer */}
        {showSchedule && (
            <ScheduleDrawer
                tenantId="kiungani-01"
                routeName="Kiungani ⇄ Nairobi CBD"
                onClose={() => setShowSchedule(false)}
            />
        )}
      </div>
    </div>
  );
}

// Security Wrapper: Checks if user is authenticated and has the correct role
function ProtectedRoute({ children, requiredRole }) {
    const { user, userRole, loading } = useAuth();

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center font-bold text-slate-500">Authenticating & Verifying Roles...</div>;
    }

    if (!user) {
        window.location.href = '/login';
        return null;
    }

    if (requiredRole && userRole?.role !== requiredRole) {
        if (requiredRole === 'ADMIN' && userRole?.role === 'SYSTEM_ADMIN') {
            // Allow SYSTEM_ADMIN to access ADMIN routes
        } else {
            return (
            <div className="min-h-screen flex flex-col items-center justify-center font-sans text-center px-4">
                <h1 className="text-4xl font-black text-slate-800 mb-2">403 Forbidden</h1>
                <p className="text-slate-500 mb-6">You are logged in, but you do not have {requiredRole} privileges.</p>
                <a href="/" className="text-sky-600 font-bold hover:underline">&larr; Go Home</a>
            </div>
        );
        }
    }

    return children;
}

function MainApp() {
  const [currentRoute, setCurrentRoute] = useState(window.location.pathname);

  useEffect(() => {
    const handleLocationChange = () => setCurrentRoute(window.location.pathname);
    window.addEventListener('popstate', handleLocationChange);
    
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.get('pwa') === 'true') {
        window.history.replaceState(null, '', '/routes');
        setCurrentRoute('/routes');
    }

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

  if (currentRoute === '/admin/report' || currentRoute === '/report') {
    return <ProtectedRoute requiredRole="ADMIN"><AdminReport /></ProtectedRoute>;
  }

  if (currentRoute === '/admin/sandbox') {
    return <Sandbox />;
  }

  if (currentRoute === '/driver') {
    return <ProtectedRoute requiredRole="DRIVER"><DriverPortal /></ProtectedRoute>;
  }

  if (currentRoute === '/admin' || currentRoute === '/roster' || currentRoute === '/operations') {
    return <ProtectedRoute requiredRole="ADMIN"><AdminDashboard /></ProtectedRoute>;
  }

  if (currentRoute === '/sadmin') {
    return <SuperAdminRoute><SuperAdminDashboard /></SuperAdminRoute>;
  }

  // Fallback to landing page for unknown routes
  return <LandingPage />;
}

const SuperAdminRoute = ({ children }) => {
  const { user, userRole, loading } = useAuth();
  
  if (loading) return <div className="h-screen flex items-center justify-center font-bold text-slate-500">Checking System Clearance...</div>;
  if (!user) {
      window.location.href = '/login';
      return null;
  }
  if (userRole?.role !== 'SYSTEM_ADMIN') {
      window.location.href = '/';
      return null;
  }
  
  return children;
};

function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}

export default App;
