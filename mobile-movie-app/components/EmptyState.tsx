import { View, Text, Image, TouchableOpacity } from "react-native";

interface EmptyStateProps {
    icon: any;
    title: string;
    message: string;
    actionLabel?: string;
    onAction?: () => void;
}

const EmptyState = ({
    icon,
    title,
    message,
    actionLabel,
    onAction,
}: EmptyStateProps) => {
    return (
        <View className="flex-1 justify-center items-center px-8">
            <Image source={icon} className="size-20 mb-4" tintColor="#AB8BFF" />
            <Text className="text-white text-xl font-bold text-center mb-3">
                {title}
            </Text>
            <Text className="text-light-200 text-center mb-6">{message}</Text>
            {actionLabel && onAction && (
                <TouchableOpacity
                    onPress={onAction}
                    className="bg-accent px-8 py-3 rounded-lg"
                >
                    <Text className="text-white font-semibold">{actionLabel}</Text>
                </TouchableOpacity>
            )}
        </View>
    );
};

export default EmptyState;
