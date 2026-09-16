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

const { height } = Dimensions.get("window");

const GOLD   = "#D4AF37";
const BG     = "#09090F";
const BORDER = "#2a2840";
const MUTED  = "#6B7280";
const WHITE  = "#FFFFFF";

export default function Register() {
    const router = useRouter();
    const { setSessionEmail } = useAuth();

    const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
    const [showPwd,    setShowPwd]    = useState(false);
    const [showConf,   setShowConf]   = useState(false);
    const [loading,    setLoading]    = useState(false);
    const [error,      setError]      = useState("");

    const update = (key: string, val: string) => {
        setForm(prev => ({ ...prev, [key]: val }));
        setError("");
    };

    const validate = () => {
        if (!form.name.trim())                        { setError("Full name is required");               return false; }
        if (form.name.trim().length < 2)              { setError("Name must be at least 2 characters");  return false; }
        if (!form.email.trim())                        { setError("Email is required");                   return false; }
        if (!/\S+@\S+\.\S+/.test(form.email))         { setError("Enter a valid email address");         return false; }
        if (!form.password)                            { setError("Password is required");                return false; }
        if (form.password.length < 6)                  { setError("Password must be at least 6 chars");   return false; }
        if (form.password !== form.confirm)            { setError("Passwords do not match");              return false; }
        return true;
    };

    const handleRegister = async () => {
        if (!validate()) return;
        setLoading(true);
        try {
            await setSessionEmail(form.email.trim().toLowerCase(), form.name.trim(), false);
            router.replace("/(tabs)");
        } catch (e: any) {
            setError(e.message || "Registration failed. Try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={S.root}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
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

                {/* Brand */}
                <View style={S.brandWrap}>
                    <View style={S.logoRing}>
                        <Image source={icons.logo} style={S.logoImg} resizeMode="contain" />
                    </View>
                    <Text style={S.brandName}>ELITE MOVIES</Text>
                    <Text style={S.brandTag}>Join the Premium Experience</Text>
                </View>

                {/* Card */}
                <View style={S.card}>
                    <Text style={S.cardTitle}>Create Account</Text>
                    <Text style={S.cardSub}>Sign up and start watching</Text>

                    {/* Error */}
                    {!!error && (
                        <View style={S.errorBox}>
                            <Text style={S.errorText}>⚠ {error}</Text>
                        </View>
                    )}

                    {/* Full Name */}
                    <View style={S.fieldWrap}>
                        <Text style={S.label}>Full Name</Text>
                        <View style={S.inputRow}>
                            <Text style={S.inputIcon}>👤</Text>
                            <TextInput
                                style={S.input}
                                value={form.name}
                                onChangeText={t => update("name", t)}
                                placeholder="Your full name"
                                placeholderTextColor={MUTED}
                                autoCapitalize="words"
                            />
                        </View>
                    </View>

                    {/* Email */}
                    <View style={S.fieldWrap}>
                        <Text style={S.label}>Email Address</Text>
                        <View style={S.inputRow}>
                            <Text style={S.inputIcon}>✉️</Text>
                            <TextInput
                                style={S.input}
                                value={form.email}
                                onChangeText={t => update("email", t)}
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
                                value={form.password}
                                onChangeText={t => update("password", t)}
                                placeholder="At least 6 characters"
                                placeholderTextColor={MUTED}
                                secureTextEntry={!showPwd}
                                autoCapitalize="none"
                            />
                            <TouchableOpacity onPress={() => setShowPwd(v => !v)} style={S.eyeBtn}>
                                <Text style={S.eyeIcon}>{showPwd ? "🙈" : "👁"}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Confirm Password */}
                    <View style={S.fieldWrap}>
                        <Text style={S.label}>Confirm Password</Text>
                        <View style={S.inputRow}>
                            <Text style={S.inputIcon}>🔑</Text>
                            <TextInput
                                style={[S.input, { flex: 1 }]}
                                value={form.confirm}
                                onChangeText={t => update("confirm", t)}
                                placeholder="Re-enter password"
                                placeholderTextColor={MUTED}
                                secureTextEntry={!showConf}
                                autoCapitalize="none"
                            />
                            <TouchableOpacity onPress={() => setShowConf(v => !v)} style={S.eyeBtn}>
                                <Text style={S.eyeIcon}>{showConf ? "🙈" : "👁"}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Perks */}
                    <View style={S.perksRow}>
                        {["💳 Pay per movie", "📥 Download offline", "🔖 Save favourites"].map(p => (
                            <View key={p} style={S.perkChip}>
                                <Text style={S.perkText}>{p}</Text>
                            </View>
                        ))}
                    </View>

                    {/* Create Account Button */}
                    <TouchableOpacity
                        style={[S.signUpBtn, loading && S.btnDisabled]}
                        onPress={handleRegister}
                        disabled={loading}
                        activeOpacity={0.85}
                    >
                        {loading ? (
                            <ActivityIndicator color="#000" />
                        ) : (
                            <Text style={S.signUpText}>Create Account →</Text>
                        )}
                    </TouchableOpacity>

                    {/* Divider */}
                    <View style={S.divider}>
                        <View style={S.divLine} />
                        <Text style={S.divText}>or</Text>
                        <View style={S.divLine} />
                    </View>

                    {/* Guest */}
                    <TouchableOpacity
                        style={S.guestBtn}
                        onPress={() => router.replace("/(tabs)")}
                        activeOpacity={0.8}
                    >
                        <Text style={S.guestText}>Continue as Guest</Text>
                    </TouchableOpacity>
                </View>

                {/* Login link */}
                <View style={S.loginRow}>
                    <Text style={S.loginText}>Already have an account? </Text>
                    <TouchableOpacity onPress={() => router.push("/login")}>
                        <Text style={S.loginLink}>Sign In →</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const S = StyleSheet.create({
    root:       { flex: 1, backgroundColor: BG },
    bgAbs:      { position: "absolute", width: "100%", height: "100%", opacity: 0.15 },
    bgOverlay:  { position: "absolute", width: "100%", height: "100%", backgroundColor: "rgba(9,9,15,0.6)" },
    scroll:     { paddingHorizontal: 24, paddingBottom: 60, paddingTop: 56, minHeight: height },

    backBtn:    { marginBottom: 24, alignSelf: "flex-start", padding: 8, backgroundColor: "rgba(255,255,255,0.08)", borderRadius: 20 },
    backIcon:   { width: 20, height: 20, transform: [{ rotate: "180deg" }] },

    brandWrap:  { alignItems: "center", marginBottom: 28 },
    logoRing:   { width: 72, height: 72, borderRadius: 36, borderWidth: 2, borderColor: GOLD, alignItems: "center", justifyContent: "center", marginBottom: 12, backgroundColor: "rgba(212,175,55,0.1)" },
    logoImg:    { width: 40, height: 40 },
    brandName:  { color: GOLD, fontSize: 22, fontWeight: "900", letterSpacing: 3, marginBottom: 4 },
    brandTag:   { color: MUTED, fontSize: 11, letterSpacing: 1.2 },

    card:       { backgroundColor: "rgba(28,27,46,0.95)", borderRadius: 24, padding: 24, borderWidth: 1, borderColor: BORDER, marginBottom: 20, shadowColor: GOLD, shadowOpacity: 0.08, shadowRadius: 24, elevation: 10 },
    cardTitle:  { color: WHITE, fontSize: 24, fontWeight: "800", marginBottom: 4 },
    cardSub:    { color: MUTED, fontSize: 13, marginBottom: 20 },

    errorBox:   { backgroundColor: "rgba(220,38,38,0.12)", borderRadius: 10, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: "rgba(220,38,38,0.3)" },
    errorText:  { color: "#f87171", fontSize: 13 },

    fieldWrap:  { marginBottom: 14 },
    label:      { color: "#A8B5DB", fontSize: 12, fontWeight: "700", marginBottom: 6, letterSpacing: 0.5 },
    inputRow:   { flexDirection: "row", alignItems: "center", backgroundColor: "#0D0D17", borderRadius: 12, borderWidth: 1, borderColor: BORDER, paddingHorizontal: 12, paddingVertical: 2 },
    inputIcon:  { fontSize: 16, marginRight: 8 },
    input:      { flex: 1, color: WHITE, fontSize: 14, paddingVertical: 12 },
    eyeBtn:     { padding: 6 },
    eyeIcon:    { fontSize: 16 },

    perksRow:   { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 18, marginTop: 4 },
    perkChip:   { backgroundColor: "rgba(212,175,55,0.1)", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: "rgba(212,175,55,0.25)" },
    perkText:   { color: GOLD, fontSize: 10, fontWeight: "700" },

    signUpBtn:  { backgroundColor: GOLD, borderRadius: 14, paddingVertical: 15, alignItems: "center", justifyContent: "center", shadowColor: GOLD, shadowOpacity: 0.35, shadowRadius: 12, elevation: 6 },
    signUpText: { color: "#000", fontSize: 16, fontWeight: "800", letterSpacing: 0.5 },
    btnDisabled:{ opacity: 0.55 },

    divider:    { flexDirection: "row", alignItems: "center", marginVertical: 16, gap: 10 },
    divLine:    { flex: 1, height: 1, backgroundColor: BORDER },
    divText:    { color: MUTED, fontSize: 12 },

    guestBtn:   { borderRadius: 14, paddingVertical: 13, alignItems: "center", borderWidth: 1, borderColor: BORDER, backgroundColor: "rgba(255,255,255,0.04)" },
    guestText:  { color: "#A8B5DB", fontSize: 14, fontWeight: "600" },

    loginRow:   { flexDirection: "row", justifyContent: "center", alignItems: "center" },
    loginText:  { color: MUTED, fontSize: 13 },
    loginLink:  { color: GOLD, fontSize: 13, fontWeight: "700" },
});
