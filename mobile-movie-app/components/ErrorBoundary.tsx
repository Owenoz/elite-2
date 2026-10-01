import React from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";

interface State {
    hasError: boolean;
    error: string;
}

export class ErrorBoundary extends React.Component<
    { children: React.ReactNode },
    State
> {
    constructor(props: any) {
        super(props);
        this.state = { hasError: false, error: "" };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error: error?.message ?? String(error) };
    }

    componentDidCatch(error: Error, info: any) {
        console.error("ErrorBoundary caught:", error, info);
    }

    render() {
        if (this.state.hasError) {
            return (
                <View
                    style={{
                        flex: 1,
                        backgroundColor: "#030014",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: 24,
                    }}
                >
                    <Text style={{ color: "#AB8BFF", fontSize: 40, marginBottom: 16 }}>⚠️</Text>
                    <Text
                        style={{
                            color: "#fff",
                            fontSize: 20,
                            fontWeight: "bold",
                            textAlign: "center",
                            marginBottom: 8,
                        }}
                    >
                        Something went wrong
                    </Text>
                    <ScrollView style={{ maxHeight: 200, marginBottom: 24 }}>
                        <Text style={{ color: "#A8B5DB", fontSize: 12, textAlign: "center" }}>
                            {this.state.error}
                        </Text>
                    </ScrollView>
                    <TouchableOpacity
                        onPress={() => this.setState({ hasError: false, error: "" })}
                        style={{
                            backgroundColor: "#AB8BFF",
                            paddingHorizontal: 32,
                            paddingVertical: 12,
                            borderRadius: 12,
                        }}
                    >
                        <Text style={{ color: "#fff", fontWeight: "bold", fontSize: 16 }}>
                            Try Again
                        </Text>
                    </TouchableOpacity>
                </View>
            );
        }
        return this.props.children;
    }
}
