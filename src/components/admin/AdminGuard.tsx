import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const API_BASE = "https://api.sewmrsms.co.tz/api/v1";

interface AdminUser {
  uuid: string;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  role: string;
  is_active: boolean;
  last_login: string | null;
}

interface AdminContextType {
  admin: AdminUser | null;
  loading: boolean;
}

const AdminContext = createContext<AdminContextType>({ admin: null, loading: true });
export const useAdmin = () => useContext(AdminContext);

export const AdminGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  const fetchMe = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/auth/me`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setAdmin(data.data);
      } else {
        toast({ title: "Session expired", description: "Please log in again", variant: "destructive" });
        navigate("/admin/login");
      }
    } catch {
      navigate("/admin/login");
    } finally {
      setLoading(false);
    }
  }, [navigate, toast]);

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <AdminContext.Provider value={{ admin, loading }}>
      {children}
    </AdminContext.Provider>
  );
};
