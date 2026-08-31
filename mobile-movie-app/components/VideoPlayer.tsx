import { View, TouchableOpacity, Image, Linking, Alert, Text } from "react-native";
import { icons } from "@/constants/icons";

interface VideoPlayerProps {
    videoKey: string;
    type?: string;
}

const VideoPlayer = ({ videoKey, type = "Trailer" }: VideoPlayerProps) => {
    const handlePlayVideo = async () => {
        const youtubeUrl = `https://www.youtube.com/watch?v=${videoKey}`;
        
        try {
            const supported = await Linking.canOpenURL(youtubeUrl);
            
            if (supported) {
                await Linking.openURL(youtubeUrl);
            } else {
                Alert.alert("Error", "Cannot open YouTube video");
            }
        } catch (error) {
            Alert.alert("Error", "Failed to open video");
        }
    };

    return (
        <TouchableOpacity
            onPress={handlePlayVideo}
            className="bg-accent rounded-lg py-3 px-6 flex-row items-center justify-center"
        >
            <Image
                source={icons.play}
                className="size-5 mr-2"
                tintColor="#fff"
            />
            <Text className="text-white font-semibold text-base">
                Watch {type}
            </Text>
        </TouchableOpacity>
    );
};

export default VideoPlayer;
