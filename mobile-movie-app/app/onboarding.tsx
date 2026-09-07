import {
    View, Text, Image, TouchableOpacity,
    StyleSheet, Dimensions, StatusBar,
} from "react-native";
import { useRouter } from "expo-router";
import { icons } from "@/constants/icons";
import { images } from "@/constants/images";

const { width, height } = Dimensions.get("window");
const GOLD = "#D4AF37";
const BG = "#09090F";

export default function Onboarding() {
    const router = useRouter();

    return (
        <View style={S.root}>
            <StatusBar barStyle="light-content" backgroundColor={BG} />

            {/* Background poster collage effect */}
            <Image source={images.bg} style={S.bgImage} resizeMode="cover" />
            <View style={S.overlay} />

            {/* Content */}
            <View style={S.content}>
                {/* Logo + Brand */}
                <View style={S.topSection}>
                    <View style={S.logoRing}>
                        <Image source={icons.logo} style={S.logoImg} resizeMode="contain" />
                    </View>
                    <Text style={S.brandName}>ELITE MOVIES</Text>
                    <Text style={S.tagline}>Watch · Stream · Enjoy</Text>
                </View>

                {/* Poster showcase */}
                <Image source={images.highlight} style={S.heroImage} resizeMode="contain" />

                {/* Copy */}
                <View style={S.copySection}>
                    <Text style={S.headline}>Your Premium</Text>
                    <Text style={S.headlineGold}>Movie Experience</Text>
                    <Text style={S.sub}>
                        Discover thousands of movies, watch trailers,{"\n"}
                        and download your favourites — all in one place.
                    </Text>

                    {/* Feature pills */}
                    <View style={S.featureRow}>
                        {["🎬 Trailers", "⭐ Ratings", "📥 Downloads"].map(f => (
                            <View key={f} style={S.featurePill}>
                                <Text style={S.featurePillText}>{f}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Buttons */}
                <View style={S.btnSection}>
                    <TouchableOpacity
                        style={S.primaryBtn}
                        onPress={() => router.push("/register")}
                        activeOpacity={0.88}
                    >
                        <Text style={S.primaryBtnText}>Get Started — It's Free</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={S.secondaryBtn}
                        onPress={() => router.push("/login")}
                        activeOpacity={0.88}
                    >
                        <Text style={S.secondaryBtnText}>
                            Already have an account?{" "}
                            <Text style={S.signInLink}>Sign In</Text>
                        </Text>
                    </TouchableOpacity>

                    {/* Skip */}
                    <TouchableOpacity
                        onPress={() => router.replace("/(tabs)")}
                        style={S.skipBtn}
                    >
                        <Text style={S.skipText}>Skip for now →</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}

const S = StyleSheet.create({
    root: { flex: 1, backgroundColor: BG },
    bgImage: {
        position: "absolute", width: "100%", height: "100%", opacity: 0.25,
    },
    overlay: {
        position: "absolute", width: "100%", height: "100%",
        backgroundColor: "rgba(9,9,15,0.7)",
    },
    content: {
        flex: 1, justifyContent: "space-between",
        paddingHorizontal: 28, paddingTop: 60, paddingBottom: 40,
    },
    topSection: { alignItems: "center" },
    logoRing: {
        width: 72, height: 72, borderRadius: 36,
        borderWidth: 2, borderColor: GOLD,
        justifyContent: "center", alignItems: "center",
        backgroundColor: "rgba(212,175,55,0.1)",
        marginBottom: 12,
    },
    logoImg: { width: 44, height: 44 },
    brandName: {
        color: GOLD, fontSize: 22, fontWeight: "900",
        letterSpacing: 4, marginBottom: 4,
    },
    tagline: { color: "#666", fontSize: 11, letterSpacing: 2 },
    heroImage: { width: "100%", height: height * 0.28, alignSelf: "center" },
    copySection: { alignItems: "center" },
    headline: { color: "#fff", fontSize: 32, fontWeight: "800", textAlign: "center" },
    headlineGold: { color: GOLD, fontSize: 32, fontWeight: "900", textAlign: "center", marginBottom: 12 },
    sub: { color: "#A8B5DB", fontSize: 14, textAlign: "center", lineHeight: 22, marginBottom: 20 },
    featureRow: { flexDirection: "row", gap: 10 },
    featurePill: {
        backgroundColor: "rgba(212,175,55,0.12)", borderRadius: 20,
        paddingHorizontal: 12, paddingVertical: 6,
        borderWidth: 1, borderColor: "rgba(212,175,55,0.3)",
    },
    featurePillText: { color: GOLD, fontSize: 12, fontWeight: "600" },
    btnSection: { gap: 12 },
    primaryBtn: {
        backgroundColor: GOLD, borderRadius: 16,
        paddingVertical: 16, alignItems: "center",
        shadowColor: GOLD, shadowOpacity: 0.4, shadowRadius: 12,
        elevation: 6,
    },
    primaryBtnText: { color: "#000", fontSize: 16, fontWeight: "800" },
    secondaryBtn: { alignItems: "center", paddingVertical: 6 },
    secondaryBtnText: { color: "#A8B5DB", fontSize: 14 },
    signInLink: { color: GOLD, fontWeight: "700" },
    skipBtn: { alignItems: "center", paddingVertical: 4 },
    skipText: { color: "#444", fontSize: 13 },
});
