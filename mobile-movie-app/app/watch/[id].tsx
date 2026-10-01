/**
 * Watch Screen
 *
 * Handles two modes:
 *  1. TMDB mode (default): id = TMDB movie ID, uses VidSrc embed sources.
 *  2. Direct URL mode: url param is set — opens that URL directly in WebView.
 *     Used by Uganda CineBeta movies which have their own watch pages.
 */
import {
    View,
    Text,
    TouchableOpacity,
    Image,
    ActivityIndicator,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState, useRef } from "react";
import WebView from "react-native-webview";
import { SafeAreaView } from "react-native-safe-area-context";
import { icons } from "@/constants/icons";

// VidSrc sources for TMDB-based movies
const buildVidSrcSources = (tmdbId: string) => [
    { label: "VidSrc",  url: `https://vidsrc.io/embed/movie/${tmdbId}` },
    { label: "VidSrc2", url: `https://vidsrc.to/embed/movie/${tmdbId}` },
    { label: "VidSrc3", url: `https://vidsrc.xyz/embed/movie?tmdb=${tmdbId}` },
    { label: "2Embed",  url: `https://www.2embed.cc/embed/${tmdbId}` },
];

const WatchScreen = () => {
    const router = useRouter();
    const {
        id,
        title,
        url: directUrl,     // set for Uganda/CineBeta movies
        source: sourceName, // e.g. "CineBeta"
    } = useLocalSearchParams<{
        id: string;
        title?: string;
        url?: string;
        source?: string;
    }>();

    // If a direct URL is provided, use it as the only source
    const isDirectMode = !!directUrl;
    const sources = isDirectMode
        ? [{ label: sourceName ?? "CineBeta", url: decodeURIComponent(directUrl) }]
        : buildVidSrcSources(id);

    const [sourceIndex, setSourceIndex] = useState(0);
    const [webLoading, setWebLoading] = useState(true);
    const [webError, setWebError] = useState(false);
    const webRef = useRef<WebView>(null);

    const currentSource = sources[sourceIndex];

    const tryNextSource = () => {
        if (sourceIndex < sources.length - 1) {
            setSourceIndex((i) => i + 1);
            setWebLoading(true);
            setWebError(false);
        } else {
            setWebError(true);
        }
    };

    return (
        <View className="flex-1 bg-black">
            <StatusBar style="light" hidden />

            {/* ── Header ──────────────────────────────── */}
            <SafeAreaView edges={["top"]} style={{ backgroundColor: "#0F0D23" }}>
                <View className="flex-row items-center px-4 py-3 gap-x-3">
                    <TouchableOpacity
                        onPress={router.back}
                        className="bg-dark-100 p-2 rounded-full"
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                        <Image
                            source={icons.arrow}
                            className="size-5"
                            style={{ transform: [{ rotate: "180deg" }] }}
                            tintColor="#fff"
                        />
                    </TouchableOpacity>

                    <View className="flex-1">
                        <Text className="text-white font-bold text-base" numberOfLines={1}>
                            {title ?? "Watching"}
                        </Text>
                        <View className="flex-row items-center gap-x-1 mt-0.5">
                            {isDirectMode && (
                                <Text className="text-xs" style={{ color: "#FCDC04" }}>
                                    🇺🇬{" "}
                                </Text>
                            )}
                            <Text className="text-light-300 text-xs">
                                {currentSource.label}
                            </Text>
                        </View>
                    </View>

                    {/* Source switcher — only for TMDB mode (multiple sources) */}
                    {!isDirectMode && (
                        <View className="flex-row gap-x-1">
                            {sources.map((s, i) => (
                                <TouchableOpacity
                                    key={s.label}
                                    onPress={() => {
                                        setSourceIndex(i);
                                        setWebLoading(true);
                                        setWebError(false);
                                    }}
                                    className="px-2 py-1 rounded-md"
                                    style={{
                                        backgroundColor:
                                            i === sourceIndex ? "#AB8BFF" : "#221F3D",
                                    }}
                                >
                                    <Text
                                        className="text-xs font-semibold"
                                        style={{
                                            color: i === sourceIndex ? "#fff" : "#A8B5DB",
                                        }}
                                    >
                                        {i + 1}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}
                </View>
            </SafeAreaView>

            {/* ── Player ──────────────────────────────── */}
            <View className="flex-1 bg-black">
                {!webError ? (
                    <>
                        <WebView
                            ref={webRef}
                            key={currentSource.url}
                            source={{ uri: currentSource.url }}
                            style={{ flex: 1, backgroundColor: "#000" }}
                            allowsFullscreenVideo
                            allowsInlineMediaPlayback
                            mediaPlaybackRequiresUserAction={false}
                            javaScriptEnabled
                            domStorageEnabled
                            startInLoadingState={false}
                            onLoadStart={() => setWebLoading(true)}
                            onLoadEnd={() => setWebLoading(false)}
                            onError={() => tryNextSource()}
                            onHttpError={(e) => {
                                if (e.nativeEvent?.statusCode >= 400) tryNextSource();
                            }}
                            applicationNameForUserAgent="Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 Chrome/120.0"
                        />
                        {webLoading && (
                            <View
                                style={{
                                    position: "absolute",
                                    inset: 0,
                                    alignItems: "center",
                                    justifyContent: "center",
                                    backgroundColor: "#000",
                                }}
                            >
                                <ActivityIndicator size="large" color="#AB8BFF" />
                                <Text className="text-light-200 mt-3 text-sm">
                                    Loading {currentSource.label}…
                                </Text>
                                {isDirectMode && (
                                    <Text className="text-light-300 text-xs mt-1">
                                        Opening CineBeta Uganda
                                    </Text>
                                )}
                            </View>
                        )}
                    </>
                ) : (
                    <View className="flex-1 items-center justify-center px-8">
                        <Image
                            source={icons.play}
                            className="size-16 mb-5 opacity-30"
                            tintColor="#A8B5DB"
                        />
                        <Text className="text-white text-xl font-bold text-center mb-2">
                            Stream Unavailable
                        </Text>
                        <Text className="text-light-200 text-sm text-center mb-6 leading-5">
                            {isDirectMode
                                ? "Could not load the CineBeta stream. The movie may require a login on the CineBeta website."
                                : "All available sources failed. This can happen due to regional restrictions or downtime."}
                        </Text>
                        <TouchableOpacity
                            onPress={() => {
                                setSourceIndex(0);
                                setWebLoading(true);
                                setWebError(false);
                            }}
                            className="bg-accent px-6 py-3 rounded-xl mb-3"
                        >
                            <Text className="text-white font-bold">Try Again</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={router.back}>
                            <Text className="text-light-200 text-sm">Go Back</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        </View>
    );
};

export default WatchScreen;
