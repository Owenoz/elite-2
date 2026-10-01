import { TouchableOpacity, View, Text, Image } from "react-native";
import { useRouter } from "expo-router";
import { icons } from "@/constants/icons";
import type { UgandaTVShow } from "@/services/ugandaMovies";

interface Props {
    show: UgandaTVShow;
    compact?: boolean;
}

const UgandaTVCard = ({ show, compact = false }: Props) => {
    const router = useRouter();

    const handlePress = () => {
        router.push(
            `/watch/${show.cbId}?title=${encodeURIComponent(show.title)}&url=${encodeURIComponent(show.watchUrl)}&source=CineBeta`
        );
    };

    const posterUri = show.poster_path
        ? `https://image.tmdb.org/t/p/w500${show.poster_path}`
        : "https://placehold.co/300x450/1a1a1a/FFFFFF.png";

    const ratingDisplay = show.rating > 0 ? show.rating.toFixed(1) : "—";
    const vjLabel = show.vjs.length > 0 ? `VJ ${show.vjs[0]}` : "VJ";

    return (
        <TouchableOpacity
            onPress={handlePress}
            activeOpacity={0.82}
            style={{ width: compact ? 116 : undefined }}
            className={compact ? "" : "w-[30%]"}
        >
            <View className="rounded-xl overflow-hidden" style={{ position: "relative" }}>
                <Image
                    source={{ uri: posterUri }}
                    style={{ width: "100%", height: compact ? 164 : 200 }}
                    resizeMode="cover"
                />

                {/* Uganda flag stripe — top */}
                <View className="absolute top-0 left-0 right-0 flex-row" style={{ height: 5 }}>
                    <View style={{ flex: 1, backgroundColor: "#000000" }} />
                    <View style={{ flex: 1, backgroundColor: "#FCDC04" }} />
                    <View style={{ flex: 1, backgroundColor: "#DE3908" }} />
                </View>

                {/* TV SERIES badge — top left */}
                <View
                    className="absolute top-2 left-1.5 px-1.5 py-0.5 rounded-md"
                    style={{ backgroundColor: "rgba(59,130,246,0.92)" }}
                >
                    <Text className="text-white text-xs font-bold">TV</Text>
                </View>

                {/* Rating — top right */}
                <View
                    className="absolute top-2 right-1.5 flex-row items-center rounded-md px-1.5 py-0.5 gap-x-0.5"
                    style={{ backgroundColor: "rgba(3,0,20,0.85)" }}
                >
                    <Image source={icons.star} className="size-3" tintColor="#AB8BFF" />
                    <Text className="text-accent text-xs font-bold">{ratingDisplay}</Text>
                </View>

                {/* Completed ribbon — bottom right */}
                {show.completed && (
                    <View
                        className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded-md"
                        style={{ backgroundColor: "rgba(34,197,94,0.92)" }}
                    >
                        <Text className="text-white text-xs font-bold">✓ Done</Text>
                    </View>
                )}

                {/* VJ badge — bottom left */}
                <View
                    className="absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded-md"
                    style={{ backgroundColor: "rgba(222,57,8,0.92)" }}
                >
                    <Text className="text-white text-xs font-bold">🇺🇬 {vjLabel}</Text>
                </View>

                {/* Play overlay */}
                <View
                    style={{
                        position: "absolute",
                        top: "40%",
                        left: "50%",
                        transform: [{ translateX: -16 }, { translateY: -16 }],
                        backgroundColor: "rgba(171,139,255,0.82)",
                        borderRadius: 999,
                        padding: 10,
                    }}
                >
                    <Image source={icons.play} className="size-5" tintColor="#fff" />
                </View>
            </View>

            {/* Title */}
            <Text className="text-xs font-semibold text-white mt-1.5 leading-4" numberOfLines={2}>
                {show.title}
            </Text>

            {/* Year · Genre · Network */}
            <View className="flex-row items-center gap-x-1 mt-0.5 flex-wrap">
                {show.year ? <Text className="text-light-300 text-xs">{show.year}</Text> : null}
                {show.genres[0] ? (
                    <>
                        <Text className="text-light-300 text-xs">·</Text>
                        <Text className="text-light-300 text-xs" numberOfLines={1}>{show.genres[0]}</Text>
                    </>
                ) : null}
                {show.networks[0] ? (
                    <>
                        <Text className="text-light-300 text-xs">·</Text>
                        <Text className="text-xs" style={{ color: "#AB8BFF" }} numberOfLines={1}>
                            {show.networks[0]}
                        </Text>
                    </>
                ) : null}
            </View>
        </TouchableOpacity>
    );
};

export default UgandaTVCard;
