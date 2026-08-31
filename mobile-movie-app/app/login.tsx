import {
    View,
    Text,
    Image,
    ScrollView,
    TouchableOpacity,
    Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useState } from "react";
import { images } from "@/constants/images";
import { icons } from "@/constants/icons";
import FormField from "@/components/FormField";
import CustomButton from "@/components/CustomButton";
import { signIn } from "@/services/appwrite";
import { useAuth } from "@/context/AuthContext";

const Login = () => {
    const router = useRouter();
    const { refreshUser } = useAuth();
    const [form, setForm] = useState({
        email: "",
        password: "",
    });
    const [errors, setErrors] = useState<{ email?: string; password?: string }>(
        {}
    );
    const [loading, setLoading] = useState(false);

    const validateForm = () => {
        const newErrors: { email?: string; password?: string } = {};

        if (!form.email) {
            newErrors.email = "Email is required";
        } else if (!/\S+@\S+\.\S+/.test(form.email)) {
            newErrors.email = "Email is invalid";
        }

        if (!form.password) {
            newErrors.password = "Password is required";
        } else if (form.password.length < 8) {
            newErrors.password = "Password must be at least 8 characters";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleLogin = async () => {
        if (!validateForm()) return;

        setLoading(true);
        try {
            await signIn(form.email, form.password);
            await refreshUser();
            router.replace("/(tabs)");
        } catch (error: any) {
            Alert.alert("Login Failed", error.message || "Invalid credentials");
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView className="bg-primary flex-1">
            <Image
                source={images.bg}
                className="absolute w-full h-full"
                resizeMode="cover"
            />
            <ScrollView
                contentContainerStyle={{ minHeight: "100%" }}
                showsVerticalScrollIndicator={false}
            >
                <View className="flex-1 px-8 py-10">
                    {/* Logo */}
                    <TouchableOpacity
                        onPress={() => router.back()}
                        className="mb-8"
                    >
                        <Image
                            source={icons.arrow}
                            className="size-6 rotate-180"
                            tintColor="#fff"
                        />
                    </TouchableOpacity>

                    <Image source={icons.logo} className="w-12 h-10 mb-8" />

                    {/* Header */}
                    <Text className="text-white text-3xl font-bold mb-2">
                        Welcome Back
                    </Text>
                    <Text className="text-light-200 text-base mb-8">
                        Sign in to continue
                    </Text>

                    {/* Form */}
                    <View className="mb-6">
                        <FormField
                            label="Email"
                            value={form.email}
                            placeholder="Enter your email"
                            onChangeText={(text) => setForm({ ...form, email: text })}
                            keyboardType="email-address"
                            error={errors.email}
                        />

                        <FormField
                            label="Password"
                            value={form.password}
                            placeholder="Enter your password"
                            onChangeText={(text) => setForm({ ...form, password: text })}
                            secureTextEntry
                            error={errors.password}
                        />

                        <TouchableOpacity className="self-end mb-6">
                            <Text className="text-accent text-sm">Forgot Password?</Text>
                        </TouchableOpacity>

                        <CustomButton
                            title="Sign In"
                            onPress={handleLogin}
                            loading={loading}
                        />
                    </View>

                    {/* Sign Up Link */}
                    <View className="flex-row justify-center items-center mt-4">
                        <Text className="text-light-200 text-base">
                            Don't have an account?{" "}
                        </Text>
                        <TouchableOpacity onPress={() => router.push("/register")}>
                            <Text className="text-accent font-semibold text-base">
                                Sign Up
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

export default Login;
