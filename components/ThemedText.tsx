import React from "react";
import { Text, TextStyle, TextProps } from "react-native";
import { useColorScheme } from "../hooks/useColorScheme";

interface ThemedTextProps extends TextProps {
  style?: TextStyle | TextStyle[];
  children?: React.ReactNode;
}

export function ThemedText({ style, children, ...props }: ThemedTextProps) {
  const colorScheme = useColorScheme();

  return (
    <Text
      style={[
        {
          color: colorScheme === "dark" ? "#fff" : "#000",
        },
        style,
      ].flat()}
      {...props}
    >
      {children}
    </Text>
  );
}
