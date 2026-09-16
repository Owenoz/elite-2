/**
 * WelcomeModal — shown once per app install on first open.
 * Shows welcome message + WhatsApp inquiry button.
 */
import React, { useEffect, useState } from "react";
import {
    Modal, View, Text, TouchableOpacity,
    StyleSheet, Linking, Alert, Animated, Image,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { icons } from "@/constants/icons";

const WHATSAPP_NUMBER = "256793854272"; // Uganda country code + number
const SEEN_KEY = "elite_welcome_seen";

const GOLD   = "#D4AF37";
const BG     = "#09090F";
const CARD   = "#1C1B2E";
const BORDER = "#2a2840";
const MUTED  = "#6B7280";
const WHITE  = "#FFFFFF";

interface WelcomeModalProps {
    /** Force show (e.g. from a settings screen). Default false = auto show once. */
    forceShow?: boolean;
    onClose?: () => void;
}

export default function WelcomeModal({ forceShow = false, onClose }: WelcomeModalProps) {
    const [visible, setVisible] = useState(false);
    const scale = new Animated.Value(0.85);
    const opacity = new Animated.Value(0);

    useEffect(() => {
        if (forceShow) { show(); return; }
        AsyncStorage.getItem(SEEN_KEY).then(seen => {
            if (!seen) show();
        });
    }, [forceShow]);

    const show = () => {
        setVisible(true);
        Animated.parallel([
            Animated.spring(scale,   { toValue: 1,   useNativeDriver: true, tension: 80, friction: 8 }),
            Animated.timing(opacity, { toValue: 1,   useNativeDriver: true, duration: 250 }),
        ]).start();
    };

    const hide = (markSeen = true) => {
        Animated.parallel([
            Animated.spring(scale,   { toValue: 0.9, useNativeDriver: true, tension: 100 }),
            Animated.timing(opacity, { toValue: 0,   useNativeDriver: true, duration: 180 }),
        ]).start(() => {
            setVisible(false);
            if (markSeen) AsyncStorage.setItem(SEEN_KEY, "1");
            onClose?.();
        });
    };

    const handleWhatsApp = async () => {
        const message = encodeURIComponent(
            "Hello Elite Movies! I have an inquiry / missing movie request."
        );
        const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${message}`;
        const canOpen = await Linking.canOpenURL(url);
        if (canOpen) {
            Linking.openURL(url);
        } else {
            // Fallback: open web WhatsApp
            Linking.openURL(`https://web.whatsapp.com/send?phone=${WHATSAPP_NUMBER}&text=${message}`)
                .catch(() => Alert.alert("WhatsApp not found", "Please install WhatsApp or contact us at +256793854272"));
        }
        hide();
    };

    if (!visible) return null;

    return (
        <Modal
            transparent
            visible={visible}
            animationType="none"
            statusBarTranslucent
            onRequestClose={() => hide()}
        >
            {/* Backdrop */}
            <Animated.View style={[S.backdrop, { opacity }]}>
                <Animated.View style={[S.card, { transform: [{ scale }], opacity }]}>

                    {/* Crown + Logo */}
                    <View style={S.logoRow}>
                        <View style={S.logoRing}>
                            <Image source={icons.logo} style={S.logoImg} resizeMode="contain" />
                        </View>
                    </View>

                    {/* Crown emoji */}
                    <Text style={S.crown}>👑</Text>

                    {/* Title */}
                    <Text style={S.title}>Welcome to{"\n"}Elite Movies</Text>

                    {/* Powered by */}
                    <View style={S.poweredRow}>
                        <Text style={S.poweredText}>Powered by </Text>
                        <Text style={S.poweredBrand}>BFO</Text>
                    </View>

                    {/* Divider */}
                    <View style={S.divider} />

                    {/* Message */}
                    <Text style={S.message}>
                        Please contact us via{" "}
                        <Text style={S.highlight}>Telegram</Text>
                        {" "}or{" "}
                        <Text style={S.highlight}>WhatsApp</Text>
                        {" "}for inquiries or missing movies.{"\n"}Thank you! 🙏
                    </Text>

                    {/* Buttons */}
                    <View style={S.btnRow}>
                        {/* Cancel */}
                        <TouchableOpacity
                            style={S.cancelBtn}
                            onPress={() => hide()}
                            activeOpacity={0.8}
                        >
                            <Text style={S.cancelText}>Cancel</Text>
                        </TouchableOpacity>

                        {/* Inquire via WhatsApp */}
                        <TouchableOpacity
                            style={S.inquireBtn}
                            onPress={handleWhatsApp}
                            activeOpacity={0.85}
                        >
                            <Text style={S.whatsappIcon}>💬</Text>
                            <Text style={S.inquireText}>Inquire</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Small note */}
                    <Text style={S.note}>Opens WhatsApp · +256 793 854 272</Text>

                </Animated.View>
            </Animated.View>
        </Modal>
    );
}

const S = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.75)",
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 28,
    },
    card: {
        width: "100%",
        maxWidth: 360,
        backgroundColor: CARD,
        borderRadius: 28,
        padding: 28,
        borderWidth: 1,
        borderColor: BORDER,
        alignItems: "center",
        shadowColor: GOLD,
        shadowOpacity: 0.15,
        shadowRadius: 30,
        elevation: 20,
    },

    logoRow:   { marginBottom: 4 },
    logoRing:  {
        width: 64, height: 64, borderRadius: 32,
        borderWidth: 2, borderColor: GOLD,
        alignItems: "center", justifyContent: "center",
        backgroundColor: "rgba(212,175,55,0.08)",
    },
    logoImg:   { width: 36, height: 36 },

    crown:     { fontSize: 28, marginTop: 6, marginBottom: 2 },
    title:     {
        color: WHITE, fontSize: 26, fontWeight: "900",
        textAlign: "center", letterSpacing: 0.5, lineHeight: 32,
        marginBottom: 8,
    },

    poweredRow:  { flexDirection: "row", alignItems: "center", marginBottom: 16 },
    poweredText: { color: MUTED, fontSize: 12 },
    poweredBrand:{ color: GOLD, fontSize: 13, fontWeight: "800", letterSpacing: 1.5 },

    divider:   { width: "100%", height: 1, backgroundColor: BORDER, marginBottom: 16 },

    message:   {
        color: "#A8B5DB", fontSize: 14, textAlign: "center",
        lineHeight: 22, marginBottom: 24,
    },
    highlight: { color: GOLD, fontWeight: "700" },

    btnRow:    { flexDirection: "row", gap: 12, width: "100%" },

    cancelBtn: {
        flex: 1, paddingVertical: 13, borderRadius: 14,
        borderWidth: 1, borderColor: BORDER,
        backgroundColor: "rgba(255,255,255,0.04)",
        alignItems: "center",
    },
    cancelText:{ color: "#A8B5DB", fontSize: 14, fontWeight: "600" },

    inquireBtn:{
        flex: 2, paddingVertical: 13, borderRadius: 14,
        backgroundColor: "#25D366",   // WhatsApp green
        alignItems: "center", justifyContent: "center",
        flexDirection: "row", gap: 6,
        shadowColor: "#25D366", shadowOpacity: 0.4, shadowRadius: 10, elevation: 6,
    },
    whatsappIcon:{ fontSize: 16 },
    inquireText: { color: WHITE, fontSize: 15, fontWeight: "800" },

    note:      { color: "#444", fontSize: 10, marginTop: 12, textAlign: "center" },
});
