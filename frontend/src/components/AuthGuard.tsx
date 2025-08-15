import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

export const AuthGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("https://api.sewmrsms.co.tz/api/v1/auth/me", {
          method: "GET",
          credentials: "include",
        });

        const data = await res.json();

        if (!data.success) {
          toast({
            variant: "destructive",
            title: "Unauthorized",
            description: "Please sign in to continue.",
          });
          navigate("/signin");
        }
      } catch (err) {
        toast({
          variant: "destructive",
          title: "Network error",
          description: "Could not verify session. Please sign in.",
        });
        navigate("/signin");
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [navigate, toast]);

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white z-50">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-600 border-solid"></div>
      </div>
    );
  }

  return <>{children}</>;
};
