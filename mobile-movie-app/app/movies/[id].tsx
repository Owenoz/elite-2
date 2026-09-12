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
} from "@/services/api";
import {
    getMovieByTmdbId,
    getMovieAccess,
    addFavorite,
    removeFavorite,
    type EliteMovie,
    type PaymentVerifyResult,
} from "@/services/eliteApi";
import {
    downloadMovie,
    isDownloadedLocally,
    formatBytes,
    type DownloadProgress,
} from "@/services/downloadManager";
import CastCard from "@/components/CastCard";
import PaymentModal from "@/components/PaymentModal";
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
    // Removed trailer state — no trailer, only full movie
    const [eliteMovie, setEliteMovie] = useState<EliteMovie | null>(null);
    const [moviePlayerVisible, setMoviePlayerVisible] = useState(false);
    const [userEmail, setUserEmail] = useState<string | null>(null);
    const [archiveIdentifier, setArchiveIdentifier] = useState<string | null>(null);
    const [archiveUrl, setArchiveUrl] = useState<string | null>(null);
    const [localVideoUri, setLocalVideoUri] = useState<string | null>(null);
    const [downloadProgress, setDownloadProgress] = useState<DownloadProgress | null>(null);

    const { data: movie, loading: movieLoading } = useFetch(() =>
        fetchMovieDetails(id as string)
    );
    const { data: credits, loading: creditsLoading } = useFetch(() =>
        fetchMovieCredits(id as string)
    );

    useEffect(() => {
        setIsFavorite(false);
        setIsDownloaded(false);
        setEliteMovie(null);
        setUserEmail(null);
        setArchiveIdentifier(null);
        setArchiveUrl(null);
        setLocalVideoUri(null);
        setDownloadProgress(null);

        if (id) {
            getMovieByTmdbId(Number(id)).then(async em => {
                if (em) {
                    setEliteMovie(em);
                    setArchiveIdentifier(em.archive_identifier);
                    setArchiveUrl(em.archive_url);
                    // Check if already downloaded locally
                    const localUri = await isDownloadedLocally(em.tmdb_id);
                    if (localUri) {
                        setLocalVideoUri(localUri);
                        setIsDownloaded(true);
                    }
                }
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

    // Download = payment gate → on success open MoviePlayer
    const handleDownload = () => {
        if (!movie) return;
        if (isDownloaded) {
            // Already paid — open player directly
            if (archiveIdentifier) {
                setMoviePlayerVisible(true);
            } else {
                Alert.alert("Coming Soon", "This movie's stream is being set up. Check back soon.");
            }
            return;
        }
        setPaymentVisible(true);
    };

    // Called by PaymentModal after real OTP verification on the server
    const handlePaymentSuccess = async (email: string, result: PaymentVerifyResult) => {
        setPaymentVisible(false);
        setUserEmail(email);

        const archiveId  = result.archive_identifier || archiveIdentifier;
        const streamUrl  = result.archive_url || archiveUrl;

        if (result.archive_identifier) setArchiveIdentifier(result.archive_identifier);
        if (result.archive_url)        setArchiveUrl(result.archive_url);

        setIsDownloaded(true);

        // ── Start offline download to local storage ──────────────────────────
        if (streamUrl && archiveId && movie) {
            const posterUrl = `https://image.tmdb.org/t/p/w342${movie.poster_path}`;
            try {
                const localUri = await downloadMovie(
                    movie.id,
                    movie.title,
                    streamUrl,
                    archiveId,
                    posterUrl,
                    (progress) => {
                        setDownloadProgress(progress);
                        if (progress.status === "completed") {
                            setLocalVideoUri(progress.bytesDownloaded > 0 ? localUri : null);
                        }
                    }
                );
                setLocalVideoUri(localUri);
                // Open player after download starts
                setTimeout(() => setMoviePlayerVisible(true), 300);
            } catch (err: any) {
                // Download failed — still open streaming player
                console.error("Offline download failed:", err.message);
                setTimeout(() => setMoviePlayerVisible(true), 300);
            }
        } else if (archiveId) {
            // No stream URL but archive id available — open streaming player
            setTimeout(() => setMoviePlayerVisible(true), 300);
        }
    };

    const handlePlayTrailer = () => {
        // Trailer removed — show full movie only
    };

    const trailerKey = "";

    const loading = movieLoading || creditsLoading;

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
                        {/* Watch Movie — primary action, always shown for catalogue movies */}
                        {isDownloaded && archiveIdentifier ? (
                            /* Already paid — watch immediately */
                            <TouchableOpacity
                                style={[styles.actionBtn, styles.watchBtn]}
                                onPress={() => setMoviePlayerVisible(true)}
                            >
                                <Image source={icons.play} style={[styles.iconSm, { marginRight: 8 }]} tintColor="#fff" />
                                <Text style={styles.actionBtnText}>
                                    {localVideoUri ? "▶ Watch Offline" : "▶ Watch Movie"}
                                </Text>
                            </TouchableOpacity>
                        ) : archiveIdentifier ? (
                            /* Not paid yet — show pay to watch */
                            <TouchableOpacity
                                onPress={handleDownload}
                                disabled={downloadLoading}
                                style={[styles.actionBtn, styles.trailerBtn, downloadLoading && styles.disabledBtn]}
                            >
                                {downloadLoading ? (
                                    <ActivityIndicator color="#000" />
                                ) : (
                                    <>
                                        <Image source={icons.play} style={[styles.iconSm, { marginRight: 8 }]} tintColor="#000" />
                                        <Text style={[styles.actionBtnText, { color: "#000" }]}>
                                            Watch · 5,000 UGX
                                        </Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        ) : (
                            /* Movie not in catalogue */
                            <View style={[styles.actionBtn, styles.downloadBtn]}>
                                <Text style={[styles.actionBtnText, { color: "#666" }]}>
                                    Not available yet
                                </Text>
                            </View>
                        )}

                        {/* Bookmark button */}
                        <TouchableOpacity
                            onPress={handleFavoriteToggle}
                            disabled={favoriteLoading}
                            style={[styles.actionBtn, styles.downloadBtn, { flex: 0, paddingHorizontal: 16 }]}
                        >
                            <Image
                                source={icons.save}
                                style={styles.iconSm}
                                tintColor={isFavorite ? "#D4AF37" : "#fff"}
                            />
                        </TouchableOpacity>
                    </View>

                    {/* Download progress bar */}
                    {downloadProgress && downloadProgress.status === "downloading" && (
                        <View style={styles.progressWrap}>
                            <View style={styles.progressBg}>
                                <View style={[styles.progressFill,
                                    { width: `${Math.round(downloadProgress.progress * 100)}%` as any }
                                ]} />
                            </View>
                            <View style={styles.progressRow}>
                                <Text style={styles.progressText}>
                                    ⬇ Downloading offline copy…
                                </Text>
                                <Text style={styles.progressPct}>
                                    {formatBytes(downloadProgress.bytesDownloaded)} / {formatBytes(downloadProgress.totalBytes)}
                                </Text>
                            </View>
                        </View>
                    )}
                    {downloadProgress?.status === "completed" && localVideoUri && (
                        <View style={styles.offlineBadge}>
                            <Text style={styles.offlineBadgeText}>✅ Saved offline · {formatBytes(downloadProgress.bytesDownloaded)}</Text>
                        </View>
                    )}

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
                        <MovieInfo label="Runtime" value={movie?.runtime ? `${movie.runtime} min` : "N/A"} />
                        <MovieInfo label="Language" value={movie?.original_language?.toUpperCase()} />
                        <MovieInfo label="Year" value={eliteMovie?.release_year?.toString()} />
                    </View>

                    <MovieInfo
                        label="Production Companies"
                        value={movie?.production_companies?.map((c: any) => c.name).join(" • ") || "N/A"}
                    />
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
                movieId={movie?.id || 0}
                onClose={() => setPaymentVisible(false)}
                onPaymentSuccess={handlePaymentSuccess}
            />

            {/* Full movie player — local file first, then archive stream */}
            {archiveIdentifier && (
                <MoviePlayer
                    visible={moviePlayerVisible}
                    archiveIdentifier={archiveIdentifier}
                    archiveUrl={archiveUrl || undefined}
                    localUri={localVideoUri || undefined}
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
    progressWrap: { marginTop: 10, marginBottom: 4 },
    progressBg: { height: 6, backgroundColor: COLORS.dark100, borderRadius: 3, overflow: "hidden" },
    progressFill: { height: "100%", backgroundColor: "#D4AF37", borderRadius: 3 },
    progressRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 5 },
    progressText: { color: COLORS.light200, fontSize: 11 },
    progressPct: { color: "#D4AF37", fontSize: 11, fontWeight: "700" },
    offlineBadge: {
        backgroundColor: "rgba(22,163,74,0.12)", borderRadius: 8,
        paddingHorizontal: 10, paddingVertical: 5, marginTop: 6,
        alignSelf: "flex-start", borderWidth: 1, borderColor: "rgba(22,163,74,0.3)",
    },
    offlineBadgeText: { color: "#4ade80", fontSize: 11, fontWeight: "600" },
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
