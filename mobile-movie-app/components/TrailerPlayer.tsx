import React, { useState } from "react";
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
} from "react-native";
import { WebView } from "react-native-webview";
import { icons } from "@/constants/icons";

const { width, height } = Dimensions.get("window");

interface TrailerPlayerProps {
  videoKey: string;       // YouTube video key e.g. "dQw4w9WgXcQ"
  movieTitle: string;
  visible: boolean;
  onClose: () => void;
}

const TrailerPlayer = ({ videoKey, movieTitle, visible, onClose }: TrailerPlayerProps) => {
  const [loading, setLoading] = useState(true);

  const embedUrl = `https://www.youtube.com/embed/${videoKey}?autoplay=1&rel=0&modestbranding=1&playsinline=1`;

  // Full-screen HTML that hosts the YouTube iframe — fills the WebView completely
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { background: #000; width: 100vw; height: 100vh; overflow: hidden; }
          iframe {
            position: absolute; top: 0; left: 0;
            width: 100%; height: 100%;
            border: none;
          }
        </style>
      </head>
      <body>
        <iframe
          src="${embedUrl}"
          allow="autoplay; fullscreen; encrypted-media"
          allowfullscreen
        ></iframe>
      </body>
    </html>
  `;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <StatusBar hidden />
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Image source={icons.arrow} style={styles.closeIcon} tintColor="#fff" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerLabel}>TRAILER</Text>
            <Text style={styles.headerTitle} numberOfLines={1}>{movieTitle}</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>

        {/* Player */}
        <View style={styles.playerWrapper}>
          {loading && (
            <View style={styles.loader}>
              <ActivityIndicator size="large" color="#D4AF37" />
              <Text style={styles.loaderText}>Loading trailer...</Text>
            </View>
          )}
          <WebView
            source={{ html }}
            style={styles.webview}
            javaScriptEnabled
            allowsFullscreenVideo
            mediaPlaybackRequiresUserAction={false}
            onLoadEnd={() => setLoading(false)}
            onError={() => setLoading(false)}
            scrollEnabled={false}
            bounces={false}
          />
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerNote}>🎬 Elite Movies · Official Trailer</Text>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 12,
    backgroundColor: "#000",
  },
  closeBtn: {
    width: 40, height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.12)",
    justifyContent: "center", alignItems: "center",
  },
  closeIcon: { width: 18, height: 18, transform: [{ rotate: "180deg" }] },
  headerCenter: { flex: 1, alignItems: "center" },
  headerLabel: { color: "#D4AF37", fontSize: 10, fontWeight: "700", letterSpacing: 2, marginBottom: 2 },
  headerTitle: { color: "#fff", fontSize: 14, fontWeight: "600" },
  playerWrapper: {
    width: width,
    height: width * (9 / 16),
    backgroundColor: "#000",
  },
  loader: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
    zIndex: 10,
  },
  loaderText: { color: "#D4AF37", marginTop: 12, fontSize: 13 },
  webview: { flex: 1, backgroundColor: "#000" },
  footer: {
    flex: 1,
    backgroundColor: "#0a0a0a",
    justifyContent: "flex-end",
    alignItems: "center",
    paddingBottom: 40,
  },
  footerNote: { color: "#444", fontSize: 12 },
});

export default TrailerPlayer;
