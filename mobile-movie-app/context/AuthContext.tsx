/**
 * AuthContext — lightweight email-based session.
 * No Appwrite needed. Email is stored in AsyncStorage after
 * the user pays for a movie (OTP verified on our PHP backend).
 * Login/register screens still work but are optional.
 */
import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const SESSION_KEY = "elite_user_email";
const SESSION_NAME_KEY = "elite_user_name";

interface User {
    $id: string;   // we use email as the ID
    email: string;
    name: string;
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
    setSessionEmail: (email: string, name?: string) => Promise<void>;
    logout: () => Promise<void>;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    userProfile: null,
    loading: true,
    isAuthenticated: false,
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

    const buildUserFromEmail = (email: string, name?: string): User => ({
        $id:   email,
        email: email,
        name:  name || email.split("@")[0],
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
            if (email) {
                setUser(buildUserFromEmail(email, name));
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
    const setSessionEmail = async (email: string, name?: string) => {
        const lc = email.toLowerCase();
        await AsyncStorage.setItem(SESSION_KEY, lc);
        if (name) await AsyncStorage.setItem(SESSION_NAME_KEY, name);
        setUser(buildUserFromEmail(lc, name));
        setUserProfile(buildProfile(lc, name));
    };

    const logout = async () => {
        await AsyncStorage.removeItem(SESSION_KEY);
        await AsyncStorage.removeItem(SESSION_NAME_KEY);
        setUser(null);
        setUserProfile(null);
    };

    const refreshUser = async () => { await loadUser(); };

    return (
        <AuthContext.Provider value={{
            user, userProfile, loading,
            isAuthenticated: !!user,
            setSessionEmail, logout, refreshUser,
        }}>
            {children}
        </AuthContext.Provider>
    );
};
