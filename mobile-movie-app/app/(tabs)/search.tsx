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
import MovieDisplayCard from "@/components/MovieCard";
import { updateSearchCount } from "@/services/appwrite";
import CategoryChip from "@/components/CategoryChip";

type SortOption = "popularity" | "rating" | "release_date" | "title";

const Search = () => {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedGenre, setSelectedGenre] = useState<number | null>(null);
    const [sortBy, setSortBy] = useState<SortOption>("popularity");
    const [showFilters, setShowFilters] = useState(false);

    // Custom hook to fetch movies based on the search query
    const {
        data: movies = [],
        loading,
        error,
        refetch: loadMovies,
        reset,
    } = useFetch(() => fetchMovies({ query: searchQuery }), false);

    const handleSearch = (text: string) => {
        setSearchQuery(text);
    };

    // Popular genres for quick filtering
    const popularGenres = [
        { id: 28, name: "Action" },
        { id: 35, name: "Comedy" },
        { id: 18, name: "Drama" },
        { id: 27, name: "Horror" },
        { id: 10749, name: "Romance" },
        { id: 878, name: "Sci-Fi" },
    ];

    // useEffect hook to perform search with debouncing
    useEffect(() => {
        const timeoutId = setTimeout(async () => {
            if (searchQuery.trim()) {
                await loadMovies();
            } else {
                reset(); // Clear results if search query is empty
            }
        }, 500); // 500ms debounce delay

        return () => clearTimeout(timeoutId);
    }, [searchQuery]);

    // Update search count when movies are fetched
    useEffect(() => {
        const updateCount = async () => {
            if (movies?.length > 0 && movies?.[0]) {
                await updateSearchCount(searchQuery, movies[0]);
            }
        };

        if (searchQuery.trim()) {
            updateCount();
        }
    }, [movies]);

    // Filter and sort movies
    const filteredMovies = movies?.filter((movie: Movie) => {
        if (selectedGenre) {
            return movie.genre_ids?.includes(selectedGenre);
        }
        return true;
    });

    const sortedMovies = [...(filteredMovies || [])].sort((a, b) => {
        switch (sortBy) {
            case "rating":
                return b.vote_average - a.vote_average;
            case "release_date":
                return (
                    new Date(b.release_date).getTime() -
                    new Date(a.release_date).getTime()
                );
            case "title":
                return a.title.localeCompare(b.title);
            case "popularity":
            default:
                return b.popularity - a.popularity;
        }
    });

    return (
        <View className="flex-1 bg-primary">
            <Image
                source={images.bg}
                className="flex-1 absolute w-full z-0"
                resizeMode="cover"
            />
            <FlatList
                className="px-5"
                data={sortedMovies as Movie[]}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => <MovieDisplayCard {...item} />}
                numColumns={3}
                columnWrapperStyle={{
                    justifyContent: "flex-start",
                    gap: 16,
                    marginVertical: 16,
                }}
                contentContainerStyle={{ paddingBottom: 100 }}
                ListHeaderComponent={
                    <>
                        <View className="w-full flex-row justify-center mt-20 items-center">
                            <Image source={icons.logo} className="w-12 h-10" />
                        </View>
                        <View className="my-5">
                            <SearchBar
                                placeholder="Search for a movie"
                                value={searchQuery}
                                onChangeText={handleSearch}
                            />
                        </View>

                        {/* Filter Toggle Button */}
                        {searchQuery.trim() && (
                            <TouchableOpacity
                                onPress={() => setShowFilters(!showFilters)}
                                className="flex-row items-center justify-between bg-dark-100 px-4 py-3 rounded-lg mb-4"
                            >
                                <Text className="text-white font-medium">
                                    Filters & Sort
                                </Text>
                                <Image
                                    source={icons.arrow}
                                    className={`size-4 ${showFilters ? "rotate-90" : "-rotate-90"}`}
                                    tintColor="#AB8BFF"
                                />
                            </TouchableOpacity>
                        )}

                        {/* Filters Section */}
                        {showFilters && searchQuery.trim() && (
                            <View className="bg-dark-100 rounded-lg p-4 mb-4">
                                {/* Sort Options */}
                                <Text className="text-white font-bold mb-3">Sort By</Text>
                                <ScrollView
                                    horizontal
                                    showsHorizontalScrollIndicator={false}
                                    className="mb-4"
                                >
                                    <CategoryChip
                                        label="Popularity"
                                        selected={sortBy === "popularity"}
                                        onPress={() => setSortBy("popularity")}
                                    />
                                    <CategoryChip
                                        label="Rating"
                                        selected={sortBy === "rating"}
                                        onPress={() => setSortBy("rating")}
                                    />
                                    <CategoryChip
                                        label="Release Date"
                                        selected={sortBy === "release_date"}
                                        onPress={() => setSortBy("release_date")}
                                    />
                                    <CategoryChip
                                        label="Title"
                                        selected={sortBy === "title"}
                                        onPress={() => setSortBy("title")}
                                    />
                                </ScrollView>

                                {/* Genre Filter */}
                                <View className="flex-row items-center justify-between mb-2">
                                    <Text className="text-white font-bold">Filter by Genre</Text>
                                    {selectedGenre && (
                                        <TouchableOpacity onPress={() => setSelectedGenre(null)}>
                                            <Text className="text-accent text-sm">Clear</Text>
                                        </TouchableOpacity>
                                    )}
                                </View>
                                <ScrollView
                                    horizontal
                                    showsHorizontalScrollIndicator={false}
                                >
                                    {popularGenres.map((genre) => (
                                        <CategoryChip
                                            key={genre.id}
                                            label={genre.name}
                                            selected={selectedGenre === genre.id}
                                            onPress={() =>
                                                setSelectedGenre(
                                                    selectedGenre === genre.id ? null : genre.id
                                                )
                                            }
                                        />
                                    ))}
                                </ScrollView>
                            </View>
                        )}

                        {loading && (
                            <ActivityIndicator
                                size="large"
                                color="#AB8BFF"
                                className="my-3"
                            />
                        )}
                        {error && (
                            <Text className="text-red-500 px-5 my-3">
                                Error: {error.message}
                            </Text>
                        )}
                        {!loading &&
                            !error &&
                            searchQuery.trim() &&
                            sortedMovies?.length > 0 && (
                                <View className="flex-row items-center justify-between mb-2">
                                    <Text className="text-xl text-white font-bold">
                                        Results for{" "}
                                        <Text className="text-accent">{searchQuery}</Text>
                                    </Text>
                                    <Text className="text-light-200 text-sm">
                                        {sortedMovies.length} found
                                    </Text>
                                </View>
                            )}
                    </>
                }
                ListEmptyComponent={
                    !loading && !error ? (
                        <View className="mt-10 px-5 items-center">
                            <Image
                                source={icons.search}
                                className="size-16 mb-4"
                                tintColor="#9CA4AB"
                            />
                            <Text className="text-center text-light-200 text-base">
                                {searchQuery.trim()
                                    ? selectedGenre
                                        ? "No movies found with selected filters"
                                        : "No movies found"
                                    : "Start typing to search for movies"}
                            </Text>
                        </View>
                    ) : null
                }
            />
        </View>
    );
};

export default Search;