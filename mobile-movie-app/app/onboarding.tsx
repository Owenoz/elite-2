import {
    StyleSheet,
    Text,
    View,
    Image,
    TouchableOpacity,
    Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { images } from "@/constants/images";
import { icons } from "@/constants/icons";
import CustomButton from "@/components/CustomButton";

const { width, height } = Dimensions.get("window");

export default function Onboarding() {
    const router = useRouter();

    return (
        <SafeAreaView className="bg-primary flex-1">
            <Image
                source={images.bg}
                className="absolute w-full h-full"
                resizeMode="cover"
            />
            <View className="flex-1 px-8 justify-between py-10">
                {/* Logo */}
                <View className="items-center mt-10">
                    <Image source={icons.logo} className="w-16 h-14" />
                </View>

                {/* Main Content */}
                <View className="items-center">
                    <Image
                        source={images.highlight}
                        className="w-72 h-96 mb-8"
                        resizeMode="contain"
                    />
                    <Text className="text-white text-4xl font-bold text-center mb-4">
                        Welcome to{"\n"}MovieHub
                    </Text>
                    <Text className="text-light-200 text-base text-center px-4">
                        Discover, save and track your favorite movies all in one place
                    </Text>
                </View>

                {/* Buttons */}
                <View className="gap-4">
                    <CustomButton
                        title="Get Started"
                        onPress={() => router.push("/register")}
                    />
                    <TouchableOpacity
                        onPress={() => router.push("/login")}
                        className="py-4 items-center"
                    >
                        <Text className="text-white text-base">
                            Already have an account?{" "}
                            <Text className="text-accent font-semibold">Sign In</Text>
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({});

