/**
 * Kulutimbe Browser
 *
 * Kulutimbe is a pure client-side SPA — no accessible API.
 * We open it in a full-screen WebView with a navigation bar so
 * users can browse its 22+ pages of VJ-translated movies natively.
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
import { useRouter } from "expo-router";
import { useState, useRef } from "react";
import WebView from "react-native-webview";
import { SafeAreaView } from "react-native-safe-area-context";
import { icons } from "@/constants/icons";

const HOME_URL = "https://kulutimbe.com/movies";

const KulutimbeScreen = () => {
    const router = useRouter();
    const webRef = useRef<WebView>(null);

    const [currentUrl, setCurrentUrl] = useState(HOME_URL);
    const [displayUrl, setDisplayUrl] = useState(HOME_URL);
    const [loading, setLoading] = useState(true);
    const [canGoBack, setCanGoBack] = useState(false);
    const [canGoForward, setCanGoForward] = useState(false);
    const [pageTitle, setPageTitle] = useState("Kulutimbe");
    const [editingUrl, setEditingUrl] = useState(false);
    const [urlInput, setUrlInput] = useState(HOME_URL);

    return (
        <View className="flex-1 bg-black">
            <StatusBar style="light" />

            <SafeAreaView edges={["top"]} style={{ backgroundColor: "#0F0D23" }}>
                {/* ── Top bar ──────────────────────────── */}
                <View className="flex-row items-center px-3 py-2 gap-x-2">
                    {/* Back to app */}
                    <TouchableOpacity
                        onPress={router.back}
                        className="bg-dark-100 p-2 rounded-full"
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                        <Image
                            source={icons.arrow}
                            className="size-4"
                            style={{ transform: [{ rotate: "180deg" }] }}
                            tintColor="#fff"
                        />
                    </TouchableOpacity>

                    {/* URL / title bar */}
                    <TouchableOpacity
                        onPress={() => {
                            setUrlInput(currentUrl);
                            setEditingUrl(true);
                        }}
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
                                    if (!url.startsWith("http")) url = "https://" + url;
                                    setCurrentUrl(url);
                                    setEditingUrl(false);
                                }}
                                onBlur={() => setEditingUrl(false)}
                            />
                        ) : (
                            <View>
                                <Text className="text-white text-xs font-semibold" numberOfLines={1}>
                                    {pageTitle}
                                </Text>
                                <Text className="text-light-300 text-xs" numberOfLines={1}>
                                    {displayUrl}
                                </Text>
                            </View>
                        )}
                    </TouchableOpacity>

                    {/* Kulutimbe home */}
                    <TouchableOpacity
                        onPress={() => setCurrentUrl(HOME_URL)}
                        className="bg-dark-100 p-2 rounded-full"
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                        <Image source={icons.home} className="size-4" tintColor="#FCDC04" />
                    </TouchableOpacity>
                </View>

                {/* ── Nav bar ──────────────────────────── */}
                <View className="flex-row items-center px-3 pb-2 gap-x-3">
                    {/* Back */}
                    <TouchableOpacity
                        onPress={() => webRef.current?.goBack()}
                        disabled={!canGoBack}
                        className="p-1.5"
                    >
                        <Image
                            source={icons.arrow}
                            className="size-5"
                            style={{ transform: [{ rotate: "180deg" }] }}
                            tintColor={canGoBack ? "#fff" : "#3D4460"}
                        />
                    </TouchableOpacity>

                    {/* Forward */}
                    <TouchableOpacity
                        onPress={() => webRef.current?.goForward()}
                        disabled={!canGoForward}
                        className="p-1.5"
                    >
                        <Image
                            source={icons.arrow}
                            className="size-5"
                            tintColor={canGoForward ? "#fff" : "#3D4460"}
                        />
                    </TouchableOpacity>

                    {/* Refresh */}
                    <TouchableOpacity onPress={() => webRef.current?.reload()} className="p-1.5">
                        <Image source={icons.search} className="size-4" tintColor="#A8B5DB" />
                    </TouchableOpacity>

                    {/* Kulutimbe brand */}
                    <View className="flex-1" />
                    <View className="flex-row items-center gap-x-1.5">
                        <View className="flex-row overflow-hidden rounded-sm" style={{ width: 18, height: 12 }}>
                            <View style={{ flex: 1, backgroundColor: "#000000" }} />
                            <View style={{ flex: 1, backgroundColor: "#FCDC04" }} />
                            <View style={{ flex: 1, backgroundColor: "#DE3908" }} />
                        </View>
                        <Text className="text-white text-xs font-bold">Kulutimbe</Text>
                        <Text className="text-light-300 text-xs">· VJ Movies</Text>
                    </View>

                    {/* Loading indicator */}
                    {loading && (
                        <ActivityIndicator size="small" color="#FCDC04" style={{ marginLeft: 8 }} />
                    )}
                </View>

                {/* Thin progress indicator */}
                {loading && (
                    <View style={{ height: 2, backgroundColor: "#221F3D" }}>
                        <View style={{ height: 2, width: "60%", backgroundColor: "#FCDC04" }} />
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
                onLoadStart={() => setLoading(true)}
                onLoadEnd={() => setLoading(false)}
                onNavigationStateChange={(state) => {
                    setCanGoBack(state.canGoBack);
                    setCanGoForward(state.canGoForward);
                    if (state.url) setDisplayUrl(state.url);
                    if (state.title) setPageTitle(state.title);
                    setCurrentUrl(state.url ?? currentUrl);
                }}
                applicationNameForUserAgent="Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 Chrome/120.0 Mobile Safari/537.36"
                // Inject dark background immediately to avoid white flash
                injectedJavaScriptBeforeContentLoaded={`
                    document.documentElement.style.backgroundColor = '#030014';
                    document.documentElement.style.color = '#ffffff';
                `}
            />
        </View>
    );
};

export default KulutimbeScreen;
