import {
    View,
    Text,
    ScrollView,
    Image,
    FlatList,
    ActivityIndicator,
    TouchableOpacity,
    StyleSheet,
    Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import useFetch from "../../services/useFetch";
import { fetchMovies } from "@/services/api";
import { icons } from "@/constants/icons";
import { images } from "@/constants/images";
import { useState } from "react";
import MovieCard from "@/components/MovieCard";
import TrendingCard from "@/components/TrendingCard";
import SearchBar from "@/components/SearchBar";
import ErrorMessage from "@/components/ErrorMessage";
import { getTrending } from "@/services/eliteApi";

const { width } = Dimensions.get("window");

const GENRES = [
    { id: 28, name: "Action", emoji: "💥" },
    { id: 35, name: "Comedy", emoji: "😂" },
    { id: 18, name: "Drama", emoji: "🎭" },
    { id: 27, name: "Horror", emoji: "👻" },
    { id: 10749, name: "Romance", emoji: "❤️" },
    { id: 878, name: "Sci-Fi", emoji: "🚀" },
    { id: 28, name: "Thriller", emoji: "🔪" },
    { id: 16, name: "Animation", emoji: "🎨" },
];

const Index = () => {
    const router = useRouter();
    const [selectedGenre, setSelectedGenre] = useState<number | null>(null);

    const {
        data: trendingMovies,
        loading: trendingLoading,
        error: trendingError,
        refetch: refetchTrending,
    } = useFetch(() => getTrending(5));

    const {
        data: movies,
        loading: moviesLoading,
        error: moviesError,
        refetch: refetchMovies,
    } = useFetch(() => fetchMovies({ query: "" }));

    const handleRetry = () => { refetchTrending(); refetchMovies(); };

    if ((moviesError && trendingError) && !moviesLoading && !trendingLoading) {
        return (
            <View style={S.root}>
                <Image source={images.bg} style={S.bgAbs} resizeMode="cover" />
                <ErrorMessage
                    message="Failed to load movies. Please check your connection."
                    onRetry={handleRetry}
                />
            </View>
        );
    }

    return (
        <View style={S.root}>
            <Image source={images.bg} style={S.bgAbs} resizeMode="cover" />

            <ScrollView
                style={{ flex: 1 }}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 120 }}
            >
                {/* ── Header ── */}
                <View style={S.header}>
                    <View style={S.logoRow}>
                        <Image source={icons.logo} style={S.logoImg} resizeMode="contain" />
                        <View>
                            <Text style={S.brandName}>ELITE MOVIES</Text>
                            <Text style={S.brandTagline}>Watch · Stream · Enjoy</Text>
                        </View>
                    </View>
                    <TouchableOpacity style={S.notifBtn}>
                        <Text style={S.notifDot}>●</Text>
                    </TouchableOpacity>
                </View>

                {/* ── Search ── */}
                <View style={S.searchWrap}>
                    <SearchBar
                        onPress={() => router.push("/search")}
                        placeholder="Search movies, series..."
                    />
                </View>

                {/* ── Genre Chips ── */}
                <View style={S.section}>
                    <View style={S.sectionHeader}>
                        <Text style={S.sectionTitle}>Categories</Text>
                        <TouchableOpacity onPress={() => router.push("/categories")}>
                            <Text style={S.seeAll}>See All →</Text>
                        </TouchableOpacity>
                    </View>
                    <FlatList
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        data={GENRES}
                        keyExtractor={(item, i) => `${item.id}_${i}`}
                        contentContainerStyle={{ paddingLeft: 20, gap: 10 }}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={[
                                    S.genreChip,
                                    selectedGenre === item.id && S.genreChipActive,
                                ]}
                                onPress={() => {
                                    setSelectedGenre(item.id);
                                    router.push(`/genre/${item.id}?name=${item.name}`);
                                }}
                            >
                                <Text style={S.genreEmoji}>{item.emoji}</Text>
                                <Text style={[S.genreText, selectedGenre === item.id && S.genreTextActive]}>
                                    {item.name}
                                </Text>
                            </TouchableOpacity>
                        )}
                    />
                </View>

                {(moviesLoading || trendingLoading) && !movies && !trendingMovies ? (
                    <View style={S.loadingCenter}>
                        <ActivityIndicator size="large" color="#D4AF37" />
                        <Text style={S.loadingText}>Loading Elite content...</Text>
                    </View>
                ) : (
                    <>
                        {/* ── Trending ── */}
                        {!trendingError && trendingMovies && trendingMovies.length > 0 && (
                            <View style={S.section}>
                                <View style={S.sectionHeader}>
                                    <View style={S.sectionTitleRow}>
                                        <View style={S.goldBar} />
                                        <Text style={S.sectionTitle}>🔥 Trending Now</Text>
                                    </View>
                                </View>
                                <FlatList
                                    horizontal
                                    showsHorizontalScrollIndicator={false}
                                    data={trendingMovies}
                                    contentContainerStyle={{ paddingLeft: 20, gap: 14 }}
                                    renderItem={({ item, index }) => (
                                        <TrendingCard movie={{
                                            movie_id: item.movie_id,
                                            title: item.title,
                                            poster_url: item.poster_url,
                                        }} index={index} />
                                    )}
                                    keyExtractor={(item, i) => `trending_${item.movie_id}_${i}`}
                                />
                            </View>
                        )}

                        {/* ── Featured Banner (first movie) ── */}
                        {movies && movies.length > 0 && (
                            <View style={S.section}>
                                <TouchableOpacity
                                    activeOpacity={0.92}
                                    onPress={() => router.push(`/movies/${movies[0].id}`)}
                                    style={S.featuredCard}
                                >
                                    <Image
                                        source={{ uri: `https://image.tmdb.org/t/p/w780${movies[0].backdrop_path || movies[0].poster_path}` }}
                                        style={S.featuredImage}
                                        resizeMode="cover"
                                    />
                                    <LinearGradient
                                        colors={["transparent", "rgba(9,9,15,0.98)"]}
                                        style={S.featuredGradient}
                                    />
                                    <View style={S.featuredInfo}>
                                        <View style={S.featuredBadge}>
                                            <Text style={S.featuredBadgeText}>✦ FEATURED</Text>
                                        </View>
                                        <Text style={S.featuredTitle} numberOfLines={2}>
                                            {movies[0].title}
                                        </Text>
                                        <View style={S.featuredMeta}>
                                            <Text style={S.featuredRating}>
                                                ⭐ {movies[0].vote_average?.toFixed(1)}
                                            </Text>
                                            <Text style={S.featuredYear}>
                                                {movies[0].release_date?.split("-")[0]}
                                            </Text>
                                            <TouchableOpacity style={S.watchNowBtn}
                                                onPress={() => router.push(`/movies/${movies[0].id}`)}>
                                                <Text style={S.watchNowText}>▶ Watch Now</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            </View>
                        )}

                        {/* ── Latest Movies Grid ── */}
                        {movies && movies.length > 0 && (
                            <View style={S.section}>
                                <View style={S.sectionHeader}>
                                    <View style={S.sectionTitleRow}>
                                        <View style={S.goldBar} />
                                        <Text style={S.sectionTitle}>Latest Movies</Text>
                                    </View>
                                </View>
                                <FlatList
                                    data={movies.slice(1)}
                                    numColumns={3}
                                    scrollEnabled={false}
                                    keyExtractor={(item, i) => `latest_${item.id}_${i}`}
                                    contentContainerStyle={{ paddingHorizontal: 20 }}
                                    columnWrapperStyle={{ justifyContent: "flex-start", gap: 12, marginBottom: 14 }}
                                    renderItem={({ item }) => <MovieCard {...item} />}
                                />
                            </View>
                        )}
                    </>
                )}
            </ScrollView>
        </View>
    );
};

