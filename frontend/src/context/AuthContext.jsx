import React, { createContext, useContext, useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [userRole, setUserRole] = useState(null); // e.g., 'ADMIN' or 'DRIVER'
    const [loading, setLoading] = useState(true);

    const fetchRole = async (userId, userEmail) => {
        const { data, error } = await supabase
            .from('user_roles')
            .select('role, tenant_id')
            .eq('user_id', userId)
            .single();
        
        let finalRole = data || { role: null, tenant_id: null };
        
        // Secure Role check from Supabase
        if (finalRole.role === 'SYSTEM_ADMIN') {
            finalRole.isSystemAdmin = true;
            localStorage.setItem('isSystemAdmin', 'true');
        } else {
            localStorage.setItem('isSystemAdmin', 'false');
        }
        
        setUserRole(finalRole.role ? finalRole : null);
    };

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
            if (session?.user) fetchRole(session.user.id, session.user.email);
            setLoading(false);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
            if (session?.user) {
                fetchRole(session.user.id, session.user.email);
            } else {
                setUserRole(null);
                localStorage.removeItem('isSystemAdmin');
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const signInWithOtp = async (email) => {
        const { error } = await supabase.auth.signInWithOtp({
            email,
            options: {
                // This prevents it from sending a Magic Link URL and strictly sends a 6-digit OTP code
                shouldCreateUser: false,
            }
        });
        return { error };
    };

    const verifyOtp = async (email, token) => {
        const { data, error } = await supabase.auth.verifyOtp({
            email,
            token,
            type: 'email'
        });
        return { data, error };
    };

    const signOut = () => supabase.auth.signOut();

    return (
        <AuthContext.Provider value={{ user, userRole, signInWithOtp, verifyOtp, signOut, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    return useContext(AuthContext);
};
