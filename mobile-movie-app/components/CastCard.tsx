import { View, Text, Image } from "react-native";

interface CastCardProps {
    cast: CastMember;
}

const CastCard = ({ cast }: CastCardProps) => {
    return (
        <View className="mr-4 w-24">
            <Image
                source={{
                    uri: cast.profile_path
                        ? `https://image.tmdb.org/t/p/w200${cast.profile_path}`
                        : "https://placehold.co/200x300/1a1a1a/FFFFFF.png?text=No+Image",
                }}
                className="w-24 h-32 rounded-lg"
                resizeMode="cover"
            />
            <Text className="text-white text-xs font-semibold mt-2" numberOfLines={2}>
                {cast.name}
            </Text>
            <Text className="text-light-300 text-xs mt-1" numberOfLines={1}>
                {cast.character}
            </Text>
        </View>
    );
};

export default CastCard;
