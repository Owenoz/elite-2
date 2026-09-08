import React, { useState, useRef } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet,
  Modal, StatusBar, ActivityIndicator,
  Image, Dimensions, Alert, Linking,
} from "react-native";
import { WebView } from "react-native-webview";
import { icons } from "@/constants/icons";
import { getArchiveEmbedUrl } from "@/services/supabase";

const { width, height } = Dimensions.get("window");
const GOLD = "#D4AF37";

interface MoviePlayerProps {
  archiveIdentifier: string;   // Internet Archive item ID e.g. "TheGeneralBuster1926"
  archiveUrl?: string;          // Direct MP4 URL (optional — fallback)
  movieTitle: string;
  visible: boolean;
  onClose: () => void;
}

const MoviePlayer = ({
  archiveIdentifier,
  archiveUrl,
  movieTitle,
  visible,
  onClose,
}: MoviePlayerProps) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [useDirectUrl, setUseDirectUrl] = useState(false);

  // Primary: use Archive.org's own embed player (most reliable)
  // Fallback: load direct MP4 URL in WebView
  const embedUrl = getArchiveEmbedUrl(archiveIdentifier);

  const playerHtml = useDirectUrl && archiveUrl ? `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1">
        <style>
          * { margin:0; padding:0; box-sizing:border-box; }
          body { background:#000; width:100vw; height:100vh; overflow:hidden; display:flex; align-items:center; justify-content:center; }
          video {
            width:100%; height:100%;
            object-fit:contain;
            background:#000;
          }
          .controls {
            position:absolute; bottom:0; left:0; right:0;
            background:linear-gradient(transparent,rgba(0,0,0,0.9));
            padding:16px;
            display:flex; align-items:center; gap:12px;
          }
          button {
            background:rgba(212,175,55,0.2); border:1px solid #D4AF37;
            color:#D4AF37; border-radius:8px; padding:8px 16px;
            font-size:14px; cursor:pointer;
          }
        </style>
      </head>
      <body>
        <video id="player" controls autoplay playsinline preload="metadata">
          <source src="${archiveUrl}" type="video/mp4">
          Your browser does not support video playback.
        </video>
      </body>
    </html>
  ` : null;

  const handleClose = () => {
    setLoading(true);
    setError(false);
    setUseDirectUrl(false);
    onClose();
  };

  const handleOpenInBrowser = () => {
    const url = `https://archive.org/details/${archiveIdentifier}`;
    Linking.openURL(url).catch(() =>
      Alert.alert("Error", "Could not open browser")
    );
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

        {/* Header */}
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

        {/* Player */}
        <View style={S.playerBox}>

          {loading && !error && (
            <View style={S.loader}>
              <ActivityIndicator size="large" color={GOLD} />
              <Text style={S.loaderTitle}>Loading Movie...</Text>
              <Text style={S.loaderSub}>Streaming from Internet Archive</Text>
            </View>
          )}

          {error ? (
            <View style={S.errorBox}>
              <Text style={S.errorIcon}>🎬</Text>
              <Text style={S.errorTitle}>Couldn't stream in-app</Text>
              <Text style={S.errorSub}>
                This film can be watched directly on{"\n"}Internet Archive in your browser.
              </Text>
              <TouchableOpacity style={S.browserBtn} onPress={handleOpenInBrowser}>
                <Text style={S.browserBtnText}>🌐  Watch on Archive.org</Text>
              </TouchableOpacity>
              {archiveUrl && (
                <TouchableOpacity
                  style={[S.browserBtn, { backgroundColor: "#222", marginTop: 10 }]}
                  onPress={() => { setError(false); setLoading(true); setUseDirectUrl(true); }}
                >
                  <Text style={[S.browserBtnText, { color: GOLD }]}>
                    ▶  Try Direct Stream
                  </Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={S.goBackBtn} onPress={handleClose}>
                <Text style={S.goBackText}>← Go Back</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <WebView
              source={
                useDirectUrl && playerHtml
                  ? { html: playerHtml }
                  : { uri: embedUrl }
              }
              style={S.webview}
              javaScriptEnabled
              domStorageEnabled
              allowsFullscreenVideo
              allowsInlineMediaPlayback
              mediaPlaybackRequiresUserAction={false}
              userAgent="Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36"
              onLoadEnd={() => setLoading(false)}
              onError={() => { setLoading(false); setError(true); }}
              onHttpError={({ nativeEvent }) => {
                if (nativeEvent.statusCode >= 400) {
                  setLoading(false);
                  setError(true);
                }
              }}
            />
          )}
        </View>

        {/* Footer info */}
        <View style={S.footer}>
          <View style={S.footerRow}>
            <Text style={S.footerBadge}>📼 Public Domain</Text>
            <Text style={S.footerBadge}>🆓 Free to Watch</Text>
            <Text style={S.footerBadge}>📦 Internet Archive</Text>
          </View>
          <Text style={S.footerNote}>Elite Movies · Powered by Archive.org</Text>
        </View>

      </View>
    </Modal>
  );
};

const S = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#000" },
  header: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, paddingTop: 50, paddingBottom: 12,
    backgroundColor: "#000", borderBottomWidth: 1, borderBottomColor: "#1a1a1a",
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
  extBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: "rgba(212,175,55,0.15)",
    justifyContent: "center", alignItems: "center",
  },
  extText: { color: GOLD, fontSize: 18, fontWeight: "700" },
  playerBox: { flex: 1, backgroundColor: "#000" },
  loader: {
    position: "absolute", inset: 0, zIndex: 10,
    backgroundColor: "#000",
    justifyContent: "center", alignItems: "center", gap: 8,
  },
  loaderTitle: { color: "#fff", fontSize: 16, fontWeight: "700", marginTop: 8 },
  loaderSub: { color: "#666", fontSize: 12 },
  webview: { flex: 1, backgroundColor: "#000" },
  errorBox: {
    flex: 1, justifyContent: "center", alignItems: "center",
    paddingHorizontal: 32, backgroundColor: "#0a0a0a", gap: 12,
  },
  errorIcon: { fontSize: 52 },
  errorTitle: { color: "#fff", fontSize: 20, fontWeight: "700", textAlign: "center" },
  errorSub: { color: "#888", fontSize: 14, textAlign: "center", lineHeight: 22 },
  browserBtn: {
    backgroundColor: GOLD, borderRadius: 14,
    paddingHorizontal: 28, paddingVertical: 14,
    width: "100%", alignItems: "center",
  },
  browserBtnText: { color: "#000", fontSize: 15, fontWeight: "700" },
  goBackBtn: { paddingVertical: 8 },
  goBackText: { color: "#666", fontSize: 14 },
  footer: {
    backgroundColor: "#0a0a0a", paddingVertical: 14,
    alignItems: "center", gap: 8,
    borderTopWidth: 1, borderTopColor: "#1a1a1a",
  },
  footerRow: { flexDirection: "row", gap: 10 },
  footerBadge: {
    color: "#555", fontSize: 11,
    backgroundColor: "#111", borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 3,
    borderWidth: 1, borderColor: "#222",
  },
  footerNote: { color: "#333", fontSize: 11 },
});

export default MoviePlayer;