const GOLD = "#D4AF37";
const BG = "#09090F";
const CARD_BG = "#1C1B2E";

const S = StyleSheet.create({
    root: { flex: 1, backgroundColor: BG },
    bgAbs: { position: "absolute", width: "100%", height: "100%", opacity: 0.18 },
    header: {
        flexDirection: "row", justifyContent: "space-between", alignItems: "center",
        paddingHorizontal: 20, paddingTop: 56, paddingBottom: 8,
    },
    logoRow: { flexDirection: "row", alignItems: "center", gap: 10 },
    logoImg: { width: 38, height: 38 },
    brandName: { color: GOLD, fontSize: 18, fontWeight: "800", letterSpacing: 2 },
    brandTagline: { color: "#666", fontSize: 10, letterSpacing: 1.5, marginTop: 1 },
    notifBtn: { padding: 8 },
    notifDot: { color: GOLD, fontSize: 18 },
    searchWrap: { paddingHorizontal: 20, marginTop: 12, marginBottom: 4 },
    section: { marginTop: 24 },
    sectionHeader: {
        flexDirection: "row", justifyContent: "space-between",
        alignItems: "center", paddingHorizontal: 20, marginBottom: 14,
    },
    sectionTitleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
    goldBar: { width: 3, height: 18, backgroundColor: GOLD, borderRadius: 2 },
    sectionTitle: { color: "#fff", fontSize: 17, fontWeight: "700" },
    seeAll: { color: GOLD, fontSize: 13, fontWeight: "600" },
    genreChip: {
        flexDirection: "row", alignItems: "center", gap: 6,
        backgroundColor: CARD_BG, borderRadius: 24,
        paddingHorizontal: 14, paddingVertical: 9,
        borderWidth: 1, borderColor: "#2a2840",
    },
    genreChipActive: { backgroundColor: GOLD, borderColor: GOLD },
    genreEmoji: { fontSize: 14 },
    genreText: { color: "#A8B5DB", fontSize: 13, fontWeight: "600" },
    genreTextActive: { color: "#000" },
    loadingCenter: { alignItems: "center", marginTop: 60, gap: 12 },
    loadingText: { color: "#666", fontSize: 13 },
    featuredCard: {
        marginHorizontal: 20, borderRadius: 18, overflow: "hidden",
        height: 220,
        shadowColor: GOLD, shadowOpacity: 0.3, shadowRadius: 16, shadowOffset: { width: 0, height: 4 },
        elevation: 10,
    },
    featuredImage: { width: "100%", height: "100%", position: "absolute" },
    featuredGradient: { position: "absolute", bottom: 0, left: 0, right: 0, height: 160 },
    featuredInfo: { position: "absolute", bottom: 16, left: 16, right: 16 },
    featuredBadge: {
        backgroundColor: GOLD, alignSelf: "flex-start",
        paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4, marginBottom: 6,
    },
    featuredBadgeText: { color: "#000", fontSize: 9, fontWeight: "800", letterSpacing: 1.5 },
    featuredTitle: { color: "#fff", fontSize: 20, fontWeight: "800", marginBottom: 8 },
    featuredMeta: { flexDirection: "row", alignItems: "center", gap: 12 },
    featuredRating: { color: GOLD, fontSize: 13, fontWeight: "700" },
    featuredYear: { color: "#A8B5DB", fontSize: 13 },
    watchNowBtn: {
        backgroundColor: GOLD, borderRadius: 20,
        paddingHorizontal: 14, paddingVertical: 6, marginLeft: "auto",
    },
    watchNowText: { color: "#000", fontSize: 12, fontWeight: "700" },
});

export default Index;
