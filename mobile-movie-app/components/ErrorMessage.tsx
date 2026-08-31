import { View, Text, Image, TouchableOpacity } from "react-native";
import { icons } from "@/constants/icons";

interface ErrorMessageProps {
    message?: string;
    onRetry?: () => void;
}

const ErrorMessage = ({
    message = "Something went wrong",
    onRetry,
}: ErrorMessageProps) => {
    return (
        <View className="flex-1 justify-center items-center px-8">
            <Image
                source={icons.search}
                className="size-16 mb-4"
                tintColor="#9CA4AB"
            />
            <Text className="text-white text-xl font-bold text-center mb-2">
                Oops!
            </Text>
            <Text className="text-light-200 text-center mb-6">{message}</Text>
            {onRetry && (
                <TouchableOpacity
                    onPress={onRetry}
                    className="bg-accent px-8 py-3 rounded-lg"
                >
                    <Text className="text-white font-semibold">Try Again</Text>
                </TouchableOpacity>
            )}
        </View>
    );
};

export default ErrorMessage;
