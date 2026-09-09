import {
    View, Text, FlatList, Image,
    TouchableOpacity, Alert, StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useState, useEffect } from "react";
import { icons } from "@/constants/icons";
import { images } from "@/constants/images";
import { useAuth } from "@/context/AuthContext";
import { getFavorites, removeFavorite, type FavoriteMovie } from "@/services/eliteApi";
import LoadingScreen from "@/components/LoadingScreen";
import EmptyState from "@/components/EmptyState";
import ErrorMessage from "@/components/ErrorMessage";

const GOLD = "#D4AF37";
const BG   = "#09090F";

const Saved = () => {
    const router = useRouter();
    const { user, isAuthenticated } = useAuth();
    const [favorites, setFavorites] = useState<FavoriteMovie[]>([]);
    const [loading, setLoading]     = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError]         = useState<string | null>(null);

    const loadFavorites = async () => {
        if (!user) { setLoading(false); return; }
        try {
            setError(null);
            const favs = await getFavorites(user.email);
            setFavorites(favs);
        } catch {
            setError("Failed to load saved movies");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => { loadFavorites(); }, [user]);

    const handleRemove = async (movieId: number, favId: number) => {
        if (!user) return;
        try {
            await removeFavorite(user.email, movieId);
            setFavorites(prev => prev.filter(f => f.id !== favId));
        } catch {
            Alert.alert("Error", "Failed to remove saved movie");
        }
    };

    if (!isAuthenticated) {
        return (
            <View style={S.root}>
                <Image source={images.bg} style={S.bgAbs} resizeMode="cover" />
                <EmptyState
                    icon={icons.save}
                    title="No session yet"
                    message="Pay for a movie to start your saved collection. Your email becomes your account."
                    actionLabel="Browse Movies"
                    onAction={() => router.push("/(tabs)")}
                />
            </View>
        );
    }

    if (loading) return <LoadingScreen />;

    if (error) {
        return (
            <View style={S.root}>
                <Image source={images.bg} style={S.bgAbs} resizeMode="cover" />
                <ErrorMessage message={error} onRetry={loadFavorites} />
            </View>
        );
    }

    if (favorites.length === 0) {
        return (
            <View style={S.root}>
                <Image source={images.bg} style={S.bgAbs} resizeMode="cover" />
                <View style={S.content}>
                    <Text style={S.heading}>Saved Movies</Text>
                    <EmptyState
                        icon={icons.save}
                        title="Nothing saved yet"
                        message="Tap the bookmark icon on any movie to save it here."
                        actionLabel="Browse Movies"
                        onAction={() => router.push("/(tabs)")}
                    />
                </View>
            </View>
        );
    }

    return (
        <View style={S.root}>
            <Image source={images.bg} style={S.bgAbs} resizeMode="cover" />
            <SafeAreaView style={{ flex: 1 }}>
                <View style={S.content}>
                    <Text style={S.heading}>Saved Movies ({favorites.length})</Text>
                    <FlatList
                        data={favorites}
                        numColumns={3}
                        keyExtractor={item => String(item.id)}
                        showsVerticalScrollIndicator={false}
                        refreshing={refreshing}
                        onRefresh={() => { setRefreshing(true); loadFavorites(); }}
                        columnWrapperStyle={S.row}
                        contentContainerStyle={{ paddingBottom: 100 }}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={S.card}
                                onPress={() => router.push(`/movies/${item.movie_id}`)}
                                activeOpacity={0.88}
                            >
                                <Image
                                    source={{ uri: item.poster_url }}
                                    style={S.poster}
                                    resizeMode="cover"
                                />
                                {/* Remove button */}
                                <TouchableOpacity
                                    style={S.removeBtn}
                                    onPress={() => handleRemove(item.movie_id, item.id)}
                                >
                                    <Text style={S.removeTxt}>✕</Text>
                                </TouchableOpacity>
                                <Text style={S.title} numberOfLines={2}>{item.title}</Text>
                                <Text style={S.year}>{item.release_year}</Text>
                            </TouchableOpacity>
                        )}
                    />
                </View>
            </SafeAreaView>
        </View>
    );
};

const S = StyleSheet.create({
    root:      { flex: 1, backgroundColor: BG },
    bgAbs:     { position: "absolute", width: "100%", height: "100%", opacity: 0.18 },
    content:   { flex: 1, paddingHorizontal: 16 },
    heading:   { color: "#fff", fontSize: 22, fontWeight: "800", marginTop: 56, marginBottom: 16 },
    row:       { justifyContent: "flex-start", gap: 10, marginBottom: 12 },
    card:      { width: "30%" },
    poster:    { width: "100%", height: 155, borderRadius: 12, marginBottom: 5 },
    removeBtn: {
        position: "absolute", top: 6, right: 6,
        backgroundColor: "rgba(0,0,0,0.75)", borderRadius: 10,
        paddingHorizontal: 5, paddingVertical: 2,
    },
    removeTxt: { color: "#fff", fontSize: 10, fontWeight: "700" },
    title:     { color: "#E5E5E5", fontSize: 11, fontWeight: "600", lineHeight: 15 },
    year:      { color: "#666", fontSize: 10, marginTop: 2 },
});

export default Saved;
