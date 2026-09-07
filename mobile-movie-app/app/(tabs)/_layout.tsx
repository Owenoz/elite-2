import React from "react";
import { Tabs } from "expo-router";
import { View, Text, Image, StyleSheet } from "react-native";
import { icons } from "@/constants/icons";

const GOLD = "#D4AF37";
const BG = "#0D0D17";
const ACTIVE_BG = "#1C1B2E";

const TabIcon = ({ focused, icon, title }: { focused: boolean; icon: any; title: string }) => (
    <View style={[S.tabItem, focused && S.tabItemActive]}>
        <Image
            source={icon}
            style={S.tabIcon}
            tintColor={focused ? GOLD : "#444"}
        />
        {focused && <Text style={S.tabLabel}>{title}</Text>}
    </View>
);

const TabsLayout = () => (
    <Tabs
        screenOptions={{
            tabBarShowLabel: false,
            tabBarStyle: S.tabBar,
            tabBarItemStyle: S.tabBarItem,
        }}
    >
        <Tabs.Screen
            name="index"
            options={{
                title: "Home", headerShown: false,
                tabBarIcon: ({ focused }) => <TabIcon focused={focused} icon={icons.home} title="Home" />,
            }}
        />
        <Tabs.Screen
            name="search"
            options={{
                title: "Search", headerShown: false,
                tabBarIcon: ({ focused }) => <TabIcon focused={focused} icon={icons.search} title="Search" />,
            }}
        />
        <Tabs.Screen
            name="save"
            options={{
                title: "Saved", headerShown: false,
                tabBarIcon: ({ focused }) => <TabIcon focused={focused} icon={icons.save} title="Saved" />,
            }}
        />
        <Tabs.Screen
            name="saved"
            options={{ title: "Saved", headerShown: false, href: null }}
        />
        <Tabs.Screen
            name="profile"
            options={{
                title: "Profile", headerShown: false,
                tabBarIcon: ({ focused }) => <TabIcon focused={focused} icon={icons.person} title="Profile" />,
            }}
        />
    </Tabs>
);

const S = StyleSheet.create({
    tabBar: {
        backgroundColor: BG,
        borderTopWidth: 1,
        borderTopColor: "#1a1a28",
        height: 70,
        paddingBottom: 10,
        paddingTop: 8,
        position: "absolute",
        borderRadius: 0,
        elevation: 20,
        shadowColor: "#000",
        shadowOpacity: 0.5,
        shadowRadius: 10,
    },
    tabBarItem: {
        justifyContent: "center",
        alignItems: "center",
    },
    tabItem: {
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 20,
        minWidth: 52,
        flexDirection: "row",
        gap: 6,
    },
    tabItemActive: {
        backgroundColor: ACTIVE_BG,
        borderWidth: 1,
        borderColor: "#2a2840",
    },
    tabIcon: { width: 22, height: 22 },
    tabLabel: { color: GOLD, fontSize: 12, fontWeight: "700" },
});

export default TabsLayout;
