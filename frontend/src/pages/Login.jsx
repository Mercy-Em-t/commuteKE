import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

function Login() {
    const { signInWithOtp, verifyOtp } = useAuth();
    const [email, setEmail] = useState('');
    const [token, setToken] = useState('');
    const [step, setStep] = useState('email'); // 'email' or 'otp'
    const [status, setStatus] = useState(''); // 'loading', 'error'
    const [message, setMessage] = useState('');

    const handleSendOtp = async (e) => {
        e.preventDefault();
        setStatus('loading');
        setMessage('');
        const { error } = await signInWithOtp(email);
        
        if (error) {
            setStatus('error');
            setMessage(error.message);
        } else {
            setStatus('');
            setStep('otp');
            setMessage('OTP sent! Check your email.');
        }
    };

    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        setStatus('loading');
        setMessage('');
        const { error } = await verifyOtp(email, token);
        
        if (error) {
            setStatus('error');
            setMessage(error.message);
        } else {
            setStatus('success');
            setMessage('Success! Redirecting...');
            window.location.href = '/admin'; // Force redirect to the secure portal
        }
    };

    return (
        <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 font-sans">
            <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 border border-slate-200">
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-black text-slate-800">Sacco Login</h1>
                    <p className="text-slate-500 text-sm mt-1">Authorized Admins and Drivers only.</p>
                </div>

                {message && (
                    <div className={`p-3 rounded-lg text-sm font-semibold mb-6 text-center ${status === 'error' ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
                        {message}
                    </div>
                )}

                {step === 'email' ? (
                    <form onSubmit={handleSendOtp} className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Email Address</label>
                            <input 
                                type="email" 
                                required 
                                value={email} 
                                onChange={e => setEmail(e.target.value)}
                                className="w-full border-slate-300 rounded-xl p-3 bg-slate-50 border focus:border-sky-500 focus:ring-1 focus:ring-sky-500" 
                                placeholder="driver@example.com"
                            />
                        </div>
                        <button 
                            type="submit" 
                            disabled={status === 'loading'}
                            className="w-full bg-slate-900 text-white font-bold py-3.5 rounded-xl hover:bg-slate-800 transition-all disabled:opacity-50"
                        >
                            {status === 'loading' ? 'Sending...' : 'Send Secure OTP'}
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleVerifyOtp} className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Enter Secure Code</label>
                            <input 
                                type="text" 
                                required 
                                value={token} 
                                onChange={e => setToken(e.target.value)}
                                className="w-full border-slate-300 rounded-xl p-3 bg-slate-50 border focus:border-sky-500 focus:ring-1 focus:ring-sky-500 text-center text-2xl tracking-widest font-black" 
                                placeholder="Token"
                            />
                        </div>
                        <button 
                            type="submit" 
                            disabled={status === 'loading'}
                            className="w-full bg-amber-500 text-slate-900 font-black py-3.5 rounded-xl hover:bg-amber-400 transition-all shadow-md disabled:opacity-50"
                        >
                            {status === 'loading' ? 'Verifying...' : 'Login'}
                        </button>
                        <button 
                            type="button" 
                            onClick={() => { setStep('email'); setToken(''); setMessage(''); }}
                            className="w-full text-slate-500 text-sm font-semibold hover:text-slate-800 transition-colors"
                        >
                            &larr; Use a different email
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}

export default Login;
