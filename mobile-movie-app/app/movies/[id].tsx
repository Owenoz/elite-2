import {
    View,
    Text,
    Image,
    ActivityIndicator,
    ScrollView,
    TouchableOpacity,
    FlatList,
    Alert,
    StyleSheet,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState, useEffect } from "react";

import { icons } from "@/constants/icons";
import useFetch from "../../services/useFetch";
import {
    fetchMovieDetails,
    fetchMovieCredits,
    fetchSimilarMovies,
    fetchMovieVideos,
} from "@/services/api";
import {
    getMovieByTmdbId,
    createPayment,
    completePayment,
    hasAccessToMovie,
    addFavorite,
    removeFavorite,
    isFavorited,
    type SupabaseMovie,
} from "@/services/supabase";
import CastCard from "@/components/CastCard";
import MovieCard from "@/components/MovieCard";
import PaymentModal from "@/components/PaymentModal";
import TrailerPlayer from "@/components/TrailerPlayer";
import MoviePlayer from "@/components/MoviePlayer";

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
    const [trailerVisible, setTrailerVisible] = useState(false);
    // Supabase movie data (has archive identifier if movie is in our catalogue)
    const [supabaseMovie, setSupabaseMovie] = useState<SupabaseMovie | null>(null);
    const [moviePlayerVisible, setMoviePlayerVisible] = useState(false);
    const [userEmail, setUserEmail] = useState<string | null>(null);

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
        setSupabaseMovie(null);
        setUserEmail(null);
        // Load Supabase movie data (archive info)
        if (id) {
            getMovieByTmdbId(Number(id)).then(sm => {
                if (sm) setSupabaseMovie(sm);
            });
        }
    }, [id]);

    const handleFavoriteToggle = async () => {
        if (!movie) return;
        setFavoriteLoading(true);
        try {
            if (userEmail) {
                if (isFavorite) {
                    await removeFavorite(userEmail, movie.id);
                } else {
                    await addFavorite(
                        userEmail, movie.id, movie.title,
                        `https://image.tmdb.org/t/p/w500${movie.poster_path}`,
                        movie.vote_average,
                        parseInt(movie.release_date?.split("-")[0] || "0")
                    );
                }
            }
            setIsFavorite(prev => !prev);
        } finally {
            setFavoriteLoading(false);
        }
    };

    // Download = payment gate → on success either stream or record download
    const handleDownload = () => {
        if (!movie) return;
        if (isDownloaded) {
            // Already paid — open movie player directly
            if (supabaseMovie?.archive_identifier) {
                setMoviePlayerVisible(true);
            } else {
                Alert.alert("Coming Soon", "This movie's stream is being set up. Check back soon.");
            }
            return;
        }
        setPaymentVisible(true);
    };

    const handlePaymentSuccess = async (email: string) => {
        setPaymentVisible(false);
        if (!movie) return;
        setUserEmail(email);
        setDownloadLoading(true);
        try {
            // 1. Create payment record in Supabase
            const ref = await createPayment(email, movie.id, movie.title);

            // 2. Complete payment (simulate — in production hook into Flutterwave webhook)
            const archiveUrl = supabaseMovie?.archive_url || "";
            if (ref) {
                await completePayment(ref, email, movie.id, movie.title, archiveUrl);
            }

            setIsDownloaded(true);

            // 3. If archive stream available, open player immediately
            if (supabaseMovie?.archive_identifier) {
                setTimeout(() => setMoviePlayerVisible(true), 500);
            } else {
                Alert.alert(
                    "Payment Confirmed! ✅",
                    "Your payment of 5,000 UGX has been recorded.\n\nThis movie's stream will be available soon.",
                    [{ text: "OK" }]
                );
            }
        } catch (error) {
            console.error("Payment error:", error);
            setIsDownloaded(true);
        } finally {
            setDownloadLoading(false);
        }
    };

    const handlePlayTrailer = () => {
        if (!videos || videos.length === 0) {
            Alert.alert("No Trailer", "No trailer available for this movie");
            return;
        }
        const trailer = videos.find((v: any) => v.type === "Trailer" || v.type === "Teaser");
        if (!trailer) {
            Alert.alert("No Trailer", "No trailer available for this movie");
            return;
        }
        setTrailerVisible(true);
    };

    const trailerKey = videos?.find((v: any) => v.type === "Trailer" || v.type === "Teaser")?.key || "";

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
                                <Image source={icons.play} style={[styles.iconSm, { marginRight: 8 }]} tintColor="#000" />
                                <Text style={[styles.actionBtnText, { color: "#000" }]}>Trailer</Text>
                            </TouchableOpacity>
                        )}
                        {/* Watch Movie button — shown when movie is in archive catalogue */}
                        {supabaseMovie?.archive_identifier && isDownloaded && (
                            <TouchableOpacity
                                style={[styles.actionBtn, styles.watchBtn]}
                                onPress={() => setMoviePlayerVisible(true)}
                            >
                                <Image source={icons.play} style={[styles.iconSm, { marginRight: 8 }]} tintColor="#fff" />
                                <Text style={styles.actionBtnText}>Watch Movie</Text>
                            </TouchableOpacity>
                        )}
                        {/* Download / Access button */}
                        {!isDownloaded && (
                            <TouchableOpacity
                                onPress={handleDownload}
                                disabled={downloadLoading}
                                style={[styles.actionBtn, styles.downloadBtn, downloadLoading && styles.disabledBtn]}
                            >
                                {downloadLoading ? (
                                    <ActivityIndicator color="#D4AF37" />
                                ) : (
                                    <>
                                        <Image source={icons.arrow}
                                            style={[styles.iconSm, { marginRight: 8, transform: [{ rotate: "90deg" }] }]}
                                            tintColor="#fff"
                                        />
                                        <Text style={styles.actionBtnText}>
                                            {supabaseMovie?.archive_identifier ? "Watch · 5,000 UGX" : "Download · 5,000 UGX"}
                                        </Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        )}
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

            <TrailerPlayer
                visible={trailerVisible}
                videoKey={trailerKey}
                movieTitle={movie?.title || ""}
                onClose={() => setTrailerVisible(false)}
            />

            {/* Full movie player — Internet Archive stream */}
            {supabaseMovie?.archive_identifier && (
                <MoviePlayer
                    visible={moviePlayerVisible}
                    archiveIdentifier={supabaseMovie.archive_identifier}
                    archiveUrl={supabaseMovie.archive_url || undefined}
                    movieTitle={movie?.title || ""}
                    onClose={() => setMoviePlayerVisible(false)}
                />
            )}
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
    trailerBtn: { backgroundColor: "#D4AF37" },
    downloadBtn: { backgroundColor: COLORS.dark100 },
    watchBtn: { backgroundColor: "#1a5c1a" },
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
