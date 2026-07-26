import React, { useState, useEffect } from 'react';
import { supabase } from '../context/AuthContext';

function SuperAdminDashboard() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        // Query the user_roles table
        const { data, error } = await supabase
            .from('user_roles')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (!error && data) {
            setUsers(data);
        }
        setLoading(false);
    };

    const handleProvision = async (e) => {
        e.preventDefault();
        const email = e.target.email.value;
        const role = e.target.role.value;
        alert(`Provisioning request sent for ${email} as ${role}. Awaiting telemetry validation...`);
        
        try {
            const response = await fetch('http://127.0.0.1:8001/api/v1/admin/provision', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, role, tenant_id: 'kiungani-01' })
            });
            const result = await response.json();
            alert(result.message);
            e.target.reset();
            fetchUsers(); // Refresh the list
        } catch (err) {
            alert("Failed to connect to provisioning server.");
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 font-sans p-6 text-slate-100">
            <header className="mb-8">
                <h1 className="text-3xl font-black text-white flex items-center gap-3">
                    <span className="text-rose-500">🛡️</span> SYSTEM_ADMIN CONSOLE
                </h1>
                <p className="text-slate-400 mt-2 font-mono text-sm">Privileged Identity Management Engine</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Provisioning Form */}
                <div className="lg:col-span-1 bg-slate-800 rounded-2xl p-6 border border-slate-700 shadow-2xl">
                    <h2 className="text-xl font-bold text-white mb-6 border-b border-slate-700 pb-4">Provision New Identity</h2>
                    <form onSubmit={handleProvision} className="space-y-6">
                        <div>
                            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Email Address</label>
                            <input name="email" type="email" required className="w-full border-slate-600 rounded-xl p-3 bg-slate-900 text-white border focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-all font-medium" placeholder="target.email@sacco.com" />
                        </div>
                        
                        <div>
                            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">System Role</label>
                            <div className="grid grid-cols-1 gap-3">
                                <label className="cursor-pointer">
                                    <input type="radio" name="role" value="ADMIN" className="peer sr-only" defaultChecked />
                                    <div className="p-3 rounded-xl border-2 border-slate-600 bg-slate-900 hover:bg-slate-700 peer-checked:border-rose-500 peer-checked:bg-rose-950/30 transition-all">
                                        <p className="font-bold text-white">Administrator</p>
                                        <p className="text-xs text-slate-400 mt-1">Full access to Operations Dashboard.</p>
                                    </div>
                                </label>
                                <label className="cursor-pointer">
                                    <input type="radio" name="role" value="DRIVER" className="peer sr-only" />
                                    <div className="p-3 rounded-xl border-2 border-slate-600 bg-slate-900 hover:bg-slate-700 peer-checked:border-sky-500 peer-checked:bg-sky-950/30 transition-all">
                                        <p className="font-bold text-white">Driver</p>
                                        <p className="text-xs text-slate-400 mt-1">Access to Driver Portal and GPS streaming.</p>
                                    </div>
                                </label>
                            </div>
                        </div>

                        <button type="submit" className="w-full bg-rose-600 text-white font-black text-lg py-4 rounded-xl hover:bg-rose-500 shadow-lg shadow-rose-600/20 transition-all uppercase tracking-widest text-sm">
                            Execute Provisioning
                        </button>
                    </form>
                </div>

                {/* Identity Roster */}
                <div className="lg:col-span-2 bg-slate-800 rounded-2xl p-6 border border-slate-700 shadow-2xl">
                    <h2 className="text-xl font-bold text-white mb-6 border-b border-slate-700 pb-4">Active Identities</h2>
                    
                    {loading ? (
                        <div className="animate-pulse flex space-x-4">
                            <div className="flex-1 space-y-4 py-1">
                                <div className="h-4 bg-slate-700 rounded w-3/4"></div>
                                <div className="h-4 bg-slate-700 rounded"></div>
                                <div className="h-4 bg-slate-700 rounded w-5/6"></div>
                            </div>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-slate-700">
                                        <th className="pb-3 text-xs font-black text-slate-400 uppercase tracking-widest">User ID (UUID)</th>
                                        <th className="pb-3 text-xs font-black text-slate-400 uppercase tracking-widest">Role</th>
                                        <th className="pb-3 text-xs font-black text-slate-400 uppercase tracking-widest">Tenant</th>
                                        <th className="pb-3 text-xs font-black text-slate-400 uppercase tracking-widest">Created</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-700">
                                    {users.map(user => (
                                        <tr key={user.id} className="hover:bg-slate-700/50 transition-colors">
                                            <td className="py-4 text-sm font-mono text-slate-300">{user.user_id.substring(0, 8)}...</td>
                                            <td className="py-4">
                                                <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest ${
                                                    user.role === 'SYSTEM_ADMIN' ? 'bg-rose-900/50 text-rose-400 border border-rose-800' :
                                                    user.role === 'ADMIN' ? 'bg-amber-900/50 text-amber-400 border border-amber-800' :
                                                    'bg-sky-900/50 text-sky-400 border border-sky-800'
                                                }`}>
                                                    {user.role}
                                                </span>
                                            </td>
                                            <td className="py-4 text-sm font-bold text-slate-300">{user.tenant_id}</td>
                                            <td className="py-4 text-xs text-slate-500 font-medium">
                                                {new Date(user.created_at).toLocaleDateString()}
                                            </td>
                                        </tr>
                                    ))}
                                    {users.length === 0 && (
                                        <tr>
                                            <td colSpan="4" className="py-8 text-center text-slate-500 font-medium">
                                                No identities found in database.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default SuperAdminDashboard;
