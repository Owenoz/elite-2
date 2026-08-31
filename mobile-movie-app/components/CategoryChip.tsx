import { TouchableOpacity, Text } from "react-native";

interface CategoryChipProps {
    label: string;
    selected?: boolean;
    onPress: () => void;
}

const CategoryChip = ({ label, selected = false, onPress }: CategoryChipProps) => {
    const bgColor = selected ? "bg-accent" : "bg-dark-100";
    const textColor = selected ? "text-white" : "text-light-200";

    return (
        <TouchableOpacity
            onPress={onPress}
            className={`${bgColor} px-4 py-2 rounded-full mr-3`}
        >
            <Text className={`${textColor} text-sm font-medium`}>{label}</Text>
        </TouchableOpacity>
    );
};

export default CategoryChip;
