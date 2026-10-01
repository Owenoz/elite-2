/**
 * Sports Screen — GEN Z CORNER
 *
 * Embeds fawanews.sc in a full-screen WebView browser with a navigation bar.
 * Uses http:// since the .sc domain has no valid SSL certificate.
 */
import {
    View,
    Text,
    TouchableOpacity,
    Image,
    ActivityIndicator,
    TextInput,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useState, useRef } from "react";
import WebView from "react-native-webview";
import { SafeAreaView } from "react-native-safe-area-context";
import { icons } from "@/constants/icons";

const HOME_URL = "http://fawanews.sc/";

// Sport category quick-links
const SPORT_LINKS = [
    { label: "⚽ Football", url: "http://fawanews.sc/football/" },
    { label: "🏀 Basketball", url: "http://fawanews.sc/basketball/" },
    { label: "🎾 Tennis", url: "http://fawanews.sc/tennis/" },
    { label: "🥊 UFC", url: "http://fawanews.sc/ufc/" },
    { label: "🏏 Cricket", url: "http://fawanews.sc/cricket/" },
    { label: "🏎️ F1", url: "http://fawanews.sc/formula-1/" },
];

const SportsScreen = () => {
    const webRef = useRef<WebView>(null);

    const [currentUrl, setCurrentUrl] = useState(HOME_URL);
    const [pageTitle, setPageTitle] = useState("FawaNews Sports");
    const [displayUrl, setDisplayUrl] = useState(HOME_URL);
    const [loading, setLoading] = useState(true);
    const [canGoBack, setCanGoBack] = useState(false);
    const [canGoForward, setCanGoForward] = useState(false);
    const [editingUrl, setEditingUrl] = useState(false);
    const [urlInput, setUrlInput] = useState(HOME_URL);
    const [showCategories, setShowCategories] = useState(true);

    const navigate = (url: string) => {
        setCurrentUrl(url);
        setShowCategories(false);
        setEditingUrl(false);
    };

    return (
        <View className="flex-1 bg-primary">
            <StatusBar style="light" />

            <SafeAreaView edges={["top"]} style={{ backgroundColor: "#0F0D23" }}>
                {/* ── Top bar ──────────────────────────── */}
                <View className="flex-row items-center px-3 pt-2 pb-1 gap-x-2">
                    {/* Brand */}
                    <View className="flex-row items-center gap-x-2">
                        <Text className="text-white font-bold text-base">⚽</Text>
                        <Text className="text-white font-bold text-sm">Sports</Text>
                    </View>

                    {/* URL bar */}
                    <TouchableOpacity
                        onPress={() => { setUrlInput(currentUrl); setEditingUrl(true); }}
                        className="flex-1 bg-dark-100 rounded-lg px-3 py-2"
                        activeOpacity={0.8}
                    >
                        {editingUrl ? (
                            <TextInput
                                value={urlInput}
                                onChangeText={setUrlInput}
                                autoFocus
                                returnKeyType="go"
                                className="text-white text-xs"
                                selectTextOnFocus
                                onSubmitEditing={() => {
                                    let url = urlInput.trim();
                                    if (!url.startsWith("http")) url = "http://" + url;
                                    navigate(url);
                                }}
                                onBlur={() => setEditingUrl(false)}
                            />
                        ) : (
                            <Text className="text-light-300 text-xs" numberOfLines={1}>
                                {pageTitle !== "FawaNews Sports" ? pageTitle : displayUrl}
                            </Text>
                        )}
                    </TouchableOpacity>

                    {/* Home */}
                    <TouchableOpacity
                        onPress={() => navigate(HOME_URL)}
                        className="bg-dark-100 p-2 rounded-full"
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                        <Image source={icons.home} className="size-4" tintColor="#AB8BFF" />
                    </TouchableOpacity>
                </View>

                {/* ── Nav row ──────────────────────────── */}
                <View className="flex-row items-center px-3 pb-2 gap-x-1">
                    <TouchableOpacity
                        onPress={() => webRef.current?.goBack()}
                        disabled={!canGoBack}
                        className="p-1.5"
                        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                    >
                        <Image
                            source={icons.arrow}
                            className="size-4"
                            style={{ transform: [{ rotate: "180deg" }] }}
                            tintColor={canGoBack ? "#fff" : "#3D4460"}
                        />
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => webRef.current?.goForward()}
                        disabled={!canGoForward}
                        className="p-1.5"
                        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                    >
                        <Image
                            source={icons.arrow}
                            className="size-4"
                            tintColor={canGoForward ? "#fff" : "#3D4460"}
                        />
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => webRef.current?.reload()}
                        className="p-1.5"
                        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                    >
                        {/* Reload icon — reuse search as circular arrow substitute */}
                        <Text className="text-light-200 text-xs">↻</Text>
                    </TouchableOpacity>

                    {/* Sport quick-link chips */}
                    <View className="flex-1 flex-row gap-x-1 overflow-hidden ml-1">
                        {SPORT_LINKS.slice(0, 3).map((s) => (
                            <TouchableOpacity
                                key={s.url}
                                onPress={() => navigate(s.url)}
                                className="px-2 py-1 rounded-full"
                                style={{ backgroundColor: "#221F3D" }}
                            >
                                <Text className="text-xs text-light-200">{s.label}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {loading && (
                        <ActivityIndicator size="small" color="#AB8BFF" style={{ marginLeft: 4 }} />
                    )}
                </View>

                {/* More sport links row */}
                <View className="flex-row gap-x-1 px-3 pb-2">
                    {SPORT_LINKS.slice(3).map((s) => (
                        <TouchableOpacity
                            key={s.url}
                            onPress={() => navigate(s.url)}
                            className="px-2 py-1 rounded-full"
                            style={{ backgroundColor: "#221F3D" }}
                        >
                            <Text className="text-xs text-light-200">{s.label}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Loading bar */}
                {loading && (
                    <View style={{ height: 2, backgroundColor: "#221F3D" }}>
                        <View style={{ height: 2, width: "55%", backgroundColor: "#AB8BFF" }} />
                    </View>
                )}
            </SafeAreaView>

            {/* ── WebView ──────────────────────────── */}
            <WebView
                ref={webRef}
                key={currentUrl}
                source={{ uri: currentUrl }}
                style={{ flex: 1, backgroundColor: "#030014" }}
                javaScriptEnabled
                domStorageEnabled
                allowsFullscreenVideo
                allowsInlineMediaPlayback
                mediaPlaybackRequiresUserAction={false}
                mixedContentMode="always"
                onLoadStart={() => setLoading(true)}
                onLoadEnd={() => setLoading(false)}
                onNavigationStateChange={(state) => {
                    setCanGoBack(state.canGoBack);
                    setCanGoForward(state.canGoForward);
                    if (state.url) { setDisplayUrl(state.url); setCurrentUrl(state.url); }
                    if (state.title && state.title !== "about:blank") setPageTitle(state.title);
                }}
                onError={() => setLoading(false)}
                applicationNameForUserAgent="Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 Chrome/120.0 Mobile Safari/537.36"
                injectedJavaScriptBeforeContentLoaded={`
                    document.documentElement.style.backgroundColor = '#030014';
                `}
            />
        </View>
    );
};

export default SportsScreen;
