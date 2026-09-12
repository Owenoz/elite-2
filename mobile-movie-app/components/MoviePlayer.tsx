import React, { useState, useRef } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet,
  Modal, StatusBar, ActivityIndicator,
  Image, Dimensions, Alert, Linking,
} from "react-native";
import { WebView } from "react-native-webview";
import { icons } from "@/constants/icons";
import { getArchiveEmbedUrl } from "@/services/eliteApi";

const { width, height } = Dimensions.get("window");
const GOLD = "#D4AF37";

interface MoviePlayerProps {
  archiveIdentifier: string;
  archiveUrl?: string;
  localUri?: string;           // local file:// path — used first if available
  movieTitle: string;
  visible: boolean;
  onClose: () => void;
}

const MoviePlayer = ({
  archiveIdentifier,
  archiveUrl,
  localUri,
  movieTitle,
  visible,
  onClose,
}: MoviePlayerProps) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [useDirectUrl, setUseDirectUrl] = useState(false);

  // Priority: local file → archive direct URL → archive embed
  const isOffline = !!localUri;
  const embedUrl  = localUri
    ? null                                    // local file — use HTML5 player
    : getArchiveEmbedUrl(archiveIdentifier);  // stream from archive.org

  const playerHtml = (useDirectUrl && archiveUrl) || localUri ? `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1">
        <style>
          * { margin:0; padding:0; box-sizing:border-box; }
          body { background:#000; width:100vw; height:100vh; overflow:hidden; display:flex; align-items:center; justify-content:center; }
          video { width:100%; height:100%; object-fit:contain; background:#000; }
        </style>
      </head>
      <body>
        <video id="player" controls autoplay playsinline preload="metadata">
          <source src="${localUri || archiveUrl}" type="video/mp4">
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
                playerHtml
                  ? { html: playerHtml }
                  : { uri: embedUrl! }
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
            {isOffline
              ? <Text style={[S.footerBadge, { color: "#4ade80", borderColor: "rgba(22,163,74,0.3)" }]}>📱 Offline</Text>
              : <Text style={S.footerBadge}>📼 Public Domain</Text>
            }
            <Text style={S.footerBadge}>🆓 Free to Watch</Text>
            <Text style={S.footerBadge}>📦 Internet Archive</Text>
          </View>
          <Text style={S.footerNote}>Elite Movies · {isOffline ? "Playing from local storage" : "Streaming from Archive.org"}</Text>
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
