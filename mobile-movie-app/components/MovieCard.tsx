import { Link } from "expo-router";
import { Text, Image, TouchableOpacity, View } from "react-native";
import { icons } from "@/constants/icons";

interface MovieCardProps extends Movie {
    /** compact mode: used in horizontal rows (no year/type footer) */
    compact?: boolean;
}

const MovieCard = ({
    id,
    poster_path,
    title,
    vote_average,
    release_date,
    compact = false,
}: MovieCardProps) => {
    const rating = Math.round((vote_average / 2) * 10) / 10; // 0–5, one decimal

    return (
        <Link href={`/movies/${id}`} asChild>
            <TouchableOpacity
                activeOpacity={0.8}
                className={compact ? "w-full" : "w-[30%]"}
            >
                {/* Poster */}
                <View className="relative rounded-xl overflow-hidden">
                    <Image
                        source={{
                            uri: poster_path
                                ? `https://image.tmdb.org/t/p/w500${poster_path}`
                                : "https://placehold.co/300x450/1a1a1a/FFFFFF.png",
                        }}
                        className={compact ? "w-full h-40 rounded-xl" : "w-full h-52 rounded-xl"}
                        resizeMode="cover"
                    />

                    {/* Rating badge — top-left */}
                    <View
                        className="absolute top-1.5 left-1.5 flex-row items-center rounded-md px-1.5 py-0.5 gap-x-0.5"
                        style={{ backgroundColor: "rgba(3,0,20,0.78)" }}
                    >
                        <Image source={icons.star} className="size-3" tintColor="#AB8BFF" />
                        <Text className="text-accent text-xs font-bold">{rating.toFixed(1)}</Text>
                    </View>
                </View>

                {/* Title */}
                <Text
                    className="text-xs font-semibold text-white mt-1.5 leading-4"
                    numberOfLines={2}
                >
                    {title}
                </Text>

                {/* Year — only in full (non-compact) mode */}
                {!compact && (
                    <Text className="text-xs text-light-300 mt-0.5">
                        {release_date?.split("-")[0] ?? "—"}
                    </Text>
                )}
            </TouchableOpacity>
        </Link>
    );
};

export default MovieCard;
