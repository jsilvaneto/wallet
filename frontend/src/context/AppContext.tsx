import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { ProfileType, SyncStatus } from "../types";
import { api } from "../api/client";

interface AppContextType {
  profile: ProfileType;
  setProfile: (p: ProfileType) => void;
  isDark: boolean;
  toggleTheme: () => void;
  hideValues: boolean;
  toggleHideValues: () => void;
  loginTheme: "dark" | "light";
  setLoginTheme: (theme: "dark" | "light") => void;
  token: string | null;
  setToken: (t: string | null) => void;
  syncStatus: SyncStatus | null;
  refreshSyncStatus: (checkRemote?: boolean) => Promise<void>;
  isSyncing: boolean;
  triggerSync: (action?: "full" | "export" | "import") => Promise<{ success: boolean; message: string }>;
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
  const [loginTheme, setLoginThemeState] = useState<"dark" | "light">(
    (localStorage.getItem("wallet_login_theme") as "dark" | "light") || "dark"
  );
  const [hideValues, setHideValues] = useState<boolean>(
    localStorage.getItem("wallet_hide_values") === "true"
  );
  const [token, setTokenState] = useState<string | null>(getValidToken());
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  const refreshSyncStatus = useCallback(async (checkRemote: boolean = true) => {
    if (!token) return;
    try {
      const res = await api.get<SyncStatus>("/sync/status", {
        params: { check_remote: checkRemote },
      });
      setSyncStatus(res.data);
    } catch (err) {
      console.error("Erro ao obter status de sincronização:", err);
    }
  }, [token]);

  const triggerSync = useCallback(async (action: "full" | "export" | "import" = "full") => {
    setIsSyncing(true);
    try {
      const endpoint = action === "export" ? "/sync/export" : action === "import" ? "/sync/import" : "/sync/full";
      const res = await api.post(endpoint);
      await refreshSyncStatus(true);
      return {
        success: true,
        message: res.data.message || "Sincronização concluída com sucesso!",
      };
    } catch (err: any) {
      const msg = err.response?.data?.detail || "Erro ao executar sincronização.";
      await refreshSyncStatus(false);
      return { success: false, message: msg };
    } finally {
      setIsSyncing(false);
    }
  }, [refreshSyncStatus]);

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
    localStorage.setItem("wallet_login_theme", loginTheme);
  }, [loginTheme]);

  useEffect(() => {
    localStorage.setItem("wallet_hide_values", hideValues ? "true" : "false");
  }, [hideValues]);

  // Polling periódico do status de sincronização
  useEffect(() => {
    if (!token) {
      setSyncStatus(null);
      return;
    }

    refreshSyncStatus(true);
    const interval = setInterval(() => {
      refreshSyncStatus(true);
    }, 30000);

    const onFocus = () => {
      refreshSyncStatus(true);
    };
    window.addEventListener("focus", onFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, [token, refreshSyncStatus]);

  const setLoginTheme = (theme: "dark" | "light") => {
    setLoginThemeState(theme);
    localStorage.setItem("wallet_login_theme", theme);
  };

  const setToken = (t: string | null) => {
    if (t && t !== "undefined" && t !== "null" && t !== "") {
      localStorage.setItem("wallet_token", t);
      setTokenState(t);
    } else {
      localStorage.removeItem("wallet_token");
      setTokenState(null);
      setSyncStatus(null);
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
        loginTheme,
        setLoginTheme,
        token,
        setToken,
        syncStatus,
        refreshSyncStatus,
        isSyncing,
        triggerSync,
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
