/**
 * AuthContext — lightweight email-based session.
 * No Appwrite needed. Email is stored in AsyncStorage after
 * the user pays for a movie (OTP verified on our PHP backend).
 * Login/register screens still work but are optional.
 */
import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const SESSION_KEY     = "elite_user_email";
const SESSION_NAME_KEY = "elite_user_name";
const SESSION_VIP_KEY  = "elite_user_vip";

// ── VIP account — bypasses all payments ──────────────────────────────────────
export const VIP_EMAIL    = "admin@elitemovies.com";
export const VIP_PASSWORD = "EliteVIP2024!";
// ─────────────────────────────────────────────────────────────────────────────

interface User {
    $id: string;   // we use email as the ID
    email: string;
    name: string;
    isVip: boolean;
}

interface UserProfile {
    userId: string;
    email: string;
    name: string;
    avatar: string;
}

interface AuthContextType {
    user: User | null;
    userProfile: UserProfile | null;
    loading: boolean;
    isAuthenticated: boolean;
    isVip: boolean;
    setSessionEmail: (email: string, name?: string, vip?: boolean) => Promise<void>;
    logout: () => Promise<void>;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    userProfile: null,
    loading: true,
    isAuthenticated: false,
    isVip: false,
    setSessionEmail: async () => {},
    logout: async () => {},
    refreshUser: async () => {},
});

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error("useAuth must be used within an AuthProvider");
    return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser]               = useState<User | null>(null);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading]         = useState(true);

    const buildUserFromEmail = (email: string, name?: string, vip = false): User => ({
        $id:   email,
        email: email,
        name:  name || email.split("@")[0],
        isVip: vip,
    });

    const buildProfile = (email: string, name?: string): UserProfile => ({
        userId: email,
        email,
        name:   name || email.split("@")[0],
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(
            name || email.split("@")[0]
        )}&background=D4AF37&color=000&bold=true`,
    });

    const loadUser = async () => {
        try {
            const email = await AsyncStorage.getItem(SESSION_KEY);
            const name  = await AsyncStorage.getItem(SESSION_NAME_KEY) ?? undefined;
            const vip   = (await AsyncStorage.getItem(SESSION_VIP_KEY)) === "1";
            if (email) {
                setUser(buildUserFromEmail(email, name, vip));
                setUserProfile(buildProfile(email, name));
            }
        } catch (e) {
            // ignore storage errors
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadUser(); }, []);

    /** Called after OTP payment verification — stores email as session */
    const setSessionEmail = async (email: string, name?: string, vip = false) => {
        const lc = email.toLowerCase();
        await AsyncStorage.setItem(SESSION_KEY, lc);
        if (name) await AsyncStorage.setItem(SESSION_NAME_KEY, name);
        await AsyncStorage.setItem(SESSION_VIP_KEY, vip ? "1" : "0");
        setUser(buildUserFromEmail(lc, name, vip));
        setUserProfile(buildProfile(lc, name));
    };

    const logout = async () => {
        await AsyncStorage.removeItem(SESSION_KEY);
        await AsyncStorage.removeItem(SESSION_NAME_KEY);
        await AsyncStorage.removeItem(SESSION_VIP_KEY);
        setUser(null);
        setUserProfile(null);
    };

    const refreshUser = async () => { await loadUser(); };

    return (
        <AuthContext.Provider value={{
            user, userProfile, loading,
            isAuthenticated: !!user,
            isVip: user?.isVip ?? false,
            setSessionEmail, logout, refreshUser,
        }}>
            {children}
        </AuthContext.Provider>
    );
};
