import React from "react";
import { View, ViewStyle, ViewProps } from "react-native";
import { useColorScheme } from "../hooks/useColorScheme";

interface ThemedViewProps extends ViewProps {
  style?: ViewStyle | ViewStyle[];
  children?: React.ReactNode;
}

export function ThemedView({ style, children, ...props }: ThemedViewProps) {
  const colorScheme = useColorScheme();

  return (
    <View
      style={[
        {
          backgroundColor: colorScheme === "dark" ? "#000" : "#fff",
        },
        style,
      ].flat()}
      {...props}
    >
      {children}
    </View>
  );
}
