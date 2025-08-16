// src/components/AuthGuard.tsx
import React, { useEffect, useState, createContext, useContext, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

interface User {
  id: number;
  uuid: string;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  phone: string;
  remaining_sms?: number;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  setUser?: (u: User | null) => void;
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true });

export const useAuth = () => useContext(AuthContext);

export const AuthGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  // Keep a ref to the interval id so we can clear it on unmount
  const intervalRef = useRef<number | null>(null);
  // Prevent concurrent polling fetches
  const isPollingRef = useRef(false);

  useEffect(() => {
    let mounted = true;

    const fetchMe = async (opts?: { showToastOnUnauthorized?: boolean }) => {
      try {
        const res = await fetch("https://api.sewmrsms.co.tz/api/v1/auth/me", {
          method: "GET",
          credentials: "include",
        });
        // If 401/403 happen they may still return JSON; handle generically
        const data = await res.json().catch(() => ({ success: false }));

        if (!mounted) return;

        if (!data.success) {
          if (opts?.showToastOnUnauthorized) {
            toast({
              variant: "destructive",
              title: "Unauthorized",
              description: "Please sign in to continue.",
            });
          }
          // Clear user state and redirect to signin
          setUser(null);
          navigate("/signin");
          return null;
        }

        // Set user (may include remaining_sms)
        setUser(data.data as User);
        return data.data as User;
      } catch (err) {
        if (opts?.showToastOnUnauthorized) {
          toast({
            variant: "destructive",
            title: "Network error",
            description: "Could not verify session. Please sign in.",
          });
          navigate("/signin");
        }
        setUser(null);
        return null;
      }
    };

    const start = async () => {
      // Initial fetch -> show toast/redirect if unauthorized
      await fetchMe({ showToastOnUnauthorized: true });
      if (!mounted) return;

      setLoading(false);

      // start polling only if not already started
      if (intervalRef.current == null) {
        // poll every 10 seconds
        intervalRef.current = window.setInterval(async () => {
          if (isPollingRef.current) return; // prevent overlap
          isPollingRef.current = true;
          try {
            await fetchMe();
          } finally {
            isPollingRef.current = false;
          }
        }, 10000);
      }
    };

    start();

    return () => {
      mounted = false;
      // cleanup interval
      if (intervalRef.current != null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate, toast]);

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white z-50">
        <div
          className="animate-spin rounded-full h-16 w-16 border-t-4 border-solid border-gray-200"
          style={{ borderTopColor: "hsl(6, 99%, 64%)" }}
        ></div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, loading, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};
