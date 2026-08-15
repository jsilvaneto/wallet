import React, { createContext, useContext, useState, useEffect } from "react";
import { ProfileType } from "../types";

interface AppContextType {
  profile: ProfileType;
  setProfile: (p: ProfileType) => void;
  isDark: boolean;
  toggleTheme: () => void;
  hideValues: boolean;
  toggleHideValues: () => void;
  token: string | null;
  setToken: (t: string | null) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const getValidToken = () => {
    const t = localStorage.getItem("wallet_token");
    if (!t || t === "undefined" || t === "null" || t === "") return null;
    return t;
  };

  const [profile, setProfile] = useState<ProfileType>(
    (localStorage.getItem("wallet_profile") as ProfileType) || "PESSOAL"
  );
  const [isDark, setIsDark] = useState<boolean>(
    localStorage.getItem("wallet_theme") === "dark"
  );
  const [hideValues, setHideValues] = useState<boolean>(
    localStorage.getItem("wallet_hide_values") === "true"
  );
  const [token, setTokenState] = useState<string | null>(getValidToken());

  useEffect(() => {
    const handleStorageChange = () => {
      setTokenState(getValidToken());
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  useEffect(() => {
    localStorage.setItem("wallet_profile", profile);
  }, [profile]);

  useEffect(() => {
    localStorage.setItem("wallet_theme", isDark ? "dark" : "light");
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDark]);

  useEffect(() => {
    localStorage.setItem("wallet_hide_values", hideValues ? "true" : "false");
  }, [hideValues]);

  const setToken = (t: string | null) => {
    if (t && t !== "undefined" && t !== "null" && t !== "") {
      localStorage.setItem("wallet_token", t);
      setTokenState(t);
    } else {
      localStorage.removeItem("wallet_token");
      setTokenState(null);
    }
  };

  const toggleTheme = () => setIsDark((prev) => !prev);
  const toggleHideValues = () => setHideValues((prev) => !prev);

  return (
    <AppContext.Provider
      value={{
        profile,
        setProfile,
        isDark,
        toggleTheme,
        hideValues,
        toggleHideValues,
        token,
        setToken,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp deve ser utilizado dentro de AppProvider");
  return context;
};
