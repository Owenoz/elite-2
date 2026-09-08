import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  StatusBar,
  ActivityIndicator,
  Image,
  Dimensions,
  Alert,
  Linking,
} from "react-native";
import { WebView } from "react-native-webview";
import { icons } from "@/constants/icons";

const { width } = Dimensions.get("window");

interface TrailerPlayerProps {
  videoKey: string;
  movieTitle: string;
  visible: boolean;
  onClose: () => void;
}

// YouTube mobile watch URL — loads the actual YouTube player (not iframe embed)
// This avoids Error 153 which only affects iframe/embed usage in WebViews
const getYouTubeUrl = (key: string) =>
  `https://m.youtube.com/watch?v=${key}&autoplay=1`;

// Desktop Chrome UA makes YouTube serve the full-featured player
const DESKTOP_UA =
  "Mozilla/5.0 (Linux; Android 10; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36";

const TrailerPlayer = ({ videoKey, movieTitle, visible, onClose }: TrailerPlayerProps) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const handleOpenExternal = () => {
    const url = `https://www.youtube.com/watch?v=${videoKey}`;
    Linking.openURL(url).catch(() =>
      Alert.alert("Error", "Could not open YouTube")
    );
  };

  const handleClose = () => {
    setLoading(true);
    setError(false);
    onClose();
  };

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
            <Image
              source={icons.arrow}
              style={S.closeIcon}
              tintColor="#fff"
            />
          </TouchableOpacity>
          <View style={S.headerCenter}>
            <Text style={S.headerLabel}>▶ TRAILER</Text>
            <Text style={S.headerTitle} numberOfLines={1}>{movieTitle}</Text>
          </View>
          {/* External link fallback */}
          <TouchableOpacity onPress={handleOpenExternal} style={S.externalBtn}>
            <Text style={S.externalText}>↗</Text>
          </TouchableOpacity>
        </View>

        {/* ── Player ── */}
        <View style={S.playerWrapper}>
          {loading && !error && (
            <View style={S.loader}>
              <ActivityIndicator size="large" color="#D4AF37" />
              <Text style={S.loaderText}>Loading trailer...</Text>
            </View>
          )}

          {error ? (
            /* Error state with fallback button */
            <View style={S.errorState}>
              <Text style={S.errorIcon}>🎬</Text>
              <Text style={S.errorTitle}>Couldn't load in-app</Text>
              <Text style={S.errorSub}>
                YouTube is blocking playback here.{"\n"}Open it in the YouTube app instead.
              </Text>
              <TouchableOpacity style={S.youtubeBtn} onPress={handleOpenExternal}>
                <Text style={S.youtubeBtnText}>▶  Open in YouTube</Text>
              </TouchableOpacity>
              <TouchableOpacity style={S.closeAltBtn} onPress={handleClose}>
                <Text style={S.closeAltText}>← Go back</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <WebView
              source={{ uri: getYouTubeUrl(videoKey) }}
              style={S.webview}
              userAgent={DESKTOP_UA}
              javaScriptEnabled
              domStorageEnabled
              allowsFullscreenVideo
              allowsInlineMediaPlayback
              mediaPlaybackRequiresUserAction={false}
              onLoadEnd={() => setLoading(false)}
              onError={() => { setLoading(false); setError(true); }}
              onHttpError={(e) => {
                // HTTP errors like 4xx/5xx — show fallback
                if (e.nativeEvent.statusCode >= 400) {
                  setLoading(false);
                  setError(true);
                }
              }}
              // Inject JS to auto-click the play button if present
              injectedJavaScript={`
                setTimeout(() => {
                  const btn = document.querySelector('.play-btn, button[aria-label*="Play"], .ytp-play-button');
                  if (btn) btn.click();
                }, 1500);
                true;
              `}
            />
          )}
        </View>

        {/* ── Footer ── */}
        <View style={S.footer}>
          <Text style={S.footerNote}>🎬 Elite Movies · Official Trailer</Text>
          {!error && (
            <TouchableOpacity onPress={handleOpenExternal}>
              <Text style={S.openExternal}>Open in YouTube app ↗</Text>
            </TouchableOpacity>
          )}
        </View>

      </View>
    </Modal>
  );
};

const GOLD = "#D4AF37";

const S = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#000" },
  header: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, paddingTop: 50, paddingBottom: 14,
    backgroundColor: "#000",
    borderBottomWidth: 1, borderBottomColor: "#1a1a1a",
  },
  closeBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.1)",
    justifyContent: "center", alignItems: "center",
  },
  closeIcon: { width: 18, height: 18, transform: [{ rotate: "180deg" }] },
  headerCenter: { flex: 1, alignItems: "center" },
  headerLabel: { color: GOLD, fontSize: 10, fontWeight: "800", letterSpacing: 2, marginBottom: 2 },
  headerTitle: { color: "#fff", fontSize: 14, fontWeight: "600" },
  externalBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: "rgba(212,175,55,0.15)",
    justifyContent: "center", alignItems: "center",
  },
  externalText: { color: GOLD, fontSize: 18, fontWeight: "700" },
  playerWrapper: {
    flex: 1,
    backgroundColor: "#000",
  },
  loader: {
    position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: "center", alignItems: "center",
    backgroundColor: "#000", zIndex: 10,
  },
  loaderText: { color: GOLD, marginTop: 12, fontSize: 13 },
  webview: { flex: 1, backgroundColor: "#000" },
  errorState: {
    flex: 1, justifyContent: "center", alignItems: "center",
    paddingHorizontal: 32, backgroundColor: "#0a0a0a",
  },
  errorIcon: { fontSize: 56, marginBottom: 16 },
  errorTitle: { color: "#fff", fontSize: 20, fontWeight: "700", marginBottom: 8, textAlign: "center" },
  errorSub: { color: "#888", fontSize: 14, textAlign: "center", lineHeight: 22, marginBottom: 28 },
  youtubeBtn: {
    backgroundColor: "#FF0000", borderRadius: 12,
    paddingHorizontal: 28, paddingVertical: 14, marginBottom: 14,
  },
  youtubeBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  closeAltBtn: { paddingVertical: 8 },
  closeAltText: { color: "#666", fontSize: 14 },
  footer: {
    backgroundColor: "#000", paddingVertical: 16,
    alignItems: "center", gap: 6,
    borderTopWidth: 1, borderTopColor: "#1a1a1a",
  },
  footerNote: { color: "#333", fontSize: 11 },
  openExternal: { color: GOLD, fontSize: 12, fontWeight: "600" },
});

export default TrailerPlayer;
