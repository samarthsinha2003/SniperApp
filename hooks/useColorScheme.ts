import { useColorScheme as _useColorScheme } from "react-native";

// A hook to get the device's color scheme ('light' | 'dark')
export function useColorScheme() {
  const colorScheme = _useColorScheme();
  return colorScheme ?? "light";
}
