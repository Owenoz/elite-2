import {
    View,
    Text,
    FlatList,
    Image,
    TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { images } from "@/constants/images";
import { icons } from "@/constants/icons";
import useFetch from "@/services/useFetch";
import { fetchMoviesByGenre } from "@/services/api";
import MovieCard from "@/components/MovieCard";
import LoadingScreen from "@/components/LoadingScreen";
import ErrorMessage from "@/components/ErrorMessage";

const GenreMovies = () => {
    const router = useRouter();
    const { id, name } = useLocalSearchParams();

    const {
        data: movies,
        loading,
        error,
        refetch,
    } = useFetch(() => fetchMoviesByGenre(parseInt(id as string)));

    if (loading) {
        return <LoadingScreen />;
    }

    return (
        <SafeAreaView className="bg-primary flex-1">
            <Image
                source={images.bg}
                className="absolute w-full h-full"
                resizeMode="cover"
            />
            <View className="flex-1 px-5">
                {/* Header */}
                <View className="flex-row items-center justify-between mt-10 mb-6">
                    <TouchableOpacity onPress={() => router.back()}>
                        <Image
                            source={icons.arrow}
                            className="size-6 rotate-180"
                            tintColor="#fff"
                        />
                    </TouchableOpacity>
                    <Text className="text-white text-xl font-bold">{name} Movies</Text>
                    <View className="size-6" />
                </View>

                {/* Error State */}
                {error ? (
                    <ErrorMessage
                        message="Failed to load movies. Please try again."
                        onRetry={refetch}
                    />
                ) : (
                    /* Movies Grid */
                    <FlatList
                        data={movies}
                        numColumns={3}
                        keyExtractor={(item, index) => `${item.id}_${index}`}
                        showsVerticalScrollIndicator={false}
                        columnWrapperStyle={{
                            justifyContent: "flex-start",
                            gap: 20,
                            paddingRight: 5,
                            marginBottom: 10,
                        }}
                        renderItem={({ item }) => <MovieCard {...item} />}
                        contentContainerStyle={{ paddingBottom: 20 }}
                        ListEmptyComponent={
                            <View className="mt-20">
                                <Text className="text-light-200 text-center">
                                    No movies found in this genre
                                </Text>
                            </View>
                        }
                    />
                )}
            </View>
        </SafeAreaView>
    );
};

export default GenreMovies;
