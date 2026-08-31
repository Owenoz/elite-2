import { icons } from "@/constants/icons";
import { View, Text, Image, TouchableOpacity, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "expo-router";
import CustomButton from "@/components/CustomButton";
import { useState, useEffect } from "react";
import { getFavorites } from "@/services/appwrite";

const Profile = () => {
    const { user, userProfile, logout } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [savedCount, setSavedCount] = useState(0);

    useEffect(() => {
        const loadStats = async () => {
            if (user) {
                const favorites = await getFavorites(user.$id);
                setSavedCount(favorites.length);
            }
        };
        loadStats();
    }, [user]);

    const handleLogout = async () => {
        Alert.alert("Logout", "Are you sure you want to logout?", [
            {
                text: "Cancel",
                style: "cancel",
            },
            {
                text: "Logout",
                style: "destructive",
                onPress: async () => {
                    setLoading(true);
                    try {
                        await logout();
                        router.replace("/onboarding");
                    } catch (error) {
                        Alert.alert("Error", "Failed to logout");
                    } finally {
                        setLoading(false);
                    }
                },
            },
        ]);
    };

    return (
        // SafeAreaView ensures content is not obscured by system UI (like notches).
        <SafeAreaView className="bg-primary flex-1 px-8">
            <View className="flex-1 mt-10">
                {/* Header */}
                <Text className="text-white text-2xl font-bold mb-8">Profile</Text>

                {/* Profile Card */}
                <View className="bg-dark-100 rounded-2xl p-6 items-center mb-6">
                    <Image
                        source={{
                            uri:
                                userProfile?.avatar ||
                                `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                    user?.name || "User"
                                )}&background=AB8BFF&color=fff`,
                        }}
                        className="size-24 rounded-full mb-4"
                    />
                    <Text className="text-white text-xl font-bold">
                        {user?.name || "Guest"}
                    </Text>
                    <Text className="text-light-200 text-sm mt-1">
                        {user?.email || "guest@example.com"}
                    </Text>
                </View>

                {/* Stats Section */}
                <View className="bg-dark-100 rounded-2xl p-6 mb-6">
                    <Text className="text-white text-lg font-bold mb-4">
                        Your Stats
                    </Text>
                    <View className="flex-row justify-around">
                        <View className="items-center">
                            <Text className="text-accent text-2xl font-bold">0</Text>
                            <Text className="text-light-200 text-sm mt-1">Watched</Text>
                        </View>
                        <View className="items-center">
                            <Text className="text-accent text-2xl font-bold">{savedCount}</Text>
                            <Text className="text-light-200 text-sm mt-1">Saved</Text>
                        </View>
                        <View className="items-center">
                            <Text className="text-accent text-2xl font-bold">0</Text>
                            <Text className="text-light-200 text-sm mt-1">Reviews</Text>
                        </View>
                    </View>
                </View>

                {/* Menu Items */}
                <View className="bg-dark-100 rounded-2xl p-4 mb-6">
                    <TouchableOpacity className="flex-row items-center justify-between py-4 px-2 border-b border-dark-200">
                        <View className="flex-row items-center">
                            <Image
                                source={icons.person}
                                className="size-5 mr-3"
                                tintColor="#AB8BFF"
                            />
                            <Text className="text-white text-base">Edit Profile</Text>
                        </View>
                        <Image
                            source={icons.arrow}
                            className="size-4"
                            tintColor="#9CA4AB"
                        />
                    </TouchableOpacity>

                    <TouchableOpacity 
                        onPress={() => router.push("/(tabs)/saved")}
                        className="flex-row items-center justify-between py-4 px-2 border-b border-dark-200"
                    >
                        <View className="flex-row items-center">
                            <Image
                                source={icons.save}
                                className="size-5 mr-3"
                                tintColor="#AB8BFF"
                            />
                            <Text className="text-white text-base">My Saved Movies</Text>
                        </View>
                        <View className="flex-row items-center">
                            <Text className="text-accent text-sm mr-2">{savedCount}</Text>
                            <Image
                                source={icons.arrow}
                                className="size-4"
                                tintColor="#9CA4AB"
                            />
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity className="flex-row items-center justify-between py-4 px-2">
                        <View className="flex-row items-center">
                            <Image
                                source={icons.search}
                                className="size-5 mr-3"
                                tintColor="#AB8BFF"
                            />
                            <Text className="text-white text-base">Settings</Text>
                        </View>
                        <Image
                            source={icons.arrow}
                            className="size-4"
                            tintColor="#9CA4AB"
                        />
                    </TouchableOpacity>
                </View>

                {/* Logout Button */}
                <CustomButton
                    title="Logout"
                    onPress={handleLogout}
                    loading={loading}
                    variant="secondary"
                />
            </View>
        </SafeAreaView>
    );
};

export default Profile;