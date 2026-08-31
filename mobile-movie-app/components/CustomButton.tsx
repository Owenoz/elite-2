import { TouchableOpacity, Text, ActivityIndicator } from "react-native";

interface CustomButtonProps {
    title: string;
    onPress: () => void;
    loading?: boolean;
    disabled?: boolean;
    variant?: "primary" | "secondary";
    className?: string;
}

const CustomButton = ({
    title,
    onPress,
    loading = false,
    disabled = false,
    variant = "primary",
    className = "",
}: CustomButtonProps) => {
    const bgColor = variant === "primary" ? "bg-accent" : "bg-dark-100";
    const opacity = disabled || loading ? "opacity-50" : "opacity-100";

    return (
        <TouchableOpacity
            onPress={onPress}
            disabled={disabled || loading}
            className={`${bgColor} ${opacity} rounded-lg py-4 flex-row items-center justify-center ${className}`}
        >
            {loading ? (
                <ActivityIndicator color="#fff" />
            ) : (
                <Text className="text-white font-semibold text-base">{title}</Text>
            )}
        </TouchableOpacity>
    );
};

export default CustomButton;
