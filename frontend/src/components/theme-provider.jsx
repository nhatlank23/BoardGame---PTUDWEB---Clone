import * as React from "react";

const THEME_KEY = "theme";

const ThemeContext = React.createContext({
  theme: "system",
  resolvedTheme: "light",
  setTheme: () => {},
});

export function ThemeProvider({ children, defaultTheme = "system" }) {
  const [theme, setThemeState] = React.useState(defaultTheme);
  const [resolvedTheme, setResolvedTheme] = React.useState("light");

  React.useEffect(() => {
    try {
      const stored = localStorage.getItem(THEME_KEY);
      if (stored) setThemeState(stored);
      else setThemeState(defaultTheme);
    } catch (e) {
      setThemeState(defaultTheme);
    }
  }, [defaultTheme]);

  const apply = React.useCallback((t) => {
    const isSystem = t === "system";
    const prefersDark =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches;

    const effective = isSystem ? (prefersDark ? "dark" : "light") : t;
    setResolvedTheme(effective);

    if (typeof document !== "undefined") {
      if (effective === "dark") document.documentElement.classList.add("dark");
      else document.documentElement.classList.remove("dark");
    }
  }, []);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    apply(theme);

    const mql =
      window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      if (theme === "system") apply("system");
    };

    if (mql && mql.addEventListener) {
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    }

    if (mql && mql.addListener) {
      mql.addListener(onChange);
      return () => mql.removeListener(onChange);
    }
  }, [theme, apply]);

  const setTheme = React.useCallback((t) => {
    try {
      localStorage.setItem(THEME_KEY, t);
    } catch (e) {
      // ignore
    }
    setThemeState(t);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return React.useContext(ThemeContext);
}
