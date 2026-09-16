import {
    View,
    Text,
    Image,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Alert,
    StyleSheet,
    Dimensions,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { useState } from "react";
import { icons } from "@/constants/icons";
import { images } from "@/constants/images";
import { useAuth } from "@/context/AuthContext";

const { width, height } = Dimensions.get("window");

const GOLD   = "#D4AF37";
const BG     = "#09090F";
const CARD   = "#1C1B2E";
const BORDER = "#2a2840";
const MUTED  = "#6B7280";
const WHITE  = "#FFFFFF";

// ── VIP account (bypasses all payments) ──────────────────────────────────────
export const VIP_EMAIL    = "admin@elitemovies.com";
export const VIP_PASSWORD = "EliteVIP2024!";
// ─────────────────────────────────────────────────────────────────────────────

export default function Login() {
    const router = useRouter();
    const { setSessionEmail } = useAuth();

    const [email,    setEmail]    = useState("");
    const [password, setPassword] = useState("");
    const [showPwd,  setShowPwd]  = useState(false);
    const [loading,  setLoading]  = useState(false);
    const [error,    setError]    = useState("");

    const handleLogin = async () => {
        setError("");
        const em = email.trim().toLowerCase();
        const pw = password.trim();

        if (!em) { setError("Email is required"); return; }
        if (!/\S+@\S+\.\S+/.test(em)) { setError("Enter a valid email"); return; }
        if (!pw) { setError("Password is required"); return; }

        setLoading(true);
        try {
            // VIP account — full free access
            if (em === VIP_EMAIL.toLowerCase() && pw === VIP_PASSWORD) {
                await setSessionEmail(em, "VIP Admin", true);
                router.replace("/(tabs)");
                return;
            }
            // Regular user — just save email as session (no server auth needed)
            if (pw.length < 6) { setError("Password must be at least 6 characters"); return; }
            await setSessionEmail(em, em.split("@")[0], false);
            router.replace("/(tabs)");
        } catch (e: any) {
            setError(e.message || "Login failed. Try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={S.root}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
            {/* Background */}
            <Image source={images.bg} style={S.bgAbs} resizeMode="cover" />
            <View style={S.bgOverlay} />

            <ScrollView
                contentContainerStyle={S.scroll}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                {/* Back */}
                <TouchableOpacity onPress={router.back} style={S.backBtn}>
                    <Image source={icons.arrow} style={S.backIcon} tintColor={WHITE} />
                </TouchableOpacity>

                {/* Logo + Brand */}
                <View style={S.brandWrap}>
                    <View style={S.logoRing}>
                        <Image source={icons.logo} style={S.logoImg} resizeMode="contain" />
                    </View>
                    <Text style={S.brandName}>ELITE MOVIES</Text>
                    <Text style={S.brandTag}>Premium Cinema · Stream Anywhere</Text>
                </View>

                {/* Card */}
                <View style={S.card}>
                    <Text style={S.cardTitle}>Welcome Back</Text>
                    <Text style={S.cardSub}>Sign in to continue watching</Text>

                    {/* Error */}
                    {!!error && (
                        <View style={S.errorBox}>
                            <Text style={S.errorText}>⚠ {error}</Text>
                        </View>
                    )}

                    {/* Email */}
                    <View style={S.fieldWrap}>
                        <Text style={S.label}>Email Address</Text>
                        <View style={S.inputRow}>
                            <Text style={S.inputIcon}>✉️</Text>
                            <TextInput
                                style={S.input}
                                value={email}
                                onChangeText={t => { setEmail(t); setError(""); }}
                                placeholder="your@email.com"
                                placeholderTextColor={MUTED}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                autoCorrect={false}
                            />
                        </View>
                    </View>

                    {/* Password */}
                    <View style={S.fieldWrap}>
                        <Text style={S.label}>Password</Text>
                        <View style={S.inputRow}>
                            <Text style={S.inputIcon}>🔒</Text>
                            <TextInput
                                style={[S.input, { flex: 1 }]}
                                value={password}
                                onChangeText={t => { setPassword(t); setError(""); }}
                                placeholder="Enter password"
                                placeholderTextColor={MUTED}
                                secureTextEntry={!showPwd}
                                autoCapitalize="none"
                            />
                            <TouchableOpacity onPress={() => setShowPwd(v => !v)} style={S.eyeBtn}>
                                <Text style={S.eyeIcon}>{showPwd ? "🙈" : "👁"}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Sign In Button */}
                    <TouchableOpacity
                        style={[S.signInBtn, loading && S.btnDisabled]}
                        onPress={handleLogin}
                        disabled={loading}
                        activeOpacity={0.85}
                    >
                        {loading ? (
                            <ActivityIndicator color="#000" />
                        ) : (
                            <>
                                <Image source={icons.play} style={S.btnIcon} tintColor="#000" />
                                <Text style={S.signInText}>Sign In</Text>
                            </>
                        )}
                    </TouchableOpacity>

                    {/* Divider */}
                    <View style={S.divider}>
                        <View style={S.divLine} />
                        <Text style={S.divText}>or</Text>
                        <View style={S.divLine} />
                    </View>

                    {/* Guest access */}
                    <TouchableOpacity
                        style={S.guestBtn}
                        onPress={() => router.replace("/(tabs)")}
                        activeOpacity={0.8}
                    >
                        <Text style={S.guestText}>Browse as Guest</Text>
                    </TouchableOpacity>
                </View>

                {/* Register link */}
                <View style={S.registerRow}>
                    <Text style={S.registerText}>Don't have an account? </Text>
                    <TouchableOpacity onPress={() => router.push("/register")}>
                        <Text style={S.registerLink}>Create one →</Text>
                    </TouchableOpacity>
                </View>

                {/* VIP hint (subtle) */}
                <Text style={S.vipHint}>
                    Premium members get unlimited access to all movies
                </Text>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const S = StyleSheet.create({
    root:        { flex: 1, backgroundColor: BG },
    bgAbs:       { position: "absolute", width: "100%", height: "100%", opacity: 0.15 },
    bgOverlay:   { position: "absolute", width: "100%", height: "100%", backgroundColor: "rgba(9,9,15,0.6)" },
    scroll:      { paddingHorizontal: 24, paddingBottom: 60, paddingTop: 56, minHeight: height },

    backBtn:     { marginBottom: 24, alignSelf: "flex-start", padding: 8, backgroundColor: "rgba(255,255,255,0.08)", borderRadius: 20 },
    backIcon:    { width: 20, height: 20, transform: [{ rotate: "180deg" }] },

    brandWrap:   { alignItems: "center", marginBottom: 32 },
    logoRing:    { width: 72, height: 72, borderRadius: 36, borderWidth: 2, borderColor: GOLD, alignItems: "center", justifyContent: "center", marginBottom: 12, backgroundColor: "rgba(212,175,55,0.1)" },
    logoImg:     { width: 40, height: 40 },
    brandName:   { color: GOLD, fontSize: 22, fontWeight: "900", letterSpacing: 3, marginBottom: 4 },
    brandTag:    { color: MUTED, fontSize: 11, letterSpacing: 1.2 },

    card:        { backgroundColor: "rgba(28,27,46,0.95)", borderRadius: 24, padding: 24, borderWidth: 1, borderColor: BORDER, marginBottom: 20, shadowColor: GOLD, shadowOpacity: 0.08, shadowRadius: 24, elevation: 10 },
    cardTitle:   { color: WHITE, fontSize: 24, fontWeight: "800", marginBottom: 4 },
    cardSub:     { color: MUTED, fontSize: 13, marginBottom: 20 },

    errorBox:    { backgroundColor: "rgba(220,38,38,0.12)", borderRadius: 10, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: "rgba(220,38,38,0.3)" },
    errorText:   { color: "#f87171", fontSize: 13 },

    fieldWrap:   { marginBottom: 16 },
    label:       { color: "#A8B5DB", fontSize: 12, fontWeight: "700", marginBottom: 6, letterSpacing: 0.5 },
    inputRow:    { flexDirection: "row", alignItems: "center", backgroundColor: "#0D0D17", borderRadius: 12, borderWidth: 1, borderColor: BORDER, paddingHorizontal: 12, paddingVertical: 2 },
    inputIcon:   { fontSize: 16, marginRight: 8 },
    input:       { flex: 1, color: WHITE, fontSize: 14, paddingVertical: 12 },
    eyeBtn:      { padding: 6 },
    eyeIcon:     { fontSize: 16 },

    signInBtn:   { backgroundColor: GOLD, borderRadius: 14, paddingVertical: 15, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 4, shadowColor: GOLD, shadowOpacity: 0.35, shadowRadius: 12, elevation: 6 },
    signInText:  { color: "#000", fontSize: 16, fontWeight: "800", letterSpacing: 0.5 },
    btnIcon:     { width: 16, height: 16 },
    btnDisabled: { opacity: 0.55 },

    divider:     { flexDirection: "row", alignItems: "center", marginVertical: 18, gap: 10 },
    divLine:     { flex: 1, height: 1, backgroundColor: BORDER },
    divText:     { color: MUTED, fontSize: 12 },

    guestBtn:    { borderRadius: 14, paddingVertical: 13, alignItems: "center", borderWidth: 1, borderColor: BORDER, backgroundColor: "rgba(255,255,255,0.04)" },
    guestText:   { color: "#A8B5DB", fontSize: 14, fontWeight: "600" },

    registerRow: { flexDirection: "row", justifyContent: "center", alignItems: "center", marginBottom: 16 },
    registerText:{ color: MUTED, fontSize: 13 },
    registerLink:{ color: GOLD, fontSize: 13, fontWeight: "700" },

    vipHint:     { color: "#333", fontSize: 10, textAlign: "center", letterSpacing: 0.5 },
});
