import AsyncStorage from "@react-native-async-storage/async-storage";
import { DripsyProvider } from "dripsy";
import React, {
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
const getSystemScheme = () => Appearance.getColorScheme() ?? "light";
const normalizeScheme = (value) => (value === "dark" ? "dark" : "light");
const normalizePreference = (value) =>
  value === "system" ? "system" : normalizeScheme(value);

const ThemeContext = createContext({
  theme: lightTheme,
  dripsyTheme: dripsyLightTheme,
  colorScheme: "light",
  themePreference: "system",
  isDark: false,
  setTheme: () => {},
  setThemePreference: () => {},
  toggleTheme: () => {},
});

ThemeContext.displayName = "ThemeContext";

export const ThemeProvider = ({ children }) => {
  const [systemScheme, setSystemScheme] = useState(getSystemScheme);
  const [preference, setPreference] = useState("system");
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadPreference = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (!isMounted || stored == null) return;
        setPreference((prev) => {
          const next = normalizePreference(stored);
          return next === prev ? prev : next;
        });
      } catch (error) {
        // Non-fatal: fall back to system if storage fails.
      } finally {
        if (isMounted) {
          setIsHydrated(true);
        }
      }
    };

    loadPreference();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!isHydrated) return;

    AsyncStorage.setItem(STORAGE_KEY, preference).catch(() => {
      // Ignore write errors; preference will fall back to system next launch.
    });
  }, [isHydrated, preference]);

  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      if (!colorScheme) return;
      setSystemScheme((prev) => {
        const next = normalizeScheme(colorScheme);
        return next === prev ? prev : next;
      });
    });

    return () => {
      if (subscription?.remove) {
        subscription.remove();
      }
    };
  }, []);

  const setThemePreference = useCallback((nextPreference) => {
    setPreference((prev) => {
      const resolved =
        typeof nextPreference === "function"
          ? nextPreference(prev)
          : nextPreference;
      const normalized = normalizePreference(resolved);
      return normalized === prev ? prev : normalized;
    });
  }, []);

  const toggleTheme = useCallback(() => {
    setThemePreference((prev) => {
      if (prev === "system") {
        return systemScheme === "dark" ? "light" : "dark";
      }
      return prev === "dark" ? "light" : "dark";
    });
  }, [setThemePreference, systemScheme]);

  const appliedScheme = preference === "system" ? systemScheme : preference;
  const theme = appliedScheme === "dark" ? darkTheme : lightTheme;
  const dripsyTheme =
    appliedScheme === "dark" ? dripsyDarkTheme : dripsyLightTheme;

  const value = useMemo(
    () => ({
      theme,
      dripsyTheme,
      colorScheme: appliedScheme,
      themePreference: preference,
      isDark: appliedScheme === "dark",
      setTheme: setThemePreference,
      setThemePreference,
      toggleTheme,
    }),
    [
      appliedScheme,
      dripsyTheme,
      preference,
      setThemePreference,
      theme,
      toggleTheme,
    ],
  );

  return (
    <ThemeContext.Provider value={value}>
      <DripsyProvider theme={dripsyTheme}>{children}</DripsyProvider>
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
