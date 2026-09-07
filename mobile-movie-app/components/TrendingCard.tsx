import { Link } from "expo-router";
import { View, Text, TouchableOpacity, Image, StyleSheet } from "react-native";

const GOLD = "#D4AF37";

const TrendingCard = ({ movie: { movie_id, title, poster_url }, index }: TrendingCardProps) => (
    <Link href={`/movies/${movie_id}`} asChild>
        <TouchableOpacity style={S.card} activeOpacity={0.88}>
            {/* Rank badge */}
            <View style={[S.rankBadge, index === 0 && S.rankFirst]}>
                <Text style={[S.rankText, index === 0 && S.rankTextFirst]}>
                    {index === 0 ? "👑" : `#${index + 1}`}
                </Text>
            </View>
            {/* Poster */}
            <Image
                source={{ uri: poster_url }}
                style={S.poster}
                resizeMode="cover"
            />
            {/* Glow for #1 */}
            {index === 0 && <View style={S.goldGlow} />}
            {/* Title */}
            <Text style={S.title} numberOfLines={2}>{title}</Text>
        </TouchableOpacity>
    </Link>
);

const S = StyleSheet.create({
    card: { width: 120, marginRight: 4 },
    poster: { width: 120, height: 175, borderRadius: 14, borderWidth: 1.5, borderColor: "#2a2840" },
    rankBadge: {
        position: "absolute", top: 8, right: 8, zIndex: 10,
        backgroundColor: "rgba(0,0,0,0.8)", borderRadius: 10,
        paddingHorizontal: 7, paddingVertical: 3,
        borderWidth: 1, borderColor: "#2a2840",
    },
    rankFirst: { borderColor: GOLD, backgroundColor: "rgba(0,0,0,0.9)" },
    rankText: { color: "#A8B5DB", fontSize: 10, fontWeight: "800" },
    rankTextFirst: { color: GOLD },
    goldGlow: {
        position: "absolute", top: 0, left: 0, right: 0, bottom: 32,
        borderRadius: 14, borderWidth: 2, borderColor: GOLD,
        shadowColor: GOLD, shadowOpacity: 0.6, shadowRadius: 10,
    },
    title: { color: "#A8B5DB", fontSize: 11, fontWeight: "600", marginTop: 7, lineHeight: 15 },
});

export default TrendingCard;
