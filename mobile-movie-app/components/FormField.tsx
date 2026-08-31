import { View, Text, TextInput, TouchableOpacity, Image } from "react-native";
import { useState } from "react";
import { icons } from "@/constants/icons";

interface FormFieldProps {
    label: string;
    value: string;
    placeholder: string;
    onChangeText: (text: string) => void;
    keyboardType?: "default" | "email-address" | "numeric" | "phone-pad";
    secureTextEntry?: boolean;
    error?: string;
}

const FormField = ({
    label,
    value,
    placeholder,
    onChangeText,
    keyboardType = "default",
    secureTextEntry = false,
    error,
}: FormFieldProps) => {
    const [showPassword, setShowPassword] = useState(false);

    return (
        <View className="mb-4">
            <Text className="text-white text-sm font-medium mb-2">{label}</Text>
            <View className="flex-row items-center bg-dark-200 rounded-lg px-4 py-4 border border-dark-100">
                <TextInput
                    value={value}
                    onChangeText={onChangeText}
                    placeholder={placeholder}
                    placeholderTextColor="#9CA4AB"
                    keyboardType={keyboardType}
                    secureTextEntry={secureTextEntry && !showPassword}
                    className="flex-1 text-white text-base"
                    autoCapitalize="none"
                />
                {secureTextEntry && (
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                        <Text className="text-accent text-sm">
                            {showPassword ? "Hide" : "Show"}
                        </Text>
                    </TouchableOpacity>
                )}
            </View>
            {error && <Text className="text-red-500 text-xs mt-1">{error}</Text>}
        </View>
    );
};

export default FormField;
