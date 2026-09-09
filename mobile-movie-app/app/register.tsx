import {
    View,
    Text,
    Image,
    ScrollView,
    TouchableOpacity,
    Alert,
    Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useState } from "react";
import { images } from "@/constants/images";
import { icons } from "@/constants/icons";
import FormField from "@/components/FormField";
import CustomButton from "@/components/CustomButton";
import { useAuth } from "@/context/AuthContext";

const Register = () => {
    const router = useRouter();
    const { setSessionEmail } = useAuth();
    const [form, setForm] = useState({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
    });
    const [errors, setErrors] = useState<{
        name?: string;
        email?: string;
        password?: string;
        confirmPassword?: string;
    }>({});
    const [loading, setLoading] = useState(false);

    const validateForm = () => {
        const newErrors: {
            name?: string;
            email?: string;
            password?: string;
            confirmPassword?: string;
        } = {};

        if (!form.name) {
            newErrors.name = "Name is required";
        } else if (form.name.length < 2) {
            newErrors.name = "Name must be at least 2 characters";
        }

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

        if (!form.confirmPassword) {
            newErrors.confirmPassword = "Please confirm your password";
        } else if (form.password !== form.confirmPassword) {
            newErrors.confirmPassword = "Passwords do not match";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleRegister = async () => {
        if (!validateForm()) return;

        setLoading(true);
        try {
            // Save email + name as local session
            await setSessionEmail(form.email, form.name);
            router.replace("/(tabs)");
        } catch (error: any) {
            if (Platform.OS === "web") {
                alert(error.message || "Failed to create account");
            } else {
                Alert.alert(
                    "Registration Failed",
                    error.message || "Failed to create account"
                );
            }
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
                    {/* Back Button */}
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
                        Create Account
                    </Text>
                    <Text className="text-light-200 text-base mb-8">
                        Sign up to get started
                    </Text>

                    {/* Form */}
                    <View className="mb-6">
                        <FormField
                            label="Full Name"
                            value={form.name}
                            placeholder="Enter your full name"
                            onChangeText={(text) => setForm({ ...form, name: text })}
                            error={errors.name}
                        />

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

                        <FormField
                            label="Confirm Password"
                            value={form.confirmPassword}
                            placeholder="Confirm your password"
                            onChangeText={(text) =>
                                setForm({ ...form, confirmPassword: text })
                            }
                            secureTextEntry
                            error={errors.confirmPassword}
                        />

                        <CustomButton
                            title="Create Account"
                            onPress={handleRegister}
                            loading={loading}
                        />
                    </View>

                    {/* Sign In Link */}
                    <View className="flex-row justify-center items-center mt-4">
                        <Text className="text-light-200 text-base">
                            Already have an account?{" "}
                        </Text>
                        <TouchableOpacity onPress={() => router.push("/login")}>
                            <Text className="text-accent font-semibold text-base">
                                Sign In
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

export default Register;