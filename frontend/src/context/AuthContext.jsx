import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [userRole, setUserRole] = useState(null); // e.g., 'ADMIN' or 'DRIVER'
    const [loading, setLoading] = useState(true);

    const fetchRole = async (userId) => {
        const { data, error } = await supabase
            .from('user_roles')
            .select('role, tenant_id')
            .eq('user_id', userId)
            .single();
        
        let finalRole = data || { role: null, tenant_id: null };
        
        if (finalRole.role === 'SYSTEM_ADMIN') {
            finalRole.isSystemAdmin = true;
            localStorage.setItem('isSystemAdmin', 'true');
        } else {
            localStorage.setItem('isSystemAdmin', 'false');
        }

        // Store role so Login redirect can use it without waiting
        localStorage.setItem('userRole', finalRole.role || '');
        
        setUserRole(finalRole.role ? finalRole : null);
        setLoading(false); // ← must come AFTER role is known
    };

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
            if (session?.user) {
                fetchRole(session.user.id); // loading stays true until fetchRole finishes
            } else {
                setLoading(false); // no user — nothing to fetch
            }
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
            if (session?.user) {
                fetchRole(session.user.id);
            } else {
                setUserRole(null);
                localStorage.removeItem('isSystemAdmin');
                localStorage.removeItem('userRole');
                setLoading(false);
            }
        });

        return () => subscription.unsubscribe();
    }, []);


    const signInWithOtp = async (email) => {
        const { error } = await supabase.auth.signInWithOtp({
            email
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
