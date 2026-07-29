import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';

const API = import.meta.env.DEV ? 'http://127.0.0.1:8001' : '';

const TABS = ['saccos', 'identities', 'inquiries'];

// ─── Utility ────────────────────────────────────────────────────────────────
const Badge = ({ status }) => {
    const styles = {
        ACTIVE:    'bg-emerald-900/50 text-emerald-400 border border-emerald-700',
        PENDING:   'bg-amber-900/50 text-amber-400 border border-amber-700',
        SUSPENDED: 'bg-red-900/50 text-red-400 border border-red-700',
        SYSTEM_ADMIN: 'bg-rose-900/50 text-rose-400 border border-rose-800',
        ADMIN:     'bg-amber-900/50 text-amber-400 border border-amber-800',
        DRIVER:    'bg-sky-900/50 text-sky-400 border border-sky-800',
    };
    return (
        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest ${styles[status] ?? 'bg-slate-700 text-slate-300'}`}>
            {status}
        </span>
    );
};

// ─── SACCO Form ──────────────────────────────────────────────────────────────
const Field = ({ label, name, type = 'text', placeholder = '', value, onChange }) => (
    <div>
        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">{label}</label>
        <input
            type={type} value={value} onChange={onChange}
            placeholder={placeholder}
            className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2.5 text-white text-sm focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-none transition-all"
        />
    </div>
);

function SaccoForm({ onSuccess }) {
    const [form, setForm] = useState({
        name: '', registration_number: '', chairman_name: '',
        contact_email: '', contact_phone: '',
        base_region: '', primary_route: '', fleet_count: 0, notes: ''
    });
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState(null);

    const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMsg(null);
        try {
            const res = await fetch(`${API}/api/v1/saccos`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...form, fleet_count: Number(form.fleet_count) })
            });
            const data = await res.json();
            if (data.status === 'success' || data.status === 'mock') {
                setMsg({ ok: true, text: data.message });
                setForm({ name: '', registration_number: '', chairman_name: '', contact_email: '', contact_phone: '', base_region: '', primary_route: '', fleet_count: 0, notes: '' });
                onSuccess?.();
            } else {
                setMsg({ ok: false, text: data.message || 'Unknown error.' });
            }
        } catch (err) {
            setMsg({ ok: false, text: 'Network error — could not reach API.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="SACCO Name" name="name" value={form.name} onChange={set('name')} placeholder="e.g. Kiungani Shuttle Sacco" />
                <Field label="Reg. Number" name="registration_number" value={form.registration_number} onChange={set('registration_number')} placeholder="NTSA/SACCO/2024/001" />
                <Field label="Chairman Name" name="chairman_name" value={form.chairman_name} onChange={set('chairman_name')} placeholder="Full name" />
                <Field label="Contact Email" name="contact_email" type="email" value={form.contact_email} onChange={set('contact_email')} placeholder="sacco@example.com" />
                <Field label="Contact Phone" name="contact_phone" value={form.contact_phone} onChange={set('contact_phone')} placeholder="+254 7XX XXX XXX" />
                <Field label="Fleet Count" name="fleet_count" type="number" value={form.fleet_count} onChange={set('fleet_count')} placeholder="14" />
                <Field label="Base Region" name="base_region" value={form.base_region} onChange={set('base_region')} placeholder="e.g. Kiambu County" />
                <Field label="Primary Route" name="primary_route" value={form.primary_route} onChange={set('primary_route')} placeholder="e.g. Kiungani → CBD" />
            </div>
            <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">Notes</label>
                <textarea
                    rows={3} value={form.notes} onChange={set('notes')}
                    placeholder="Any additional notes about this SACCO..."
                    className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2.5 text-white text-sm focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-none transition-all resize-none"
                />
            </div>
            {msg && (
                <p className={`text-sm font-semibold ${msg.ok ? 'text-emerald-400' : 'text-red-400'}`}>{msg.text}</p>
            )}
            <button
                type="submit" disabled={loading}
                className="w-full bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-black py-3 rounded-xl uppercase tracking-widest text-sm transition-all shadow-lg shadow-rose-900/30"
            >
                {loading ? 'Creating…' : 'Register SACCO'}
            </button>
        </form>
    );
}

// ─── Broadcast Modal ─────────────────────────────────────────────────────────
function BroadcastModal({ sacco, onClose }) {
    const [form, setForm] = useState({ title: '', body: '' });
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);

    const handleSend = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch(`${API}/api/v1/saccos/broadcast`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sacco_id: sacco.id, ...form })
            });
            const data = await res.json();
            setResult(data);
        } catch {
            setResult({ status: 'error', message: 'Network error.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 w-full max-w-md shadow-2xl">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-black text-white">📡 Broadcast to Subscribers</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-white text-xl">✕</button>
                </div>
                <p className="text-slate-400 text-sm mb-4">Sending to all subscribers of <span className="text-white font-bold">{sacco.name}</span></p>
                {!result ? (
                    <form onSubmit={handleSend} className="space-y-4">
                        <div>
                            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">Title</label>
                            <input required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                                placeholder="e.g. Route Change Alert"
                                className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2.5 text-white text-sm outline-none focus:border-rose-500 transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">Message</label>
                            <textarea required rows={4} value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
                                placeholder="Message body for subscribers..."
                                className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2.5 text-white text-sm outline-none focus:border-rose-500 transition-all resize-none"
                            />
                        </div>
                        <button type="submit" disabled={loading}
                            className="w-full bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-black py-3 rounded-xl uppercase tracking-widest text-sm transition-all">
                            {loading ? 'Sending…' : '📡 Send Broadcast'}
                        </button>
                    </form>
                ) : (
                    <div className={`p-4 rounded-xl text-sm font-semibold ${result.status === 'success' ? 'bg-emerald-900/30 text-emerald-400' : 'bg-red-900/30 text-red-400'}`}>
                        {result.message}<br />
                        {result.notified !== undefined && <span className="font-black">{result.notified} subscriber(s) notified.</span>}
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── SACCO Tab ───────────────────────────────────────────────────────────────
function SaccoTab() {
    const [saccos, setSaccos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [broadcasting, setBroadcasting] = useState(null);

    const fetchSaccos = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API}/api/v1/saccos`);
            const data = await res.json();
            setSaccos(data.saccos || []);
        } catch {
            setSaccos([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchSaccos(); }, [fetchSaccos]);

    const updateStatus = async (sacco, newStatus) => {
        try {
            await fetch(`${API}/api/v1/saccos/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sacco_id: sacco.id, status: newStatus })
            });
            fetchSaccos();
        } catch { /* ignore */ }
    };

    return (
        <div>
            {broadcasting && <BroadcastModal sacco={broadcasting} onClose={() => setBroadcasting(null)} />}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-xl font-bold text-white">SACCO Registry</h2>
                    <p className="text-slate-400 text-sm mt-1">{saccos.length} SACCO{saccos.length !== 1 ? 's' : ''} registered</p>
                </div>
                <button onClick={() => setShowForm(v => !v)}
                    className="bg-rose-600 hover:bg-rose-500 text-white font-black px-4 py-2 rounded-xl text-sm uppercase tracking-widest transition-all">
                    {showForm ? '✕ Cancel' : '＋ Register SACCO'}
                </button>
            </div>

            {showForm && (
                <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 mb-6">
                    <h3 className="text-lg font-bold text-white mb-4 border-b border-slate-700 pb-3">New SACCO Registration</h3>
                    <SaccoForm onSuccess={() => { setShowForm(false); fetchSaccos(); }} />
                </div>
            )}

            {loading ? (
                <div className="space-y-3">
                    {[1, 2, 3].map(i => <div key={i} className="h-20 bg-slate-700/50 rounded-xl animate-pulse" />)}
                </div>
            ) : saccos.length === 0 ? (
                <div className="text-center py-16 text-slate-500">
                    <div className="text-5xl mb-4">🏛️</div>
                    <p className="font-bold">No SACCOs registered yet.</p>
                    <p className="text-sm mt-1">Click "Register SACCO" to onboard your first one.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {saccos.map(s => (
                        <div key={s.id} className="bg-slate-800 border border-slate-700 rounded-2xl p-5 hover:border-slate-600 transition-all">
                            <div className="flex flex-wrap justify-between items-start gap-3">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                                        <h3 className="font-black text-white text-lg">{s.name}</h3>
                                        <Badge status={s.status} />
                                    </div>
                                    <p className="text-slate-400 text-xs font-mono">{s.registration_number}</p>
                                    <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                                        {s.primary_route && <div><p className="text-slate-500 uppercase tracking-wider">Route</p><p className="text-slate-200 font-semibold mt-0.5">{s.primary_route}</p></div>}
                                        {s.base_region && <div><p className="text-slate-500 uppercase tracking-wider">Region</p><p className="text-slate-200 font-semibold mt-0.5">{s.base_region}</p></div>}
                                        {s.fleet_count > 0 && <div><p className="text-slate-500 uppercase tracking-wider">Fleet</p><p className="text-slate-200 font-semibold mt-0.5">{s.fleet_count} vehicles</p></div>}
                                        {s.chairman_name && <div><p className="text-slate-500 uppercase tracking-wider">Chairman</p><p className="text-slate-200 font-semibold mt-0.5">{s.chairman_name}</p></div>}
                                    </div>
                                </div>
                                <div className="flex flex-col gap-2 shrink-0">
                                    <button onClick={() => setBroadcasting(s)}
                                        className="bg-slate-700 hover:bg-rose-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-all">
                                        📡 Broadcast
                                    </button>
                                    {s.status !== 'ACTIVE' && (
                                        <button onClick={() => updateStatus(s, 'ACTIVE')}
                                            className="bg-emerald-800 hover:bg-emerald-700 text-emerald-300 text-xs font-bold px-3 py-1.5 rounded-lg transition-all">
                                            ✓ Activate
                                        </button>
                                    )}
                                    {s.status === 'ACTIVE' && (
                                        <button onClick={() => updateStatus(s, 'SUSPENDED')}
                                            className="bg-red-900/50 hover:bg-red-800 text-red-400 text-xs font-bold px-3 py-1.5 rounded-lg transition-all">
                                            ⊘ Suspend
                                        </button>
                                    )}
                                </div>
                            </div>
                            {s.notes && <p className="mt-3 pt-3 border-t border-slate-700 text-slate-400 text-xs">{s.notes}</p>}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// ─── Identities Tab ──────────────────────────────────────────────────────────
function IdentitiesTab() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('user_roles')
            .select('*')
            .order('created_at', { ascending: false });
        if (!error && data) setUsers(data);
        setLoading(false);
    }, []);

    useEffect(() => { fetchUsers(); }, [fetchUsers]);

    const handleProvision = async (e) => {
        e.preventDefault();
        const email = e.target.email.value;
        const role = e.target.role.value;
        try {
            const res = await fetch(`${API}/api/v1/admin/provision`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, role, tenant_id: 'kiungani-01' })
            });
            const result = await res.json();
            alert(result.message);
            e.target.reset();
            fetchUsers();
        } catch {
            alert('Failed to connect to provisioning server.');
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 bg-slate-800 rounded-2xl p-6 border border-slate-700">
                <h2 className="text-xl font-bold text-white mb-6 border-b border-slate-700 pb-4">Provision Identity</h2>
                <form onSubmit={handleProvision} className="space-y-5">
                    <div>
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">Email</label>
                        <input name="email" type="email" required
                            className="w-full bg-slate-900 border border-slate-600 rounded-xl p-3 text-white text-sm focus:border-rose-500 outline-none transition-all"
                            placeholder="target@sacco.com" />
                    </div>
                    <div>
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">Role</label>
                        <div className="space-y-2">
                            {[
                                { value: 'ADMIN', label: 'Administrator', desc: 'Operations dashboard access' },
                                { value: 'DRIVER', label: 'Driver', desc: 'Driver portal + GPS streaming' },
                            ].map(r => (
                                <label key={r.value} className="cursor-pointer block">
                                    <input type="radio" name="role" value={r.value} defaultChecked={r.value === 'ADMIN'} className="peer sr-only" />
                                    <div className="p-3 rounded-xl border-2 border-slate-600 bg-slate-900 hover:bg-slate-700 peer-checked:border-rose-500 peer-checked:bg-rose-950/30 transition-all">
                                        <p className="font-bold text-white text-sm">{r.label}</p>
                                        <p className="text-xs text-slate-400 mt-0.5">{r.desc}</p>
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>
                    <button type="submit"
                        className="w-full bg-rose-600 hover:bg-rose-500 text-white font-black py-3 rounded-xl uppercase tracking-widest text-sm transition-all">
                        Execute Provisioning
                    </button>
                </form>
            </div>
            <div className="lg:col-span-2 bg-slate-800 rounded-2xl p-6 border border-slate-700">
                <h2 className="text-xl font-bold text-white mb-6 border-b border-slate-700 pb-4">Active Identities <span className="text-slate-500 font-normal text-sm">({users.length})</span></h2>
                {loading ? (
                    <div className="space-y-3 animate-pulse">{[1,2,3].map(i => <div key={i} className="h-12 bg-slate-700 rounded-lg" />)}</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead><tr className="border-b border-slate-700">
                                <th className="pb-3 text-xs font-black text-slate-400 uppercase tracking-widest">User ID</th>
                                <th className="pb-3 text-xs font-black text-slate-400 uppercase tracking-widest">Role</th>
                                <th className="pb-3 text-xs font-black text-slate-400 uppercase tracking-widest">Tenant</th>
                                <th className="pb-3 text-xs font-black text-slate-400 uppercase tracking-widest">Created</th>
                            </tr></thead>
                            <tbody className="divide-y divide-slate-700">
                                {users.length === 0 && <tr><td colSpan={4} className="py-8 text-center text-slate-500">No identities found.</td></tr>}
                                {users.map(u => (
                                    <tr key={u.id} className="hover:bg-slate-700/40 transition-colors">
                                        <td className="py-3 font-mono text-slate-300 text-xs">{u.user_id?.substring(0, 8)}…</td>
                                        <td className="py-3"><Badge status={u.role} /></td>
                                        <td className="py-3 text-slate-300 font-semibold text-xs">{u.tenant_id}</td>
                                        <td className="py-3 text-slate-500 text-xs">{new Date(u.created_at).toLocaleDateString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── Inquiries Tab ────────────────────────────────────────────────────────────
function InquiriesTab() {
    const [inquiries, setInquiries] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fetch from Supabase inquiries table if it exists, else show notice
        const fetchInquiries = async () => {
            const { data, error } = await supabase
                .from('inquiries')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(50);
            if (!error && data) setInquiries(data);
            setLoading(false);
        };
        fetchInquiries().catch(() => setLoading(false));
    }, []);

    return (
        <div>
            <div className="mb-6">
                <h2 className="text-xl font-bold text-white">Inquiry Inbox</h2>
                <p className="text-slate-400 text-sm mt-1">Inquiries submitted via the landing page form</p>
            </div>
            {loading ? (
                <div className="space-y-3 animate-pulse">{[1,2,3].map(i => <div key={i} className="h-20 bg-slate-700/50 rounded-xl" />)}</div>
            ) : inquiries.length === 0 ? (
                <div className="text-center py-16 text-slate-500">
                    <div className="text-5xl mb-4">📭</div>
                    <p className="font-bold">No inquiries yet.</p>
                    <p className="text-sm mt-1">Inquiries also log to <span className="font-mono text-slate-400">/tmp/inquiries.jsonl</span> on the server as a fallback.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {inquiries.map(inq => (
                        <div key={inq.id} className="bg-slate-800 border border-slate-700 rounded-2xl p-5 hover:border-slate-600 transition-all">
                            <div className="flex justify-between items-start flex-wrap gap-2 mb-2">
                                <div>
                                    <p className="font-bold text-white">{inq.name} <span className="text-slate-400 font-normal text-sm">— {inq.email}</span></p>
                                    <Badge status={inq.type || 'GENERAL'} />
                                </div>
                                <p className="text-slate-500 text-xs">{new Date(inq.created_at).toLocaleString()}</p>
                            </div>
                            <p className="text-slate-300 text-sm mt-2 leading-relaxed">{inq.message}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// ─── Main Dashboard ──────────────────────────────────────────────────────────
function SuperAdminDashboard() {
    const { signOut } = useAuth();
    const [tab, setTab] = useState('saccos');
    const [eggCount, setEggCount] = useState(0);
    const [eggActive, setEggActive] = useState(false);

    const handleLogoClick = () => {
        const next = eggCount + 1;
        if (next >= 5) {
            setEggActive(true);
            setEggCount(0);
        } else {
            setEggCount(next);
        }
    };

    const tabLabel = { saccos: '🏛️ SACCOs', identities: '🛡️ Identities', inquiries: '📬 Inquiries' };

    return (
        <div className="min-h-screen bg-slate-900 font-sans text-slate-100">
            {/* Header */}
            <header className="border-b border-slate-800 px-6 py-4 flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-black text-white flex items-center gap-2">
                        <button
                            onClick={handleLogoClick}
                            className="text-rose-500 hover:scale-110 transition-transform select-none cursor-pointer bg-transparent border-none p-0"
                            title={eggCount > 0 ? `${5 - eggCount} more...` : undefined}
                        >◈</button> SYSTEM CONSOLE
                    </h1>
                    <p className="text-slate-500 text-xs font-mono mt-0.5">TM Savannah · Privileged Access</p>
                </div>
                <button onClick={signOut}
                    className="text-slate-400 hover:text-red-400 text-sm font-bold transition-colors">
                    Sign Out →
                </button>
            </header>

            {/* Easter Egg Panel */}
            {eggActive && (
                <div className="mx-6 mt-4 bg-black border border-rose-900 rounded-xl p-4 font-mono text-xs animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="flex justify-between items-start mb-3">
                        <p className="text-rose-500 font-black tracking-widest uppercase">⚠ GOD MODE UNLOCKED</p>
                        <button onClick={() => setEggActive(false)} className="text-slate-600 hover:text-slate-300">✕</button>
                    </div>
                    <p className="text-emerald-400 mb-1">$ whoami</p>
                    <p className="text-slate-300 mb-3">root@tmsavannah.com — clearance level OMEGA</p>
                    <p className="text-emerald-400 mb-1">$ ls /hidden</p>
                    <p className="text-slate-300 mb-4">TransitOS_Sandbox  telemetry_stream  persona_switcher</p>
                    <a href="/admin/sandbox" target="_blank"
                        className="inline-block bg-rose-950 hover:bg-rose-900 border border-rose-800 text-rose-400 font-black px-4 py-2 rounded-lg transition-all tracking-widest uppercase text-[10px]">
                        ▶ Launch TransitOS Sandbox
                    </a>
                </div>
            )}

            {/* Tab Bar */}
            <div className="border-b border-slate-800 px-6">
                <div className="flex gap-1">
                    {TABS.map(t => (
                        <button key={t} onClick={() => setTab(t)}
                            className={`px-4 py-3 text-sm font-bold transition-all border-b-2 ${
                                tab === t
                                    ? 'border-rose-500 text-white'
                                    : 'border-transparent text-slate-500 hover:text-slate-300'
                            }`}>
                            {tabLabel[t]}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content */}
            <main className="p-6 max-w-6xl mx-auto">
                {tab === 'saccos'      && <SaccoTab />}
                {tab === 'identities' && <IdentitiesTab />}
                {tab === 'inquiries'  && <InquiriesTab />}
            </main>
        </div>
    );
}

export default SuperAdminDashboard;
