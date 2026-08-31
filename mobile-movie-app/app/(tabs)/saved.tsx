import {
    View,
    Text,
    FlatList,
    Image,
    TouchableOpacity,
    Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useState, useEffect } from "react";
import { images } from "@/constants/images";
import { icons } from "@/constants/icons";
import { useAuth } from "@/context/AuthContext";
import { getFavorites, removeFromFavorites } from "@/services/appwrite";
import LoadingScreen from "@/components/LoadingScreen";
import EmptyState from "@/components/EmptyState";
import ErrorMessage from "@/components/ErrorMessage";

interface FavoriteMovie {
    $id: string;
    movieId: number;
    title: string;
    posterUrl: string;
    releaseDate: string;
    voteAverage: number;
}

const Saved = () => {
    const router = useRouter();
    const { user, isAuthenticated } = useAuth();
    const [favorites, setFavorites] = useState<FavoriteMovie[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loadFavorites = async () => {
        if (!user) {
            setLoading(false);
            return;
        }

        try {
            setError(null);
            const favs = await getFavorites(user.$id);
            setFavorites(favs as FavoriteMovie[]);
        } catch (error) {
            console.error("Error loading favorites:", error);
            setError("Failed to load saved movies");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadFavorites();
    }, [user]);

    const handleRefresh = () => {
        setRefreshing(true);
        loadFavorites();
    };

    const handleRemoveFavorite = async (movieId: number, documentId: string) => {
        if (!user) return;

        try {
            await removeFromFavorites(user.$id, movieId);
            setFavorites((prev) => prev.filter((fav) => fav.$id !== documentId));
            Alert.alert("Success", "Removed from saved movies");
        } catch (error) {
            console.error("Error removing favorite:", error);
            Alert.alert("Error", "Failed to remove from saved movies");
        }
    };

    if (!isAuthenticated) {
        return (
            <SafeAreaView className="bg-primary flex-1">
                <Image
                    source={images.bg}
                    className="absolute w-full h-full"
                    resizeMode="cover"
                />
                <EmptyState
                    icon={icons.save}
                    title="Login Required"
                    message="Please login to save and view your favorite movies"
                    actionLabel="Login"
                    onAction={() => router.push("/login")}
                />
            </SafeAreaView>
        );
    }

    if (loading) {
        return <LoadingScreen />;
    }

    if (error) {
        return (
            <SafeAreaView className="bg-primary flex-1">
                <Image
                    source={images.bg}
                    className="absolute w-full h-full"
                    resizeMode="cover"
                />
                <ErrorMessage
                    message={error}
                    onRetry={loadFavorites}
                />
            </SafeAreaView>
        );
    }

    if (favorites.length === 0) {
        return (
            <SafeAreaView className="bg-primary flex-1">
                <Image
                    source={images.bg}
                    className="absolute w-full h-full"
                    resizeMode="cover"
                />
                <View className="flex-1 px-5">
                    <Text className="text-white text-2xl font-bold mt-10 mb-6">
                        Saved Movies
                    </Text>
                    <EmptyState
                        icon={icons.save}
                        title="No Saved Movies Yet"
                        message="Start exploring and save your favorite movies to watch later"
                        actionLabel="Explore Movies"
                        onAction={() => router.push("/(tabs)")}
                    />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="bg-primary flex-1">
            <Image
                source={images.bg}
                className="absolute w-full h-full"
                resizeMode="cover"
            />
            <View className="flex-1 px-5">
                <Text className="text-white text-2xl font-bold mt-10 mb-6">
                    Saved Movies ({favorites.length})
                </Text>

                <FlatList
                    data={favorites}
                    numColumns={3}
                    keyExtractor={(item) => item.$id}
                    showsVerticalScrollIndicator={false}
                    refreshing={refreshing}
                    onRefresh={handleRefresh}
                    columnWrapperStyle={{
                        justifyContent: "flex-start",
                        gap: 20,
                        paddingRight: 5,
                        marginBottom: 10,
                    }}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            onPress={() => router.push(`/movies/${item.movieId}`)}
                            className="w-[30%] relative"
                        >
                            <Image
                                source={{ uri: item.posterUrl }}
                                className="w-full h-52 rounded-lg"
                                resizeMode="cover"
                            />
                            {/* Remove button */}
                            <TouchableOpacity
                                onPress={() => handleRemoveFavorite(item.movieId, item.$id)}
                                className="absolute top-2 right-2 bg-dark-100/90 p-1.5 rounded-full"
                            >
                                <Image
                                    source={icons.save}
                                    className="size-4"
                                    tintColor="#AB8BFF"
                                />
                            </TouchableOpacity>

                            <Text className="text-sm font-bold text-white mt-2" numberOfLines={1}>
                                {item.title}
                            </Text>

                            <View className="flex-row items-center justify-start gap-x-1">
                                <Image source={icons.star} className="size-4" />
                                <Text className="text-xs text-white font-bold uppercase">
                                    {item.voteAverage?.toFixed(1)}
                                </Text>
                            </View>

                            <Text className="text-xs text-light-300 font-medium mt-1">
                                {item.releaseDate?.split("-")[0]}
                            </Text>
                        </TouchableOpacity>
                    )}
                    contentContainerStyle={{ paddingBottom: 20 }}
                />
            </View>
        </SafeAreaView>
    );
};

export default Saved;
