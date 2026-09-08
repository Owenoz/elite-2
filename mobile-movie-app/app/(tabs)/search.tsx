import { useState, useEffect } from "react";
import {
    View, Text, ActivityIndicator, FlatList, Image,
    TouchableOpacity, StyleSheet, TextInput, Dimensions,
} from "react-native";
import { images } from "@/constants/images";
import { icons } from "@/constants/icons";
import useFetch from "../../services/useFetch";
import { fetchMovies } from "@/services/api";
import MovieCard from "@/components/MovieCard";
import { updateSearchCount } from "@/services/appwrite";
import { useRouter } from "expo-router";

const { width } = Dimensions.get("window");

const GENRES = [
    { id: 28, name: "Action" }, { id: 35, name: "Comedy" },
    { id: 18, name: "Drama" }, { id: 27, name: "Horror" },
    { id: 10749, name: "Romance" }, { id: 878, name: "Sci-Fi" },
    { id: 53, name: "Thriller" }, { id: 16, name: "Animation" },
];

type SortOption = "popularity" | "rating" | "release_date" | "title";

const SORTS: { key: SortOption; label: string }[] = [
    { key: "popularity", label: "🔥 Popular" },
    { key: "rating", label: "⭐ Top Rated" },
    { key: "release_date", label: "🆕 Newest" },
    { key: "title", label: "🔤 A–Z" },
];

