import React, { createContext, useContext, useState, useEffect } from "react";
import { getCurrentUser, signOut, getUserProfile } from "@/services/appwrite";

interface User {
    $id: string;
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
    logout: () => Promise<void>;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    userProfile: null,
    loading: true,
    isAuthenticated: false,
    logout: async () => {},
    refreshUser: async () => {},
});

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    const loadUser = async () => {
        try {
            const currentUser = await getCurrentUser();
            if (currentUser) {
                setUser(currentUser as User);
                // Load user profile
                const profile = await getUserProfile(currentUser.$id);
                if (profile) {
                    setUserProfile(profile as unknown as UserProfile);
                }
            } else {
                setUser(null);
                setUserProfile(null);
            }
        } catch (error) {
            console.error("Error loading user:", error);
            setUser(null);
            setUserProfile(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadUser();
    }, []);

    const logout = async () => {
        try {
            await signOut();
            setUser(null);
            setUserProfile(null);
        } catch (error) {
            console.error("Error logging out:", error);
            throw error;
        }
    };

    const refreshUser = async () => {
        await loadUser();
    };

    const value = {
        user,
        userProfile,
        loading,
        isAuthenticated: !!user,
        logout,
        refreshUser,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
