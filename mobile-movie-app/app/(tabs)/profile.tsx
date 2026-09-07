import {
    View, Text, Image, TouchableOpacity, Alert,
    ScrollView, StyleSheet, Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "expo-router";
import { useState, useEffect } from "react";
import { getFavorites } from "@/services/appwrite";
import { icons } from "@/constants/icons";

const { width } = Dimensions.get("window");
const GOLD = "#D4AF37";
const BG = "#09090F";
const CARD = "#1C1B2E";

const Profile = () => {
    const { user, userProfile, logout, isAuthenticated } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [savedCount, setSavedCount] = useState(0);

    useEffect(() => {
        if (user) {
            getFavorites(user.$id).then(f => setSavedCount(f.length)).catch(() => {});
        }
    }, [user]);

    const handleLogout = () => {
        Alert.alert("Sign Out", "Are you sure you want to sign out?", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Sign Out", style: "destructive",
                onPress: async () => {
                    setLoading(true);
                    try {
                        await logout();
                        router.replace("/onboarding");
                    } catch {
                        Alert.alert("Error", "Failed to sign out");
                    } finally {
                        setLoading(false);
                    }
                },
            },
        ]);
    };

    const avatarUri = userProfile?.avatar ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || "Guest")}&background=D4AF37&color=000&bold=true`;

    return (
        <View style={S.root}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
                {/* ── Gold Header ── */}
                <View style={S.headerBg}>
                    <View style={S.headerContent}>
                        <View style={S.brandRow}>
                            <Image source={icons.logo} style={S.logoImg} resizeMode="contain" />
                            <Text style={S.brandText}>ELITE MOVIES</Text>
                        </View>
                        <Text style={S.screenTitle}>My Profile</Text>
                    </View>
                </View>

                {/* ── Avatar Card ── */}
                <View style={S.avatarCard}>
                    <View style={S.avatarRing}>
                        <Image source={{ uri: avatarUri }} style={S.avatar} />
                    </View>
                    <Text style={S.userName}>{user?.name || "Guest User"}</Text>
                    <Text style={S.userEmail}>{user?.email || "Not signed in"}</Text>
                    {isAuthenticated && (
                        <View style={S.memberBadge}>
                            <Text style={S.memberBadgeText}>✦ ELITE MEMBER</Text>
                        </View>
                    )}
                </View>

                {/* ── Stats ── */}
                <View style={S.statsCard}>
                    {[
                        { label: "Watched", value: "0", icon: "👁" },
                        { label: "Saved", value: savedCount.toString(), icon: "🔖" },
                        { label: "Reviews", value: "0", icon: "✍️" },
                    ].map((s, i) => (
                        <View key={s.label} style={[S.statItem, i < 2 && S.statBorder]}>
                            <Text style={S.statIcon}>{s.icon}</Text>
                            <Text style={S.statValue}>{s.value}</Text>
                            <Text style={S.statLabel}>{s.label}</Text>
                        </View>
                    ))}
                </View>

                {/* ── Menu ── */}
                <View style={S.menuCard}>
                    {[
                        { icon: "🔖", label: "My Saved Movies", value: `${savedCount} movies`, onPress: () => router.push("/(tabs)/saved") },
                        { icon: "⚙️", label: "Settings", value: "", onPress: () => {} },
                        { icon: "🎬", label: "Watch History", value: "Coming soon", onPress: () => {} },
                        { icon: "💬", label: "Rate the App", value: "", onPress: () => {} },
                    ].map((item, i) => (
                        <TouchableOpacity
                            key={item.label}
                            style={[S.menuItem, i < 3 && S.menuBorder]}
                            onPress={item.onPress}
                        >
                            <Text style={S.menuIcon}>{item.icon}</Text>
                            <Text style={S.menuLabel}>{item.label}</Text>
                            <View style={S.menuRight}>
                                {!!item.value && <Text style={S.menuValue}>{item.value}</Text>}
                                <Text style={S.menuArrow}>›</Text>
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* ── Auth Buttons ── */}
                {isAuthenticated ? (
                    <TouchableOpacity
                        style={[S.signOutBtn, loading && S.btnDisabled]}
                        onPress={handleLogout}
                        disabled={loading}
                    >
                        <Text style={S.signOutText}>{loading ? "Signing out..." : "Sign Out"}</Text>
                    </TouchableOpacity>
                ) : (
                    <View style={S.authRow}>
                        <TouchableOpacity style={S.signInBtn} onPress={() => router.push("/login")}>
                            <Text style={S.signInText}>Sign In</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={S.registerBtn} onPress={() => router.push("/register")}>
                            <Text style={S.registerText}>Create Account</Text>
                        </TouchableOpacity>
                    </View>
                )}

                <Text style={S.version}>Elite Movies v1.0.0 · Watch · Stream · Enjoy</Text>
            </ScrollView>
        </View>
    );
};

const S = StyleSheet.create({
    root: { flex: 1, backgroundColor: BG },
    headerBg: {
        backgroundColor: "#0D0D17",
        paddingTop: 52, paddingBottom: 20,
        borderBottomWidth: 1, borderBottomColor: "#1a1a28",
    },
    headerContent: { paddingHorizontal: 20 },
    brandRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
    logoImg: { width: 28, height: 28 },
    brandText: { color: GOLD, fontSize: 13, fontWeight: "800", letterSpacing: 2 },
    screenTitle: { color: "#fff", fontSize: 28, fontWeight: "800" },
    avatarCard: {
        alignItems: "center", marginHorizontal: 20,
        backgroundColor: CARD, borderRadius: 24, padding: 24,
        marginTop: 20, marginBottom: 16,
        borderWidth: 1, borderColor: "#2a2840",
        shadowColor: GOLD, shadowOpacity: 0.1, shadowRadius: 20,
    },
    avatarRing: {
        padding: 3, borderRadius: 60,
        borderWidth: 2, borderColor: GOLD, marginBottom: 12,
    },
    avatar: { width: 88, height: 88, borderRadius: 44 },
    userName: { color: "#fff", fontSize: 20, fontWeight: "800", marginBottom: 4 },
    userEmail: { color: "#666", fontSize: 13, marginBottom: 10 },
    memberBadge: {
        backgroundColor: GOLD, borderRadius: 12,
        paddingHorizontal: 12, paddingVertical: 4,
    },
    memberBadgeText: { color: "#000", fontSize: 10, fontWeight: "800", letterSpacing: 1.5 },
    statsCard: {
        flexDirection: "row", marginHorizontal: 20, backgroundColor: CARD,
        borderRadius: 20, padding: 20, marginBottom: 16,
        borderWidth: 1, borderColor: "#2a2840",
    },
    statItem: { flex: 1, alignItems: "center" },
    statBorder: { borderRightWidth: 1, borderRightColor: "#2a2840" },
    statIcon: { fontSize: 20, marginBottom: 6 },
    statValue: { color: GOLD, fontSize: 22, fontWeight: "800", marginBottom: 2 },
    statLabel: { color: "#666", fontSize: 11 },
    menuCard: {
        marginHorizontal: 20, backgroundColor: CARD, borderRadius: 20,
        marginBottom: 16, borderWidth: 1, borderColor: "#2a2840",
        overflow: "hidden",
    },
    menuItem: {
        flexDirection: "row", alignItems: "center",
        paddingHorizontal: 20, paddingVertical: 16, gap: 14,
    },
    menuBorder: { borderBottomWidth: 1, borderBottomColor: "#1a1a28" },
    menuIcon: { fontSize: 20, width: 28 },
    menuLabel: { flex: 1, color: "#fff", fontSize: 15 },
    menuRight: { flexDirection: "row", alignItems: "center", gap: 8 },
    menuValue: { color: "#666", fontSize: 12 },
    menuArrow: { color: GOLD, fontSize: 20, fontWeight: "300" },
    signOutBtn: {
        marginHorizontal: 20, borderRadius: 16, paddingVertical: 15,
        borderWidth: 1, borderColor: "#EF4444",
        alignItems: "center", marginBottom: 16,
    },
    signOutText: { color: "#EF4444", fontSize: 15, fontWeight: "700" },
    btnDisabled: { opacity: 0.5 },
    authRow: { flexDirection: "row", gap: 12, marginHorizontal: 20, marginBottom: 16 },
    signInBtn: {
        flex: 1, backgroundColor: GOLD, borderRadius: 16,
        paddingVertical: 15, alignItems: "center",
    },
    signInText: { color: "#000", fontSize: 15, fontWeight: "700" },
    registerBtn: {
        flex: 1, backgroundColor: CARD, borderRadius: 16,
        paddingVertical: 15, alignItems: "center",
        borderWidth: 1, borderColor: "#2a2840",
    },
    registerText: { color: "#fff", fontSize: 15, fontWeight: "700" },
    version: { color: "#333", fontSize: 11, textAlign: "center", marginBottom: 8 },
});

export default Profile;
