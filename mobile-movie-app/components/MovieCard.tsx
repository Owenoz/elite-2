import { Link } from "expo-router";
import { Text, Image, TouchableOpacity, View, StyleSheet } from "react-native";

const GOLD = "#D4AF37";
const CARD = "#1C1B2E";

const MovieCard = ({ id, poster_path, title, vote_average, release_date }: Movie) => (
    <Link href={`/movies/${id}`} asChild>
        <TouchableOpacity style={S.card} activeOpacity={0.85}>
            <View style={S.posterWrap}>
                <Image
                    source={{
                        uri: poster_path
                            ? `https://image.tmdb.org/t/p/w342${poster_path}`
                            : "https://placehold.co/342x513/1C1B2E/D4AF37.png",
                    }}
                    style={S.poster}
                    resizeMode="cover"
                />
                {/* Rating badge */}
                <View style={S.ratingBadge}>
                    <Text style={S.ratingText}>⭐ {vote_average?.toFixed(1)}</Text>
                </View>
            </View>
            <Text style={S.title} numberOfLines={2}>{title}</Text>
            <Text style={S.year}>{release_date?.split("-")[0]}</Text>
        </TouchableOpacity>
    </Link>
);

const S = StyleSheet.create({
    card: { width: "30%", marginBottom: 4 },
    posterWrap: { position: "relative", borderRadius: 12, overflow: "hidden" },
    poster: { width: "100%", height: 160, borderRadius: 12 },
    ratingBadge: {
        position: "absolute", top: 6, left: 6,
        backgroundColor: "rgba(0,0,0,0.75)",
        paddingHorizontal: 6, paddingVertical: 2,
        borderRadius: 8, borderWidth: 1, borderColor: "rgba(212,175,55,0.3)",
    },
    ratingText: { color: GOLD, fontSize: 9, fontWeight: "700" },
    title: { color: "#E5E5E5", fontSize: 11, fontWeight: "600", marginTop: 6, lineHeight: 15 },
    year: { color: "#555", fontSize: 10, marginTop: 2 },
});

export default MovieCard;
