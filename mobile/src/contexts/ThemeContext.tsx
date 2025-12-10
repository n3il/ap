import AsyncStorage from "@react-native-async-storage/async-storage";
import { DripsyProvider } from "dripsy";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Appearance } from "react-native";

import darkTheme from "@/theme/base";
import { dripsyDarkTheme, dripsyLightTheme } from "@/theme/dripsy";
import lightTheme from "@/theme/light";

const STORAGE_KEY = "@themePreference";
const normalize = (v) => (v === "dark" ? "dark" : "light");

const ThemeContext = createContext({
  theme: lightTheme,
  dripsyTheme: dripsyLightTheme,
  colorScheme: "light",
  themePreference: "system",
  isDark: false,
  setThemePreference: () => {},
  toggleTheme: () => {},
});

export const ThemeProvider = ({ children }) => {
  const [themePreference, setThemePreference] = useState("system");
  const [systemScheme, setSystemScheme] = useState(
    normalize(Appearance.getColorScheme()),
  );
  const [hydrated, setHydrated] = useState(false);

  // Load saved preference
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
      if (stored) setThemePreference(stored);
      setHydrated(true);
    });
  }, []);

  // Persist preference
  useEffect(() => {
    if (hydrated) AsyncStorage.setItem(STORAGE_KEY, themePreference);
  }, [hydrated, themePreference]);

  // React to OS / Simulator theme changes
  useEffect(() => {
    const subscription = Appearance.addChangeListener(() => {
      const updated = normalize(Appearance.getColorScheme());
      setSystemScheme(updated);
    });
    return () => subscription?.remove?.();
  }, []);

  // Toggle theme
  const toggleTheme = useCallback(() => {
    setThemePreference((prev) => {
      if (prev === "system") {
        return systemScheme === "dark" ? "light" : "dark";
      }
      return prev === "dark" ? "light" : "dark";
    });
  }, [systemScheme]);

  const appliedScheme =
    themePreference === "system" ? systemScheme : themePreference;

  const theme = appliedScheme === "dark" ? darkTheme : lightTheme;
  const dripsyTheme =
    appliedScheme === "dark" ? dripsyDarkTheme : dripsyLightTheme;

  const value = useMemo(
    () => ({
      theme,
      dripsyTheme,
      colorScheme: appliedScheme,
      themePreference,
      isDark: appliedScheme === "dark",
      setThemePreference,
      toggleTheme,
    }),
    [theme, dripsyTheme, appliedScheme, themePreference, toggleTheme],
  );

  return (
    <ThemeContext.Provider value={value}>
      <DripsyProvider theme={dripsyTheme}>{children}</DripsyProvider>
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
