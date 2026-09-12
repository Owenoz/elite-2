import {
    View, Text, ScrollView, Image, FlatList,
    ActivityIndicator, TouchableOpacity, StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";
import useFetch from "../../services/useFetch";
import { icons } from "@/constants/icons";
import { images } from "@/constants/images";
import SearchBar from "@/components/SearchBar";
import { getAvailableMovies, getTrending, type EliteMovie, type TrendingSearch } from "@/services/eliteApi";

// ── EliteMovieCard — uses your DB poster_path (TMDB format) ──────────────────
const EliteMovieCard = ({ movie }: { movie: EliteMovie }) => {
    const router = useRouter();
    const posterUrl = movie.poster_path
        ? `https://image.tmdb.org/t/p/w342${movie.poster_path}`
        : "https://placehold.co/342x513/1C1B2E/D4AF37.png";

    return (
        <TouchableOpacity
            style={EC.card}
            activeOpacity={0.85}
            onPress={() => router.push(`/movies/${movie.tmdb_id}`)}
        >
            <View style={EC.posterWrap}>
                <Image source={{ uri: posterUrl }} style={EC.poster} resizeMode="cover" />
                <View style={EC.ratingBadge}>
                    <Text style={EC.ratingText}>⭐ {movie.vote_average?.toFixed(1)}</Text>
                </View>
            </View>
            <Text style={EC.title} numberOfLines={2}>{movie.title}</Text>
            <Text style={EC.year}>{movie.release_year}</Text>
        </TouchableOpacity>
    );
};

const EC = StyleSheet.create({
    card: { width: "30%", marginBottom: 4 },
    posterWrap: { position: "relative", borderRadius: 12, overflow: "hidden" },
    poster: { width: "100%", height: 160, borderRadius: 12 },
    ratingBadge: {
        position: "absolute", top: 6, left: 6,
        backgroundColor: "rgba(0,0,0,0.75)", paddingHorizontal: 6, paddingVertical: 2,
        borderRadius: 8, borderWidth: 1, borderColor: "rgba(212,175,55,0.3)",
    },
    ratingText: { color: "#D4AF37", fontSize: 9, fontWeight: "700" },
    title: { color: "#E5E5E5", fontSize: 11, fontWeight: "600", marginTop: 6, lineHeight: 15 },
    year: { color: "#555", fontSize: 10, marginTop: 2 },
});

const GOLD = "#D4AF37";
const BG   = "#09090F";
const CARD = "#1C1B2E";

const Index = () => {
    const router = useRouter();

    // Only load movies from YOUR database
    const {
        data: movies,
        loading: moviesLoading,
        error: moviesError,
        refetch,
    } = useFetch(() => getAvailableMovies(1, 50));

    const eliteMovies: EliteMovie[] = (movies as EliteMovie[]) || [];

    if (moviesLoading && !eliteMovies.length) {
        return (
            <View style={[S.root, { justifyContent: "center", alignItems: "center" }]}>
                <Image source={images.bg} style={S.bgAbs} resizeMode="cover" />
                <ActivityIndicator size="large" color={GOLD} />
                <Text style={S.loadingText}>Loading Elite Movies...</Text>
            </View>
        );
    }

    if (moviesError && !eliteMovies.length) {
        return (
            <View style={[S.root, { justifyContent: "center", alignItems: "center", paddingHorizontal: 32 }]}>
                <Image source={images.bg} style={S.bgAbs} resizeMode="cover" />
                <Text style={{ fontSize: 40, marginBottom: 16 }}>📡</Text>
                <Text style={{ color: "#fff", fontSize: 18, fontWeight: "700", textAlign: "center", marginBottom: 8 }}>
                    Could not connect
                </Text>
                <Text style={{ color: "#666", fontSize: 13, textAlign: "center", marginBottom: 24 }}>
                    Check your internet connection
                </Text>
                <TouchableOpacity style={{ backgroundColor: GOLD, borderRadius: 12, paddingHorizontal: 28, paddingVertical: 12 }} onPress={refetch}>
                    <Text style={{ color: "#000", fontWeight: "700" }}>Try Again</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const featured = eliteMovies[0];
    const rest     = eliteMovies.slice(1);

    return (
        <View style={S.root}>
            <Image source={images.bg} style={S.bgAbs} resizeMode="cover" />

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>

                {/* ── Header ── */}
                <View style={S.header}>
                    <View style={S.logoRow}>
                        <Image source={icons.logo} style={S.logoImg} resizeMode="contain" />
                        <View>
                            <Text style={S.brandName}>ELITE MOVIES</Text>
                            <Text style={S.brandTagline}>Watch · Stream · Enjoy</Text>
                        </View>
                    </View>
                </View>

                {/* ── Search bar ── */}
                <View style={S.searchWrap}>
                    <SearchBar onPress={() => router.push("/search")} placeholder="Search movies..." />
                </View>

                {eliteMovies.length === 0 ? (
                    <View style={S.emptyState}>
                        <Text style={S.emptyIcon}>🎬</Text>
                        <Text style={S.emptyTitle}>No Movies Yet</Text>
                        <Text style={S.emptySubtitle}>
                            The admin hasn't added any movies yet.{"\n"}Check back soon!
                        </Text>
                    </View>
                ) : (
                    <>
                        {/* ── Featured Banner ── */}
                        {featured && (
                            <View style={S.section}>
                                <TouchableOpacity
                                    activeOpacity={0.92}
                                    onPress={() => router.push(`/movies/${featured.tmdb_id}`)}
                                    style={S.featuredCard}
                                >
                                    <Image
                                        source={{
                                            uri: featured.backdrop_path
                                                ? `https://image.tmdb.org/t/p/w780${featured.backdrop_path}`
                                                : featured.poster_path
                                                    ? `https://image.tmdb.org/t/p/w780${featured.poster_path}`
                                                    : "https://placehold.co/780x440/1C1B2E/D4AF37.png",
                                        }}
                                        style={S.featuredImage}
                                        resizeMode="cover"
                                    />
                                    {/* Pure View gradient — no native module needed */}
                                    <View style={S.featuredGradient} />
                                    <View style={S.featuredInfo}>
                                        <View style={S.featuredBadge}>
                                            <Text style={S.featuredBadgeText}>✦ FEATURED</Text>
                                        </View>
                                        <Text style={S.featuredTitle} numberOfLines={2}>{featured.title}</Text>
                                        <View style={S.featuredMeta}>
                                            <Text style={S.featuredRating}>⭐ {featured.vote_average?.toFixed(1)}</Text>
                                            <Text style={S.featuredYear}>{featured.release_year}</Text>
                                            <TouchableOpacity
                                                style={S.watchNowBtn}
                                                onPress={() => router.push(`/movies/${featured.tmdb_id}`)}
                                            >
                                                <Text style={S.watchNowText}>▶ Watch Now</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            </View>
                        )}

                        {/* ── All Movies Grid ── */}
                        {rest.length > 0 && (
                            <View style={S.section}>
                                <View style={S.sectionHeader}>
                                    <View style={S.sectionTitleRow}>
                                        <View style={S.goldBar} />
                                        <Text style={S.sectionTitle}>All Movies</Text>
                                    </View>
                                    <Text style={S.movieCount}>{eliteMovies.length} movies</Text>
                                </View>
                                <FlatList
                                    data={rest}
                                    numColumns={3}
                                    scrollEnabled={false}
                                    keyExtractor={(item) => `elite_${item.id}`}
                                    contentContainerStyle={{ paddingHorizontal: 20 }}
                                    columnWrapperStyle={{ justifyContent: "flex-start", gap: 12, marginBottom: 14 }}
                                    renderItem={({ item }) => <EliteMovieCard movie={item} />}
                                />
                            </View>
                        )}
                    </>
                )}
            </ScrollView>
        </View>
    );
};

const S = StyleSheet.create({
    root:           { flex: 1, backgroundColor: BG },
    bgAbs:          { position: "absolute", width: "100%", height: "100%", opacity: 0.18 },
    header:         { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingTop: 56, paddingBottom: 8 },
    logoRow:        { flexDirection: "row", alignItems: "center", gap: 10 },
    logoImg:        { width: 38, height: 38 },
    brandName:      { color: GOLD, fontSize: 18, fontWeight: "800", letterSpacing: 2 },
    brandTagline:   { color: "#666", fontSize: 10, letterSpacing: 1.5, marginTop: 1 },
    searchWrap:     { paddingHorizontal: 20, marginTop: 12, marginBottom: 4 },
    section:        { marginTop: 24 },
    sectionHeader:  { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, marginBottom: 14 },
    sectionTitleRow:{ flexDirection: "row", alignItems: "center", gap: 8 },
    goldBar:        { width: 3, height: 18, backgroundColor: GOLD, borderRadius: 2 },
    sectionTitle:   { color: "#fff", fontSize: 17, fontWeight: "700" },
    movieCount:     { color: "#666", fontSize: 12 },
    loadingText:    { color: "#666", fontSize: 13, marginTop: 12 },
    featuredCard:   { marginHorizontal: 20, borderRadius: 18, overflow: "hidden", height: 220, elevation: 10 },
    featuredImage:  { width: "100%", height: "100%", position: "absolute" },
    featuredGradient:{ position: "absolute", bottom: 0, left: 0, right: 0, height: 160, backgroundColor: "rgba(9,9,15,0.7)" },
    featuredInfo:   { position: "absolute", bottom: 16, left: 16, right: 16 },
    featuredBadge:  { backgroundColor: GOLD, alignSelf: "flex-start", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4, marginBottom: 6 },
    featuredBadgeText:{ color: "#000", fontSize: 9, fontWeight: "800", letterSpacing: 1.5 },
    featuredTitle:  { color: "#fff", fontSize: 20, fontWeight: "800", marginBottom: 8 },
    featuredMeta:   { flexDirection: "row", alignItems: "center", gap: 12 },
    featuredRating: { color: GOLD, fontSize: 13, fontWeight: "700" },
    featuredYear:   { color: "#A8B5DB", fontSize: 13 },
    watchNowBtn:    { backgroundColor: GOLD, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6, marginLeft: "auto" },
    watchNowText:   { color: "#000", fontSize: 12, fontWeight: "700" },
    emptyState:     { alignItems: "center", marginTop: 80, paddingHorizontal: 40 },
    emptyIcon:      { fontSize: 56, marginBottom: 16 },
    emptyTitle:     { color: "#fff", fontSize: 20, fontWeight: "700", marginBottom: 8, textAlign: "center" },
    emptySubtitle:  { color: "#666", fontSize: 14, textAlign: "center", lineHeight: 22 },
});

export default Index;
