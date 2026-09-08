import React, { useState } from "react";
import {
  Modal, View, Text, TextInput, TouchableOpacity,
  Image, ActivityIndicator, Alert, KeyboardAvoidingView,
  Platform, ScrollView, StyleSheet,
} from "react-native";
import { icons } from "@/constants/icons";
import {
  createPayment,
  verifyPayment,
  resendOtp,
  type PaymentVerifyResult,
} from "@/services/eliteApi";

interface PaymentModalProps {
  visible: boolean;
  movieTitle: string;
  movieId: number;
  onClose: () => void;
  /** Called with email + full verify result after successful payment */
  onPaymentSuccess: (email: string, result: PaymentVerifyResult) => void;
}

const GOLD = "#D4AF37";
const SHEET_BG = "#0D0D17";
const CARD = "#1C1B2E";

const PaymentModal = ({
  visible, movieTitle, movieId, onClose, onPaymentSuccess,
}: PaymentModalProps) => {
  const [step, setStep] = useState<"payment" | "verify" | "success">("payment");
  const [email, setEmail]           = useState("");
  const [otp, setOtp]               = useState("");
  const [reference, setReference]   = useState("");
  const [loading, setLoading]       = useState(false);
  const [emailError, setEmailError] = useState("");
  const [otpError, setOtpError]     = useState("");
  const [verifyResult, setVerifyResult] = useState<PaymentVerifyResult | null>(null);

  const isValidEmail = (e: string) => /\S+@\S+\.\S+/.test(e);

  // ── Step 1: Pay ─────────────────────────────────────────────────────────────
  const handlePayNow = async () => {
    if (!email) { setEmailError("Email is required"); return; }
    if (!isValidEmail(email)) { setEmailError("Enter a valid email address"); return; }
    setEmailError("");
    setLoading(true);

    try {
      const result = await createPayment(email.toLowerCase().trim(), movieId, movieTitle);

      if (!result) {
        Alert.alert("Error", "Could not initiate payment. Please try again.");
        return;
      }

      // Already paid — skip straight to success
      if ((result as any).already_paid) {
        setStep("success");
        onPaymentSuccess(email.toLowerCase(), {
          verified: true,
          movie_id: movieId,
          movie_title: movieTitle,
          archive_url: null,
          archive_identifier: null,
          message: "You already have access to this movie.",
        });
        return;
      }

      setReference(result.reference);

      Alert.alert(
        "📧 Check Your Email",
        result.email_sent
          ? `A 6-digit code was sent to:\n${email}`
          : `Code generated. Check email or try: ${result.message}`,
        [{ text: "OK" }]
      );
      setStep("verify");
    } catch (err: any) {
      Alert.alert("Error", err.message || "Payment failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2: Verify OTP ───────────────────────────────────────────────────────
  const handleVerify = async () => {
    if (!otp || otp.length < 6) { setOtpError("Enter the 6-digit code"); return; }
    setOtpError("");
    setLoading(true);

    try {
      const result = await verifyPayment(email.toLowerCase().trim(), otp.trim(), reference);

      if (!result) {
        setOtpError("Invalid or expired code. Try again.");
        return;
      }

      setVerifyResult(result);
      setStep("success");
      onPaymentSuccess(email.toLowerCase(), result);
    } catch (err: any) {
      setOtpError(err.message || "Verification failed. Check your code.");
    } finally {
      setLoading(false);
    }
  };

  // ── Resend OTP ───────────────────────────────────────────────────────────────
  const handleResend = async () => {
    if (!reference) return;
    setLoading(true);
    try {
      const r = await resendOtp(email.toLowerCase(), reference);
      Alert.alert("Code Resent", r?.message || `New code sent to ${email}`);
    } catch {
      Alert.alert("Error", "Could not resend code. Try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── Close / reset ─────────────────────────────────────────────────────────────
  const handleClose = () => {
    setStep("payment");
    setEmail(""); setOtp(""); setReference("");
    setEmailError(""); setOtpError("");
    setVerifyResult(null);
    onClose();
  };

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={S.overlay}
      >
        <View style={S.overlay}>
          <TouchableOpacity style={S.backdrop} onPress={handleClose} activeOpacity={1} />
          <View style={S.sheet}>
            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* ── Header ── */}
              <View style={S.header}>
                <View style={S.headerLeft}>
                  <View style={S.goldDot} />
                  <Text style={S.headerTitle}>
                    {step === "success" ? "Access Granted 🎬" : "Elite Movies Pay"}
                  </Text>
                </View>
                <TouchableOpacity onPress={handleClose} style={S.closeBtn}>
                  <Text style={S.closeX}>✕</Text>
                </TouchableOpacity>
              </View>

              {/* ══ STEP 1: Payment details ══════════════════════════════════ */}
              {step === "payment" && (
                <View style={S.body}>
                  {/* Movie row */}
                  <View style={S.movieRow}>
                    <Image source={icons.play} style={S.movieIcon} tintColor={GOLD} />
                    <Text style={S.movieTitle} numberOfLines={2}>{movieTitle}</Text>
                  </View>

                  {/* Amount box */}
                  <View style={S.amountBox}>
                    <Text style={S.amountLabel}>ONE-TIME ACCESS FEE</Text>
                    <Text style={S.amountValue}>5,000 UGX</Text>
                    <Text style={S.amountSub}>Lifetime access · Verified by email</Text>
                  </View>

                  {/* Method badges */}
                  <View style={S.methodRow}>
                    {["📱 MTN MoMo", "📱 Airtel Money", "💳 Card"].map(m => (
                      <View key={m} style={S.methodBadge}>
                        <Text style={S.methodText}>{m}</Text>
                      </View>
                    ))}
                  </View>

                  {/* Email */}
                  <Text style={S.label}>Your Email</Text>
                  <Text style={S.sublabel}>We'll send a verification code + receipt here</Text>
                  <TextInput
                    style={[S.input, !!emailError && S.inputError]}
                    placeholder="you@example.com"
                    placeholderTextColor="#444"
                    value={email}
                    onChangeText={t => { setEmail(t); setEmailError(""); }}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  {!!emailError && <Text style={S.errorText}>⚠ {emailError}</Text>}

                  {/* Pay button */}
                  <TouchableOpacity
                    style={[S.payBtn, loading && S.btnDisabled]}
                    onPress={handlePayNow}
                    disabled={loading}
                  >
                    {loading
                      ? <ActivityIndicator color="#000" />
                      : <Text style={S.payBtnText}>Pay 5,000 UGX & Get Access</Text>
                    }
                  </TouchableOpacity>

                  <Text style={S.secureNote}>
                    🔒 Payments verified by email · No account needed
                  </Text>
                </View>
              )}

              {/* ══ STEP 2: OTP Verification ═════════════════════════════════ */}
              {step === "verify" && (
                <View style={S.body}>
                  <View style={S.iconCenter}>
                    <Text style={S.bigIcon}>📧</Text>
                  </View>
                  <Text style={S.stepTitle}>Enter your code</Text>
                  <Text style={S.stepSub}>
                    We sent a 6-digit code to{"\n"}
                    <Text style={S.highlight}>{email}</Text>
                  </Text>

                  <Text style={S.label}>6-Digit Code</Text>
                  <TextInput
                    style={[S.input, S.otpInput, !!otpError && S.inputError]}
                    placeholder="• • • • • •"
                    placeholderTextColor="#333"
                    value={otp}
                    onChangeText={t => { setOtp(t); setOtpError(""); }}
                    keyboardType="number-pad"
                    maxLength={6}
                    textAlign="center"
                  />
                  {!!otpError && <Text style={S.errorText}>⚠ {otpError}</Text>}

                  <TouchableOpacity
                    style={[S.payBtn, loading && S.btnDisabled]}
                    onPress={handleVerify}
                    disabled={loading}
                  >
                    {loading
                      ? <ActivityIndicator color="#000" />
                      : <Text style={S.payBtnText}>Verify & Unlock Movie</Text>
                    }
                  </TouchableOpacity>

                  <View style={S.row}>
                    <TouchableOpacity onPress={() => setStep("payment")}>
                      <Text style={S.linkText}>← Change email</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleResend} disabled={loading}>
                      <Text style={S.linkText}>Resend code →</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* ══ STEP 3: Success ══════════════════════════════════════════ */}
              {step === "success" && (
                <View style={S.body}>
                  <View style={S.iconCenter}>
                    <Text style={S.bigIcon}>✅</Text>
                  </View>
                  <Text style={S.stepTitle}>Payment Confirmed!</Text>
                  <Text style={S.stepSub}>
                    You now have lifetime access to{"\n"}
                    <Text style={S.highlight}>{movieTitle}</Text>
                  </Text>

                  <View style={S.receiptBox}>
                    <Text style={S.receiptRow}>📧 {email}</Text>
                    <Text style={S.receiptRow}>💰 5,000 UGX</Text>
                    <Text style={S.receiptRow}>🎬 {movieTitle}</Text>
                    {!!verifyResult?.archive_identifier && (
                      <Text style={S.receiptRow}>
                        📼 Stream: {verifyResult.archive_identifier}
                      </Text>
                    )}
                  </View>

                  <TouchableOpacity style={S.doneBtn} onPress={handleClose}>
                    <Text style={S.payBtnText}>▶ Watch Movie Now</Text>
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const S = StyleSheet.create({
  overlay:     { flex: 1, justifyContent: "flex-end" },
  backdrop:    { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.7)" },
  sheet: {
    backgroundColor: SHEET_BG,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingBottom: 44, maxHeight: "92%",
    borderTopWidth: 1, borderColor: "#2a2840",
  },
  header: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 20, paddingTop: 20, paddingBottom: 14,
    borderBottomWidth: 1, borderColor: "#1a1836",
  },
  headerLeft:  { flexDirection: "row", alignItems: "center", gap: 8 },
  goldDot:     { width: 8, height: 8, borderRadius: 4, backgroundColor: GOLD },
  headerTitle: { color: "#fff", fontSize: 18, fontWeight: "700" },
  closeBtn:    { padding: 6, backgroundColor: "#1C1B2E", borderRadius: 14 },
  closeX:      { color: "#666", fontSize: 16 },
  body:        { paddingHorizontal: 20, paddingTop: 18 },

  movieRow: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: CARD, borderRadius: 14,
    padding: 14, marginBottom: 16,
    borderWidth: 1, borderColor: "#2a2840",
  },
  movieIcon:  { width: 22, height: 22, marginRight: 10 },
  movieTitle: { color: "#fff", fontSize: 14, fontWeight: "600", flex: 1 },

  amountBox: {
    backgroundColor: "rgba(212,175,55,0.08)", borderRadius: 16,
    padding: 20, alignItems: "center", marginBottom: 16,
    borderWidth: 1, borderColor: "rgba(212,175,55,0.3)",
  },
  amountLabel: { color: GOLD, fontSize: 10, fontWeight: "800", letterSpacing: 1.5, marginBottom: 6 },
  amountValue: { color: GOLD, fontSize: 34, fontWeight: "900" },
  amountSub:   { color: "#666", fontSize: 11, marginTop: 6 },

  methodRow:  { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 20 },
  methodBadge:{
    backgroundColor: CARD, borderRadius: 10,
    paddingHorizontal: 10, paddingVertical: 6,
    borderWidth: 1, borderColor: "#2a2840",
  },
  methodText: { color: "#888", fontSize: 11 },

  label:    { color: "#fff", fontSize: 13, fontWeight: "700", marginBottom: 4 },
  sublabel: { color: "#666", fontSize: 11, marginBottom: 10 },
  input: {
    backgroundColor: CARD, borderRadius: 12, borderWidth: 1, borderColor: "#2a2840",
    color: "#fff", fontSize: 15, paddingHorizontal: 16, paddingVertical: 14,
    marginBottom: 8,
  },
  otpInput:   { fontSize: 28, fontWeight: "800", letterSpacing: 10, textAlign: "center" },
  inputError: { borderColor: "#EF4444" },
  errorText:  { color: "#EF4444", fontSize: 12, marginBottom: 8 },

  payBtn: {
    backgroundColor: GOLD, borderRadius: 14,
    paddingVertical: 15, alignItems: "center",
    marginTop: 8, marginBottom: 10,
    shadowColor: GOLD, shadowOpacity: 0.4, shadowRadius: 10, elevation: 6,
  },
  doneBtn: {
    backgroundColor: "#16a34a", borderRadius: 14,
    paddingVertical: 15, alignItems: "center", marginTop: 16,
  },
  btnDisabled: { opacity: 0.55 },
  payBtnText:  { color: "#000", fontSize: 16, fontWeight: "800" },
  secureNote:  { color: "#444", fontSize: 11, textAlign: "center", marginBottom: 8 },

  iconCenter: { alignItems: "center", marginVertical: 16 },
  bigIcon:    { fontSize: 52 },
  stepTitle:  { color: "#fff", fontSize: 22, fontWeight: "800", textAlign: "center", marginBottom: 8 },
  stepSub:    { color: "#888", fontSize: 14, textAlign: "center", lineHeight: 22, marginBottom: 20 },
  highlight:  { color: GOLD, fontWeight: "700" },

  row: {
    flexDirection: "row", justifyContent: "space-between",
    marginTop: 6, marginBottom: 8,
  },
  linkText: { color: "#666", fontSize: 12 },

  receiptBox: {
    backgroundColor: CARD, borderRadius: 14, padding: 16,
    marginVertical: 16, borderWidth: 1, borderColor: "#2a2840", gap: 8,
  },
  receiptRow: { color: "#A8B5DB", fontSize: 13 },
});

export default PaymentModal;