const Search = () => {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedGenre, setSelectedGenre] = useState<number | null>(null);
    const [sortBy, setSortBy] = useState<SortOption>("popularity");
    const [showFilters, setShowFilters] = useState(false);

    const { data: moviesRaw, loading, error, refetch: loadMovies, reset } =
        useFetch(() => fetchMovies({ query: searchQuery }), false);

    // Guard against null — useFetch initialises to null not []
    const movies: Movie[] = (moviesRaw as Movie[]) || [];

    useEffect(() => {
        const t = setTimeout(async () => {
            if (searchQuery.trim()) await loadMovies();
            else reset();
        }, 500);
        return () => clearTimeout(t);
    }, [searchQuery]);

    useEffect(() => {
        if (movies.length > 0 && searchQuery.trim())
            updateSearchCount(searchQuery, movies[0]);
    }, [movies]);

    const filtered = movies.filter(m =>
        selectedGenre ? m.genre_ids?.includes(selectedGenre) : true
    );

    const sorted = [...filtered].sort((a, b) => {
        switch (sortBy) {
            case "rating": return b.vote_average - a.vote_average;
            case "release_date": return new Date(b.release_date).getTime() - new Date(a.release_date).getTime();
            case "title": return a.title.localeCompare(b.title);
            default: return b.popularity - a.popularity;
        }
    });

    return (
        <View style={S.root}>
            <Image source={images.bg} style={S.bgAbs} resizeMode="cover" />

            <FlatList
                data={sorted}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => <MovieCard {...item} />}
                numColumns={3}
                columnWrapperStyle={S.gridRow}
                contentContainerStyle={S.gridContent}
                showsVerticalScrollIndicator={false}
                ListHeaderComponent={
                    <View>
                        {/* Header */}
                        <View style={S.header}>
                            <View style={S.titleRow}>
                                <View style={S.goldBar} />
                                <Text style={S.screenTitle}>Discover</Text>
                            </View>
                            <Image source={icons.logo} style={S.logo} resizeMode="contain" />
                        </View>

                        {/* Search bar */}
                        <View style={S.searchBox}>
                            <Image source={icons.search} style={S.searchIcon} tintColor="#D4AF37" />
                            <TextInput
                                style={S.searchInput}
                                placeholder="Search movies, actors..."
                                placeholderTextColor="#555"
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                                returnKeyType="search"
                                autoCorrect={false}
                            />
                            {searchQuery.length > 0 && (
                                <TouchableOpacity onPress={() => { setSearchQuery(""); reset(); }}>
                                    <Text style={S.clearBtn}>✕</Text>
                                </TouchableOpacity>
                            )}
                        </View>

                        {/* Filter toggle */}
                        {searchQuery.trim().length > 0 && (
                            <TouchableOpacity
                                style={S.filterToggle}
                                onPress={() => setShowFilters(p => !p)}
                            >
                                <Text style={S.filterToggleText}>⚙ Filters & Sort</Text>
                                <Text style={S.filterArrow}>{showFilters ? "▲" : "▼"}</Text>
                            </TouchableOpacity>
                        )}

                        {/* Filter panel */}
                        {showFilters && searchQuery.trim().length > 0 && (
                            <View style={S.filterPanel}>
                                <Text style={S.filterLabel}>SORT BY</Text>
                                <View style={S.sortRow}>
                                    {SORTS.map(s => (
                                        <TouchableOpacity
                                            key={s.key}
                                            style={[S.sortChip, sortBy === s.key && S.sortChipActive]}
                                            onPress={() => setSortBy(s.key)}
                                        >
                                            <Text style={[S.sortChipText, sortBy === s.key && S.sortChipTextActive]}>
                                                {s.label}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>

                                <View style={S.filterLabelRow}>
                                    <Text style={S.filterLabel}>GENRE</Text>
                                    {selectedGenre && (
                                        <TouchableOpacity onPress={() => setSelectedGenre(null)}>
                                            <Text style={S.clearGenre}>Clear</Text>
                                        </TouchableOpacity>
                                    )}
                                </View>
                                <View style={S.genreGrid}>
                                    {GENRES.map(g => (
                                        <TouchableOpacity
                                            key={g.id}
                                            style={[S.genreChip, selectedGenre === g.id && S.genreChipActive]}
                                            onPress={() => setSelectedGenre(selectedGenre === g.id ? null : g.id)}
                                        >
                                            <Text style={[S.genreChipText, selectedGenre === g.id && S.genreChipTextActive]}>
                                                {g.name}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>
                        )}

                        {/* Status row */}
                        {loading && (
                            <View style={S.statusRow}>
                                <ActivityIndicator color="#D4AF37" />
                                <Text style={S.statusText}>Searching...</Text>
                            </View>
                        )}
                        {error && <Text style={S.errorText}>Error: {error.message}</Text>}
                        {!loading && !error && searchQuery.trim() && sorted.length > 0 && (
                            <View style={S.resultsHeader}>
                                <Text style={S.resultsTitle}>
                                    Results for <Text style={S.resultsQuery}>"{searchQuery}"</Text>
                                </Text>
                                <View style={S.countBadge}>
                                    <Text style={S.countText}>{sorted.length}</Text>
                                </View>
                            </View>
                        )}
                    </View>
                }
                ListEmptyComponent={
                    !loading && !error ? (
                        <View style={S.emptyState}>
                            <Text style={S.emptyIcon}>
                                {searchQuery.trim() ? "😕" : "🎬"}
                            </Text>
                            <Text style={S.emptyTitle}>
                                {searchQuery.trim() ? "No results found" : "Search Elite Movies"}
                            </Text>
                            <Text style={S.emptySubtitle}>
                                {searchQuery.trim()
                                    ? selectedGenre ? "Try removing the genre filter" : "Try a different title or actor"
                                    : "Find your next favourite film"}
                            </Text>
                        </View>
                    ) : null
                }
            />
        </View>
    );
};

const GOLD = "#D4AF37";
const BG = "#09090F";
const CARD = "#1C1B2E";

const S = StyleSheet.create({
    root: { flex: 1, backgroundColor: BG },
    bgAbs: { position: "absolute", width: "100%", height: "100%", opacity: 0.12 },
    header: {
        flexDirection: "row", justifyContent: "space-between", alignItems: "center",
        paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16,
    },
    titleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
    goldBar: { width: 3, height: 22, backgroundColor: GOLD, borderRadius: 2 },
    screenTitle: { color: "#fff", fontSize: 26, fontWeight: "800" },
    logo: { width: 32, height: 32 },
    searchBox: {
        flexDirection: "row", alignItems: "center",
        backgroundColor: CARD, borderRadius: 14, borderWidth: 1, borderColor: "#2a2840",
        marginHorizontal: 20, paddingHorizontal: 14, paddingVertical: 13, marginBottom: 12, gap: 10,
    },
    searchIcon: { width: 18, height: 18 },
    searchInput: { flex: 1, color: "#fff", fontSize: 15 },
    clearBtn: { color: "#666", fontSize: 16, paddingLeft: 6 },
    filterToggle: {
        flexDirection: "row", justifyContent: "space-between", alignItems: "center",
        marginHorizontal: 20, backgroundColor: CARD, borderRadius: 12,
        paddingHorizontal: 16, paddingVertical: 11, marginBottom: 8,
        borderWidth: 1, borderColor: "#2a2840",
    },
    filterToggleText: { color: "#A8B5DB", fontSize: 13, fontWeight: "600" },
    filterArrow: { color: GOLD, fontSize: 11 },
    filterPanel: {
        marginHorizontal: 20, backgroundColor: "#12121A", borderRadius: 16,
        padding: 16, marginBottom: 12, borderWidth: 1, borderColor: "#2a2840",
    },
    filterLabel: { color: GOLD, fontSize: 10, fontWeight: "800", letterSpacing: 1.5, marginBottom: 10 },
    filterLabelRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 14, marginBottom: 10 },
    clearGenre: { color: GOLD, fontSize: 12 },
    sortRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    sortChip: {
        paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20,
        backgroundColor: "#1C1B2E", borderWidth: 1, borderColor: "#2a2840",
    },
    sortChipActive: { backgroundColor: GOLD, borderColor: GOLD },
    sortChipText: { color: "#A8B5DB", fontSize: 12, fontWeight: "600" },
    sortChipTextActive: { color: "#000" },
    genreGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    genreChip: {
        paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
        backgroundColor: "#1C1B2E", borderWidth: 1, borderColor: "#2a2840",
    },
    genreChipActive: { backgroundColor: GOLD, borderColor: GOLD },
    genreChipText: { color: "#A8B5DB", fontSize: 12, fontWeight: "600" },
    genreChipTextActive: { color: "#000" },
    statusRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 20, marginVertical: 10 },
    statusText: { color: "#888", fontSize: 13 },
    errorText: { color: "#EF4444", paddingHorizontal: 20, marginVertical: 8, fontSize: 13 },
    resultsHeader: {
        flexDirection: "row", alignItems: "center", justifyContent: "space-between",
        paddingHorizontal: 20, marginBottom: 8,
    },
    resultsTitle: { color: "#A8B5DB", fontSize: 14 },
    resultsQuery: { color: "#fff", fontWeight: "700" },
    countBadge: { backgroundColor: GOLD, borderRadius: 12, paddingHorizontal: 8, paddingVertical: 3 },
    countText: { color: "#000", fontSize: 11, fontWeight: "800" },
    gridRow: { justifyContent: "flex-start", gap: 12, marginBottom: 14 },
    gridContent: { paddingHorizontal: 20, paddingBottom: 100 },
    emptyState: { alignItems: "center", paddingTop: 60, paddingHorizontal: 40 },
    emptyIcon: { fontSize: 52, marginBottom: 16 },
    emptyTitle: { color: "#fff", fontSize: 18, fontWeight: "700", marginBottom: 8, textAlign: "center" },
    emptySubtitle: { color: "#666", fontSize: 14, textAlign: "center", lineHeight: 20 },
});

export default Search;
