import { useState, useEffect } from "react";
import {
    View,
    Text,
    ActivityIndicator,
    FlatList,
    Image,
    TouchableOpacity,
    ScrollView,
} from "react-native";
import { images } from "@/constants/images";
import { icons } from "@/constants/icons";
import useFetch from "../../services/useFetch";
import { fetchMovies, MOVIE_GENRES } from "@/services/api";
import SearchBar from "@/components/SearchBar";
import MovieCard from "@/components/MovieCard";
import { updateSearchCount } from "@/services/appwrite";
import CategoryChip from "@/components/CategoryChip";

type SortOption = "popularity" | "rating" | "release_date" | "title";

const POPULAR_GENRES = [
    { id: 28, name: "Action" },
    { id: 35, name: "Comedy" },
    { id: 18, name: "Drama" },
    { id: 27, name: "Horror" },
    { id: 10749, name: "Romance" },
    { id: 878, name: "Sci-Fi" },
    { id: 16, name: "Animation" },
    { id: 80, name: "Crime" },
];

const Search = () => {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedGenre, setSelectedGenre] = useState<number | null>(null);
    const [sortBy, setSortBy] = useState<SortOption>("popularity");
    const [showFilters, setShowFilters] = useState(false);

    const {
        data: movies = [],
        loading,
        error,
        refetch: loadMovies,
        reset,
    } = useFetch(() => fetchMovies({ query: searchQuery }), false);

    // Debounced search
    useEffect(() => {
        const id = setTimeout(async () => {
            if (searchQuery.trim()) {
                await loadMovies();
            } else {
                reset();
                setShowFilters(false);
            }
        }, 500);
        return () => clearTimeout(id);
    }, [searchQuery]);

    // Track search counts in Appwrite
    useEffect(() => {
        if (movies?.length > 0 && searchQuery.trim()) {
            updateSearchCount(searchQuery, movies[0]).catch(() => {});
        }
    }, [movies]);

    // Filter + sort
    const filtered = movies?.filter((m: Movie) =>
        selectedGenre ? m.genre_ids?.includes(selectedGenre) : true
    );
    const sorted = [...(filtered || [])].sort((a, b) => {
        switch (sortBy) {
            case "rating":       return b.vote_average - a.vote_average;
            case "release_date": return new Date(b.release_date).getTime() - new Date(a.release_date).getTime();
            case "title":        return a.title.localeCompare(b.title);
            default:             return b.popularity - a.popularity;
        }
    });

    const hasQuery = searchQuery.trim().length > 0;
    const hasResults = sorted.length > 0;

    return (
        <View className="flex-1 bg-primary">
            <Image source={images.bg} className="absolute w-full h-full z-0" resizeMode="cover" />

            <FlatList
                className="px-5"
                data={sorted as Movie[]}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => <MovieCard {...item} />}
                numColumns={3}
                columnWrapperStyle={{ justifyContent: "flex-start", gap: 14, marginVertical: 8 }}
                contentContainerStyle={{ paddingBottom: 120 }}
                ListHeaderComponent={
                    <>
                        {/* Logo */}
                        <View className="flex-row justify-center mt-16 mb-5">
                            <Image source={icons.logo} className="w-12 h-10" />
                        </View>

                        {/* Search input */}
                        <SearchBar
                            placeholder="Search for a movie…"
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />

                        {/* Filter toggle — only when searching */}
                        {hasQuery && (
                            <TouchableOpacity
                                onPress={() => setShowFilters(!showFilters)}
                                className="flex-row items-center justify-between bg-dark-100 px-4 py-3 rounded-xl mt-4"
                                activeOpacity={0.8}
                            >
                                <View className="flex-row items-center gap-x-2">
                                    <Image
                                        source={icons.search}
                                        className="size-4"
                                        tintColor="#AB8BFF"
                                    />
                                    <Text className="text-white font-semibold text-sm">
                                        Filters & Sort
                                    </Text>
                                    {(selectedGenre || sortBy !== "popularity") && (
                                        <View className="bg-accent px-1.5 py-0.5 rounded-full">
                                            <Text className="text-white text-xs font-bold">
                                                {[selectedGenre ? 1 : 0, sortBy !== "popularity" ? 1 : 0].reduce((a, b) => a + b, 0)}
                                            </Text>
                                        </View>
                                    )}
                                </View>
                                <Image
                                    source={icons.arrow}
                                    className="size-4"
                                    style={{
                                        transform: [{ rotate: showFilters ? "90deg" : "-90deg" }],
                                    }}
                                    tintColor="#AB8BFF"
                                />
                            </TouchableOpacity>
                        )}

                        {/* Expanded filters panel */}
                        {showFilters && hasQuery && (
                            <View className="bg-dark-100 rounded-xl p-4 mt-2">
                                <Text className="text-white font-bold mb-3 text-sm">Sort By</Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
                                    {(["popularity", "rating", "release_date", "title"] as SortOption[]).map((opt) => (
                                        <CategoryChip
                                            key={opt}
                                            label={opt === "release_date" ? "Release Date" : opt.charAt(0).toUpperCase() + opt.slice(1)}
                                            selected={sortBy === opt}
                                            onPress={() => setSortBy(opt)}
                                        />
                                    ))}
                                </ScrollView>

                                <View className="flex-row items-center justify-between mb-2">
                                    <Text className="text-white font-bold text-sm">Genre</Text>
                                    {selectedGenre && (
                                        <TouchableOpacity onPress={() => setSelectedGenre(null)}>
                                            <Text className="text-accent text-xs">Clear</Text>
                                        </TouchableOpacity>
                                    )}
                                </View>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                    {POPULAR_GENRES.map((g) => (
                                        <CategoryChip
                                            key={g.id}
                                            label={g.name}
                                            selected={selectedGenre === g.id}
                                            onPress={() =>
                                                setSelectedGenre(selectedGenre === g.id ? null : g.id)
                                            }
                                        />
                                    ))}
                                </ScrollView>
                            </View>
                        )}

                        {/* Loading + error */}
                        {loading && (
                            <View className="flex-row items-center justify-center gap-x-2 my-4">
                                <ActivityIndicator size="small" color="#AB8BFF" />
                                <Text className="text-light-200 text-sm">Searching…</Text>
                            </View>
                        )}
                        {error && !loading && (
                            <Text className="text-red-400 text-sm text-center my-3">
                                Something went wrong. Try again.
                            </Text>
                        )}

                        {/* Results header */}
                        {!loading && !error && hasQuery && hasResults && (
                            <View className="flex-row items-center justify-between mt-4 mb-1">
                                <Text className="text-white font-bold text-base">
                                    Results for{" "}
                                    <Text className="text-accent">"{searchQuery}"</Text>
                                </Text>
                                <View className="bg-dark-100 px-2 py-1 rounded-lg">
                                    <Text className="text-light-200 text-xs font-semibold">
                                        {sorted.length} found
                                    </Text>
                                </View>
                            </View>
                        )}
                    </>
                }
                ListEmptyComponent={
                    !loading && !error ? (
                        <View className="mt-16 items-center px-8">
                            <Image
                                source={icons.search}
                                className="size-20 mb-5 opacity-25"
                                tintColor="#A8B5DB"
                            />
                            {hasQuery ? (
                                <>
                                    <Text className="text-white font-bold text-lg text-center mb-2">
                                        No Results Found
                                    </Text>
                                    <Text className="text-light-200 text-sm text-center leading-5">
                                        We couldn't find anything for "{searchQuery}".
                                        {selectedGenre ? " Try clearing the genre filter." : " Check spelling or try different keywords."}
                                    </Text>
                                </>
                            ) : (
                                <>
                                    <Text className="text-white font-bold text-lg text-center mb-2">
                                        Find Your Next Movie
                                    </Text>
                                    <Text className="text-light-200 text-sm text-center leading-5">
                                        Search by title, genre, or keywords to discover movies.
                                    </Text>
                                </>
                            )}
                        </View>
                    ) : null
                }
            />
        </View>
    );
};

export default Search;
