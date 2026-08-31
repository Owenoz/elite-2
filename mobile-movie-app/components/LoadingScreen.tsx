import { View, ActivityIndicator, Image } from "react-native";
import { images } from "@/constants/images";

interface LoadingScreenProps {
    size?: "small" | "large";
}

const LoadingScreen = ({ size = "large" }: LoadingScreenProps) => {
    return (
        <View className="flex-1 bg-primary justify-center items-center">
            <Image
                source={images.bg}
                className="absolute w-full h-full"
                resizeMode="cover"
            />
            <ActivityIndicator size={size} color="#AB8BFF" />
        </View>
    );
};

export default LoadingScreen;
