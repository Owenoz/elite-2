import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
} from "react-native";
import { icons } from "@/constants/icons";

interface PaymentModalProps {
  visible: boolean;
  movieTitle: string;
  onClose: () => void;
  onPaymentSuccess: (email: string) => void;
}

// Simulated verified email store (in production this would be a backend call)
const VERIFIED_EMAILS_KEY = "verified_emails";

// Simple in-memory store for this session
const verifiedEmails: Set<string> = new Set();

const PaymentModal = ({
  visible,
  movieTitle,
  onClose,
  onPaymentSuccess,
}: PaymentModalProps) => {
  const [step, setStep] = useState<"payment" | "verify" | "success">("payment");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [generatedOtp, setGeneratedOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [otpError, setOtpError] = useState("");

  const AMOUNT = "5,000 UGX";

  const isValidEmail = (e: string) => /\S+@\S+\.\S+/.test(e);

  const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

  const handlePayNow = async () => {
    if (!email) {
      setEmailError("Email is required");
      return;
    }
    if (!isValidEmail(email)) {
      setEmailError("Enter a valid email address");
      return;
    }
    setEmailError("");

    // If email was already verified in this session, skip OTP
    if (verifiedEmails.has(email.toLowerCase())) {
      setLoading(true);
      await new Promise((r) => setTimeout(r, 1000));
      setLoading(false);
      setStep("success");
      onPaymentSuccess(email.toLowerCase());
      return;
    }

    setLoading(true);
    // Simulate sending OTP to email
    await new Promise((r) => setTimeout(r, 1500));
    const code = generateOtp();
    setGeneratedOtp(code);
    setLoading(false);

    // In a real app this goes to backend — for demo we show it in an alert
    Alert.alert(
      "Verification Code Sent",
      `A 6-digit code has been sent to ${email}\n\n[Demo mode: your code is ${code}]`,
      [{ text: "OK" }]
    );
    setStep("verify");
  };

  const handleVerifyOtp = async () => {
    if (!otp) {
      setOtpError("Please enter the verification code");
      return;
    }
    if (otp !== generatedOtp) {
      setOtpError("Invalid code. Please try again.");
      return;
    }
    setOtpError("");
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1000));
    setLoading(false);

    // Mark email as verified for this session
    verifiedEmails.add(email.toLowerCase());

    setStep("success");
    onPaymentSuccess(email.toLowerCase());
  };

  const handleClose = () => {
    setStep("payment");
    setEmail("");
    setOtp("");
    setGeneratedOtp("");
    setEmailError("");
    setOtpError("");
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.overlay}
      >
        <View style={styles.overlay}>
          <TouchableOpacity style={styles.backdrop} onPress={handleClose} activeOpacity={1} />

          <View style={styles.sheet}>
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

              {/* Header */}
              <View style={styles.header}>
                <Text style={styles.headerTitle}>
                  {step === "success" ? "Payment Complete" : "Download Movie"}
                </Text>
                <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
                  <Text style={styles.closeX}>✕</Text>
                </TouchableOpacity>
              </View>

              {/* ─── STEP 1: Payment ─── */}
              {step === "payment" && (
                <View style={styles.body}>
                  {/* Movie info */}
                  <View style={styles.movieRow}>
                    <Image source={icons.play} style={styles.movieIcon} tintColor="#AB8BFF" />
                    <Text style={styles.movieTitle} numberOfLines={2}>{movieTitle}</Text>
                  </View>

                  {/* Amount */}
                  <View style={styles.amountBox}>
                    <Text style={styles.amountLabel}>Download Fee</Text>
                    <Text style={styles.amountValue}>{AMOUNT}</Text>
                    <Text style={styles.amountSub}>One-time payment per device</Text>
                  </View>

                  {/* Payment method badge */}
                  <View style={styles.methodRow}>
                    <View style={styles.methodBadge}>
                      <Text style={styles.methodText}>📱 Mobile Money</Text>
                    </View>
                    <View style={styles.methodBadge}>
                      <Text style={styles.methodText}>💳 Card</Text>
                    </View>
                  </View>

                  {/* Email field */}
                  <Text style={styles.label}>Email Address</Text>
                  <Text style={styles.sublabel}>
                    Used to verify your device and send confirmation
                  </Text>
                  <TextInput
                    style={[styles.input, emailError ? styles.inputError : null]}
                    placeholder="Enter your email"
                    placeholderTextColor="#6B7280"
                    value={email}
                    onChangeText={(t) => { setEmail(t); setEmailError(""); }}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  {!!emailError && <Text style={styles.errorText}>{emailError}</Text>}

                  {/* Pay button */}
                  <TouchableOpacity
                    style={[styles.payBtn, loading && styles.btnDisabled]}
                    onPress={handlePayNow}
                    disabled={loading}
                  >
                    {loading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.payBtnText}>Pay {AMOUNT} & Download</Text>
                    )}
                  </TouchableOpacity>

                  <Text style={styles.secureNote}>🔒 Secure payment · Device verified by email</Text>
                </View>
              )}

              {/* ─── STEP 2: OTP Verification ─── */}
              {step === "verify" && (
                <View style={styles.body}>
                  <View style={styles.otpIconWrap}>
                    <Text style={styles.otpIcon}>📧</Text>
                  </View>
                  <Text style={styles.otpTitle}>Check your email</Text>
                  <Text style={styles.otpSub}>
                    We sent a 6-digit code to{"\n"}
                    <Text style={styles.otpEmail}>{email}</Text>
                  </Text>

                  <Text style={styles.label}>Verification Code</Text>
                  <TextInput
                    style={[styles.input, styles.otpInput, otpError ? styles.inputError : null]}
                    placeholder="000000"
                    placeholderTextColor="#6B7280"
                    value={otp}
                    onChangeText={(t) => { setOtp(t); setOtpError(""); }}
                    keyboardType="number-pad"
                    maxLength={6}
                    textAlign="center"
                  />
                  {!!otpError && <Text style={styles.errorText}>{otpError}</Text>}

                  <TouchableOpacity
                    style={[styles.payBtn, loading && styles.btnDisabled]}
                    onPress={handleVerifyOtp}
                    disabled={loading}
                  >
                    {loading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.payBtnText}>Verify & Download</Text>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity onPress={() => setStep("payment")} style={styles.backLink}>
                    <Text style={styles.backLinkText}>← Change email</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* ─── STEP 3: Success ─── */}
              {step === "success" && (
                <View style={styles.body}>
                  <View style={styles.successIconWrap}>
                    <Text style={styles.successIcon}>✅</Text>
                  </View>
                  <Text style={styles.successTitle}>Download Started!</Text>
                  <Text style={styles.successSub}>
                    Payment confirmed for{"\n"}
                    <Text style={styles.otpEmail}>{email}</Text>
                  </Text>
                  <Text style={styles.successMovie} numberOfLines={2}>{movieTitle}</Text>

                  <TouchableOpacity style={styles.doneBtn} onPress={handleClose}>
                    <Text style={styles.payBtnText}>Done</Text>
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

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "flex-end" },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.6)" },
  sheet: {
    backgroundColor: "#0F0D23",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 40,
    borderTopWidth: 1,
    borderColor: "#1a1836",
    maxHeight: "90%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderColor: "#1a1836",
  },
  headerTitle: { color: "#fff", fontSize: 18, fontWeight: "700" },
  closeBtn: { padding: 4 },
  closeX: { color: "#9CA4AB", fontSize: 18 },
  body: { paddingHorizontal: 20, paddingTop: 16 },
  movieRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1a1836",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  movieIcon: { width: 24, height: 24, marginRight: 10 },
  movieTitle: { color: "#fff", fontSize: 14, fontWeight: "600", flex: 1 },
  amountBox: {
    backgroundColor: "#AB8BFF20",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#AB8BFF40",
  },
  amountLabel: { color: "#9CA4AB", fontSize: 12, marginBottom: 4 },
  amountValue: { color: "#AB8BFF", fontSize: 28, fontWeight: "800" },
  amountSub: { color: "#6B7280", fontSize: 11, marginTop: 4 },
  methodRow: { flexDirection: "row", gap: 8, marginBottom: 20 },
  methodBadge: {
    backgroundColor: "#1a1836",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "#2a2850",
  },
  methodText: { color: "#9CA4AB", fontSize: 12 },
  label: { color: "#fff", fontSize: 14, fontWeight: "600", marginBottom: 4 },
  sublabel: { color: "#9CA4AB", fontSize: 12, marginBottom: 10 },
  input: {
    backgroundColor: "#1a1836",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#2a2850",
    color: "#fff",
    fontSize: 15,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 8,
  },
  otpInput: { fontSize: 24, fontWeight: "700", letterSpacing: 8 },
  inputError: { borderColor: "#EF4444" },
  errorText: { color: "#EF4444", fontSize: 12, marginBottom: 8 },
  payBtn: {
    backgroundColor: "#AB8BFF",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
    marginBottom: 8,
  },
  doneBtn: {
    backgroundColor: "#22c55e",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 16,
  },
  btnDisabled: { opacity: 0.6 },
  payBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  secureNote: { color: "#6B7280", fontSize: 11, textAlign: "center", marginTop: 8 },
  otpIconWrap: { alignItems: "center", marginVertical: 16 },
  otpIcon: { fontSize: 48 },
  otpTitle: { color: "#fff", fontSize: 20, fontWeight: "700", textAlign: "center", marginBottom: 8 },
  otpSub: { color: "#9CA4AB", fontSize: 14, textAlign: "center", marginBottom: 24, lineHeight: 22 },
  otpEmail: { color: "#AB8BFF", fontWeight: "700" },
  backLink: { alignItems: "center", marginTop: 12 },
  backLinkText: { color: "#9CA4AB", fontSize: 13 },
  successIconWrap: { alignItems: "center", marginVertical: 16 },
  successIcon: { fontSize: 56 },
  successTitle: { color: "#fff", fontSize: 22, fontWeight: "800", textAlign: "center", marginBottom: 8 },
  successSub: { color: "#9CA4AB", fontSize: 14, textAlign: "center", marginBottom: 12, lineHeight: 22 },
  successMovie: { color: "#AB8BFF", fontSize: 15, fontWeight: "600", textAlign: "center", marginBottom: 8 },
});

export default PaymentModal;
