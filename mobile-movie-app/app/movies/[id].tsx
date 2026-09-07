import {
    View,
    Text,
    Image,
    ActivityIndicator,
    ScrollView,
    TouchableOpacity,
    FlatList,
    Alert,
    Linking,
    StyleSheet,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState, useEffect } from "react";

import { icons } from "@/constants/icons";
import useFetch from "../../services/useFetch";
import {
    fetchMovieDetails,
    fetchMovieCredits,
    fetchSimilarMovies,
    fetchMovieVideos,
} from "@/services/api";
import { addToDownloads } from "@/services/appwrite";
import CastCard from "@/components/CastCard";
import MovieCard from "@/components/MovieCard";
import PaymentModal from "@/components/PaymentModal";

interface MovieInfoProps {
    label: string;
    value?: string | number | null;
}

const MovieInfo = ({ label, value }: MovieInfoProps) => (
    <View style={styles.infoBlock}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value || "N/A"}</Text>
    </View>
);

const Details = () => {
    const router = useRouter();
    const { id } = useLocalSearchParams();
    const [isFavorite, setIsFavorite] = useState(false);
    const [isDownloaded, setIsDownloaded] = useState(false);
    const [favoriteLoading, setFavoriteLoading] = useState(false);
    const [downloadLoading, setDownloadLoading] = useState(false);
    const [paymentVisible, setPaymentVisible] = useState(false);

    const { data: movie, loading: movieLoading } = useFetch(() =>
        fetchMovieDetails(id as string)
    );
    const { data: credits, loading: creditsLoading } = useFetch(() =>
        fetchMovieCredits(id as string)
    );
    const { data: similarMovies, loading: similarLoading } = useFetch(() =>
        fetchSimilarMovies(id as string)
    );
    const { data: videos, loading: videosLoading } = useFetch(() =>
        fetchMovieVideos(id as string)
    );

    useEffect(() => {
        setIsFavorite(false);
        setIsDownloaded(false);
    }, [id]);

    const handleFavoriteToggle = () => {
        if (!movie) return;
        setIsFavorite((prev) => !prev);
    };

    const handleDownload = () => {
        if (!movie) return;
        if (isDownloaded) {
            Alert.alert("Already Downloaded", "This movie is already in your downloads");
            return;
        }
        setPaymentVisible(true);
    };

    const handlePaymentSuccess = async (email: string) => {
        setPaymentVisible(false);
        if (!movie) return;
        setDownloadLoading(true);
        try {
            await new Promise((resolve) => setTimeout(resolve, 1500));
            await addToDownloads(
                email,
                {
                    id: movie.id,
                    title: movie.title,
                    poster_path: movie.poster_path,
                    release_date: movie.release_date,
                    vote_average: movie.vote_average,
                } as Movie,
                "downloaded://movie/" + movie.id
            );
            setIsDownloaded(true);
        } catch (error) {
            console.error("Download record error:", error);
            setIsDownloaded(true);
        } finally {
            setDownloadLoading(false);
        }
    };

    const handlePlayTrailer = async () => {
        if (!videos || videos.length === 0) {
            Alert.alert("No Trailer", "No trailer available for this movie");
            return;
        }
        const trailer = videos.find(
            (v: any) => v.type === "Trailer" || v.type === "Teaser"
        );
        if (!trailer) {
            Alert.alert("No Trailer", "No trailer available for this movie");
            return;
        }
        const youtubeUrl = `https://www.youtube.com/watch?v=${trailer.key}`;
        try {
            const supported = await Linking.canOpenURL(youtubeUrl);
            if (supported) {
                await Linking.openURL(youtubeUrl);
            } else {
                Alert.alert("Error", "Cannot open YouTube video");
            }
        } catch (error) {
            Alert.alert("Error", "Failed to open trailer");
        }
    };

    const loading = movieLoading || creditsLoading || similarLoading || videosLoading;

    if (loading && !movie) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#AB8BFF" />
            </View>
        );
    }

    return (
        <View style={styles.root}>
            <ScrollView contentContainerStyle={{ paddingBottom: 110 }}>
                {/* Hero Image */}
                <View style={styles.heroContainer}>
                    <Image
                        source={{
                            uri: `https://image.tmdb.org/t/p/w500${movie?.backdrop_path || movie?.poster_path}`,
                        }}
                        style={styles.heroImage}
                        resizeMode="cover"
                    />
                    {/* Back Button */}
                    <TouchableOpacity onPress={router.back} style={styles.backBtn}>
                        <Image source={icons.arrow} style={styles.iconSm} tintColor="#fff" />
                    </TouchableOpacity>
                    {/* Favorite Button */}
                    <TouchableOpacity
                        onPress={handleFavoriteToggle}
                        disabled={favoriteLoading}
                        style={styles.favBtn}
                    >
                        <Image
                            source={icons.save}
                            style={styles.iconSm}
                            tintColor={isFavorite ? "#AB8BFF" : "#fff"}
                        />
                    </TouchableOpacity>
                </View>

                {/* Content */}
                <View style={styles.content}>
                    {/* Title */}
                    <Text style={styles.title}>{movie?.title}</Text>

                    {/* Tagline */}
                    {!!movie?.tagline && (
                        <Text style={styles.tagline}>"{movie.tagline}"</Text>
                    )}

                    {/* Meta row */}
                    <View style={styles.metaRow}>
                        <Text style={styles.metaText}>
                            {movie?.release_date?.split("-")[0]}
                        </Text>
                        <Text style={styles.metaDot}> • </Text>
                        <Text style={styles.metaText}>{movie?.runtime}m</Text>
                        <Text style={styles.metaDot}> • </Text>
                        <Text style={styles.metaText}>{movie?.status}</Text>
                    </View>

                    {/* Rating */}
                    <View style={styles.ratingBox}>
                        <Image source={icons.star} style={styles.starIcon} />
                        <Text style={styles.ratingScore}>
                            {movie?.vote_average?.toFixed(1)}/10
                        </Text>
                        <Text style={styles.ratingVotes}>
                            ({movie?.vote_count?.toLocaleString()} votes)
                        </Text>
                    </View>

                    {/* Action Buttons */}
                    <View style={styles.actionRow}>
                        {videos && videos.length > 0 && (
                            <TouchableOpacity
                                onPress={handlePlayTrailer}
                                style={[styles.actionBtn, styles.trailerBtn]}
                            >
                                <Image
                                    source={icons.play}
                                    style={[styles.iconSm, { marginRight: 8 }]}
                                    tintColor="#fff"
                                />
                                <Text style={styles.actionBtnText}>Watch Trailer</Text>
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity
                            onPress={handleDownload}
                            disabled={downloadLoading || isDownloaded}
                            style={[
                                styles.actionBtn,
                                styles.downloadBtn,
                                (downloadLoading) && styles.disabledBtn,
                            ]}
                        >
                            {downloadLoading ? (
                                <ActivityIndicator color="#AB8BFF" />
                            ) : (
                                <>
                                    <Image
                                        source={icons.arrow}
                                        style={[styles.iconSm, { marginRight: 8, transform: [{ rotate: isDownloaded ? "0deg" : "90deg" }] }]}
                                        tintColor={isDownloaded ? "#AB8BFF" : "#fff"}
                                    />
                                    <Text style={[styles.actionBtnText, isDownloaded && { color: "#AB8BFF" }]}>
                                        {isDownloaded ? "Downloaded" : "Download"}
                                    </Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>

                    {/* Genres */}
                    {movie?.genres && movie.genres.length > 0 && (
                        <View style={styles.genreRow}>
                            {movie.genres.map((genre: any) => (
                                <View key={genre.id} style={styles.genreChip}>
                                    <Text style={styles.genreText}>{genre.name}</Text>
                                </View>
                            ))}
                        </View>
                    )}

                    {/* Overview */}
                    <View style={styles.infoBlock}>
                        <Text style={styles.infoLabel}>Overview</Text>
                        <Text style={[styles.infoValue, styles.overviewText]}>
                            {movie?.overview || "No overview available."}
                        </Text>
                    </View>

                    {/* Cast */}
                    {credits?.cast && credits.cast.length > 0 && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Top Cast</Text>
                            <FlatList
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                data={credits.cast.slice(0, 10)}
                                renderItem={({ item }) => <CastCard cast={item} />}
                                keyExtractor={(item) => item.cast_id.toString()}
                            />
                        </View>
                    )}

                    {/* Production Info row */}
                    <View style={styles.productionRow}>
                        <MovieInfo
                            label="Budget"
                            value={movie?.budget ? `$${(movie.budget / 1_000_000).toFixed(1)}M` : "N/A"}
                        />
                        <MovieInfo
                            label="Revenue"
                            value={movie?.revenue ? `$${(movie.revenue / 1_000_000).toFixed(1)}M` : "N/A"}
                        />
                        <MovieInfo
                            label="Language"
                            value={movie?.original_language?.toUpperCase()}
                        />
                    </View>

                    <MovieInfo
                        label="Production Companies"
                        value={
                            movie?.production_companies?.map((c: any) => c.name).join(" • ") || "N/A"
                        }
                    />

                    {/* Similar Movies */}
                    {similarMovies && similarMovies.length > 0 && (
                        <View style={[styles.section, { marginTop: 28 }]}>
                            <Text style={styles.sectionTitle}>Similar Movies</Text>
                            <FlatList
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                data={similarMovies.slice(0, 10)}
                                renderItem={({ item }) => (
                                    <View style={styles.similarCard}>
                                        <MovieCard {...item} />
                                    </View>
                                )}
                                keyExtractor={(item) => item.id.toString()}
                            />
                        </View>
                    )}
                </View>
            </ScrollView>

            {/* Bottom Go Back bar */}
            <View style={styles.bottomBar}>
                <TouchableOpacity style={styles.goBackBtn} onPress={router.back}>
                    <Image
                        source={icons.arrow}
                        style={[styles.iconSm, { marginRight: 6, transform: [{ rotate: "180deg" }] }]}
                        tintColor="#fff"
                    />
                    <Text style={styles.goBackText}>Go Back</Text>
                </TouchableOpacity>
            </View>

            <PaymentModal
                visible={paymentVisible}
                movieTitle={movie?.title || ""}
                onClose={() => setPaymentVisible(false)}
                onPaymentSuccess={handlePaymentSuccess}
            />
        </View>
    );
};

const COLORS = {
    primary: "#030014",
    dark100: "#221F3D",
    dark200: "#0F0D23",
    accent: "#AB8BFF",
    light100: "#D6C7FF",
    light200: "#A8B5DB",
    light300: "#9CA4AB",
    white: "#FFFFFF",
};

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: COLORS.primary },
    loadingContainer: { flex: 1, backgroundColor: COLORS.primary, justifyContent: "center", alignItems: "center" },
    heroContainer: { position: "relative" },
    heroImage: { width: "100%", height: 380 },
    backBtn: {
        position: "absolute", top: 44, left: 16,
        backgroundColor: "rgba(34,31,61,0.85)", padding: 8, borderRadius: 24,
    },
    favBtn: {
        position: "absolute", top: 44, right: 16,
        backgroundColor: "rgba(34,31,61,0.85)", padding: 8, borderRadius: 24,
    },
    iconSm: { width: 22, height: 22 },
    starIcon: { width: 18, height: 18, marginRight: 6 },
    content: { paddingHorizontal: 16, paddingTop: 16 },
    title: { color: COLORS.white, fontSize: 24, fontWeight: "700", marginBottom: 6 },
    tagline: { color: COLORS.light200, fontSize: 13, fontStyle: "italic", marginBottom: 8 },
    metaRow: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
    metaText: { color: COLORS.light200, fontSize: 13 },
    metaDot: { color: COLORS.light300, fontSize: 13 },
    ratingBox: {
        flexDirection: "row", alignItems: "center",
        backgroundColor: COLORS.dark100,
        paddingHorizontal: 12, paddingVertical: 8,
        borderRadius: 10, alignSelf: "flex-start", marginBottom: 14,
    },
    ratingScore: { color: COLORS.white, fontWeight: "700", fontSize: 15, marginRight: 6 },
    ratingVotes: { color: COLORS.light200, fontSize: 12 },
    actionRow: { flexDirection: "row", gap: 10, marginBottom: 14 },
    actionBtn: {
        flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
        paddingVertical: 12, borderRadius: 10,
    },
    trailerBtn: { backgroundColor: COLORS.accent },
    downloadBtn: { backgroundColor: COLORS.dark100 },
    disabledBtn: { opacity: 0.55 },
    actionBtnText: { color: COLORS.white, fontWeight: "600", fontSize: 14 },
    genreRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 4 },
    genreChip: {
        backgroundColor: COLORS.dark100, paddingHorizontal: 12, paddingVertical: 5,
        borderRadius: 20,
    },
    genreText: { color: COLORS.light100, fontSize: 12 },
    infoBlock: { marginTop: 16 },
    infoLabel: { color: COLORS.light200, fontSize: 12, marginBottom: 4 },
    infoValue: { color: COLORS.light100, fontWeight: "600", fontSize: 13 },
    overviewText: { lineHeight: 21, fontWeight: "400", color: COLORS.light200 },
    section: { marginTop: 20 },
    sectionTitle: { color: COLORS.white, fontSize: 17, fontWeight: "700", marginBottom: 10 },
    productionRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 8 },
    similarCard: { marginRight: 12, width: 120 },
    bottomBar: {
        position: "absolute", bottom: 0, left: 0, right: 0,
        backgroundColor: "rgba(3,0,20,0.96)", paddingHorizontal: 16, paddingVertical: 12,
    },
    goBackBtn: {
        backgroundColor: COLORS.accent, borderRadius: 10, paddingVertical: 13,
        flexDirection: "row", alignItems: "center", justifyContent: "center",
    },
    goBackText: { color: COLORS.white, fontWeight: "600", fontSize: 15 },
});

export default Details;
