import React, { useState, useRef, useCallback } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet,
  Modal, StatusBar, ActivityIndicator,
  Image, Dimensions, Alert, Linking,
} from "react-native";
import { Video, ResizeMode, AVPlaybackStatus } from "expo-av";
import { WebView } from "react-native-webview";
import { icons } from "@/constants/icons";
import { getArchiveEmbedUrl } from "@/services/eliteApi";

const { width, height } = Dimensions.get("window");
const GOLD = "#D4AF37";

interface MoviePlayerProps {
  archiveIdentifier: string;
  archiveUrl?: string;
  localUri?: string;
  movieTitle: string;
  visible: boolean;
  onClose: () => void;
}

type PlayerMode = "av" | "webview" | "error";

const MoviePlayer = ({
  archiveIdentifier,
  archiveUrl,
  localUri,
  movieTitle,
  visible,
  onClose,
}: MoviePlayerProps) => {
  // Decide mode:
  // - local file or direct archive URL → expo-av Video (native player)
  // - archive embed only → WebView
  const videoSource = localUri || archiveUrl || null;
  const initialMode: PlayerMode = videoSource ? "av" : "webview";

  const [mode,    setMode]    = useState<PlayerMode>(initialMode);
  const [loading, setLoading] = useState(true);
  const [status,  setStatus]  = useState<AVPlaybackStatus | null>(null);
  const videoRef = useRef<Video>(null);

  const isOffline = !!localUri;

  // Reset state when modal opens/closes
  const handleClose = () => {
    setMode(initialMode);
    setLoading(true);
    setStatus(null);
    onClose();
  };

  const handleOpenInBrowser = () => {
    Linking.openURL(`https://archive.org/details/${archiveIdentifier}`).catch(() =>
      Alert.alert("Error", "Could not open browser")
    );
  };

  // Called by expo-av on playback status updates
  const onPlaybackStatusUpdate = useCallback((s: AVPlaybackStatus) => {
    setStatus(s);
    if (s.isLoaded) {
      setLoading(false);
    }
    if (!s.isLoaded && s.error) {
      console.warn("AV Error:", s.error);
      // Fall back to WebView embed
      setMode(archiveUrl ? "webview" : "error");
      setLoading(true);
    }
  }, [archiveUrl]);

  // Archive embed HTML for WebView fallback
  const embedUrl = getArchiveEmbedUrl(archiveIdentifier);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <StatusBar hidden />
      <View style={S.root}>

        {/* ── Header ── */}
        <View style={S.header}>
          <TouchableOpacity onPress={handleClose} style={S.closeBtn}>
            <Image source={icons.arrow} style={S.closeIcon} tintColor="#fff" />
          </TouchableOpacity>
          <View style={S.headerCenter}>
            <Text style={S.headerLabel}>▶ NOW PLAYING</Text>
            <Text style={S.headerTitle} numberOfLines={1}>{movieTitle}</Text>
          </View>
          <TouchableOpacity onPress={handleOpenInBrowser} style={S.extBtn}>
            <Text style={S.extText}>↗</Text>
          </TouchableOpacity>
        </View>

        {/* ── Player Area ── */}
        <View style={S.playerBox}>

          {/* Loading overlay */}
          {loading && mode !== "error" && (
            <View style={S.loader}>
              <ActivityIndicator size="large" color={GOLD} />
              <Text style={S.loaderTitle}>Loading Movie…</Text>
              <Text style={S.loaderSub}>
                {mode === "av"
                  ? isOffline ? "Reading from device storage…" : "Buffering stream…"
                  : "Connecting to Internet Archive…"}
              </Text>
            </View>
          )}

          {mode === "av" && videoSource ? (
            /* ── Native expo-av player — works for file:// and https:// ── */
            <Video
              ref={videoRef}
              source={{ uri: videoSource }}
              style={S.video}
              resizeMode={ResizeMode.CONTAIN}
              useNativeControls
              shouldPlay
              onPlaybackStatusUpdate={onPlaybackStatusUpdate}
              onReadyForDisplay={() => setLoading(false)}
              onError={(err) => {
                console.warn("Video error:", err);
                // Try WebView embed fallback
                setMode("webview");
                setLoading(true);
              }}
            />
          ) : mode === "webview" ? (
            /* ── WebView embed fallback (archive.org embed player) ── */
            <WebView
              source={{ uri: embedUrl }}
              style={S.webview}
              javaScriptEnabled
              domStorageEnabled
              allowsFullscreenVideo
              allowsInlineMediaPlayback
              mediaPlaybackRequiresUserAction={false}
              userAgent="Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36"
              onLoadEnd={() => setLoading(false)}
              onError={() => { setLoading(false); setMode("error"); }}
              onHttpError={({ nativeEvent }) => {
                if (nativeEvent.statusCode >= 400) {
                  setLoading(false);
                  setMode("error");
                }
              }}
            />
          ) : (
            /* ── Error state ── */
            <View style={S.errorBox}>
              <Text style={S.errorIcon}>🎬</Text>
              <Text style={S.errorTitle}>Couldn't play this video</Text>
              <Text style={S.errorSub}>
                The video format may not be supported.{"\n"}
                Try watching on Internet Archive instead.
              </Text>
              <TouchableOpacity style={S.browserBtn} onPress={handleOpenInBrowser}>
                <Text style={S.browserBtnText}>🌐  Watch on Archive.org</Text>
              </TouchableOpacity>
              {videoSource && (
                <TouchableOpacity
                  style={[S.browserBtn, { backgroundColor: "#1a1a2e", marginTop: 10 }]}
                  onPress={() => { setMode("webview"); setLoading(true); }}
                >
                  <Text style={[S.browserBtnText, { color: GOLD }]}>
                    ▶  Try Embed Player
                  </Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={S.goBackBtn} onPress={handleClose}>
                <Text style={S.goBackText}>← Go Back</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* ── Footer ── */}
        <View style={S.footer}>
          <View style={S.footerRow}>
            <View style={[S.badge, isOffline && S.badgeGreen]}>
              <Text style={[S.badgeText, isOffline && { color: "#4ade80" }]}>
                {isOffline ? "📱 Offline" : "📡 Streaming"}
              </Text>
            </View>
            <View style={S.badge}>
              <Text style={S.badgeText}>🆓 Free to Watch</Text>
            </View>
            <View style={S.badge}>
              <Text style={S.badgeText}>📦 Internet Archive</Text>
            </View>
          </View>
          <Text style={S.footerNote}>
            Elite Movies · {isOffline ? "Playing from local storage" : "Streaming from Archive.org"}
          </Text>
        </View>

      </View>
    </Modal>
  );
};

const S = StyleSheet.create({
  root:       { flex: 1, backgroundColor: "#000" },

  header: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, paddingTop: 50, paddingBottom: 12,
    backgroundColor: "#000", borderBottomWidth: 1, borderBottomColor: "#1a1a1a",
  },
  closeBtn:   { width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.1)", justifyContent: "center", alignItems: "center" },
  closeIcon:  { width: 18, height: 18, transform: [{ rotate: "180deg" }] },
  headerCenter:{ flex: 1, alignItems: "center" },
  headerLabel: { color: GOLD, fontSize: 10, fontWeight: "800", letterSpacing: 2, marginBottom: 2 },
  headerTitle: { color: "#fff", fontSize: 14, fontWeight: "600" },
  extBtn:     { width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(212,175,55,0.15)", justifyContent: "center", alignItems: "center" },
  extText:    { color: GOLD, fontSize: 18, fontWeight: "700" },

  playerBox:  { flex: 1, backgroundColor: "#000", justifyContent: "center" },

  loader: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10, backgroundColor: "#000",
    justifyContent: "center", alignItems: "center", gap: 8,
  },
  loaderTitle: { color: "#fff", fontSize: 16, fontWeight: "700", marginTop: 8 },
  loaderSub:   { color: "#666", fontSize: 12 },

  // expo-av Video fills the player box
  video:      { width: "100%", height: "100%", backgroundColor: "#000" },
  webview:    { flex: 1, backgroundColor: "#000" },

  errorBox:   { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 32, backgroundColor: "#0a0a0a", gap: 12 },
  errorIcon:  { fontSize: 52 },
  errorTitle: { color: "#fff", fontSize: 20, fontWeight: "700", textAlign: "center" },
  errorSub:   { color: "#888", fontSize: 14, textAlign: "center", lineHeight: 22 },
  browserBtn: { backgroundColor: GOLD, borderRadius: 14, paddingHorizontal: 28, paddingVertical: 14, width: "100%", alignItems: "center" },
  browserBtnText: { color: "#000", fontSize: 15, fontWeight: "700" },
  goBackBtn:  { paddingVertical: 8 },
  goBackText: { color: "#666", fontSize: 14 },

  footer:     { backgroundColor: "#0a0a0a", paddingVertical: 14, alignItems: "center", gap: 8, borderTopWidth: 1, borderTopColor: "#1a1a1a" },
  footerRow:  { flexDirection: "row", gap: 8 },
  badge:      { backgroundColor: "#111", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: "#222" },
  badgeGreen: { borderColor: "rgba(22,163,74,0.3)", backgroundColor: "rgba(22,163,74,0.08)" },
  badgeText:  { color: "#555", fontSize: 11 },
  footerNote: { color: "#333", fontSize: 11 },
});

export default MoviePlayer;
