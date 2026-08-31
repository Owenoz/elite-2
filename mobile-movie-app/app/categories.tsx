import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { images } from "@/constants/images";
import { icons } from "@/constants/icons";
import { MOVIE_GENRES } from "@/services/api";

const Categories = () => {
    const router = useRouter();

    const genres = Object.entries(MOVIE_GENRES).map(([id, name]) => ({
        id: parseInt(id),
        name,
    }));

    const handleGenrePress = (genreId: number, genreName: string) => {
        router.push(`/genre/${genreId}?name=${genreName}`);
    };

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
                    <Text className="text-white text-xl font-bold">Categories</Text>
                    <View className="size-6" />
                </View>

                {/* Categories Grid */}
                <FlatList
                    data={genres}
                    numColumns={2}
                    keyExtractor={(item) => item.id.toString()}
                    showsVerticalScrollIndicator={false}
                    columnWrapperStyle={{
                        justifyContent: "space-between",
                        marginBottom: 16,
                    }}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            onPress={() => handleGenrePress(item.id, item.name)}
                            className="bg-dark-100 rounded-xl p-6 items-center justify-center w-[48%] h-32"
                        >
                            <Text className="text-white text-base font-bold text-center">
                                {item.name}
                            </Text>
                            <Text className="text-light-200 text-xs mt-2">
                                Explore
                            </Text>
                        </TouchableOpacity>
                    )}
                    contentContainerStyle={{ paddingBottom: 20 }}
                />
            </View>
        </SafeAreaView>
    );
};

export default Categories;
