import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { Link } from "react-router-dom";

export const CookieConsent = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookie-consent');
    if (!consent) {
      setTimeout(() => {
        setIsVisible(true);
        requestAnimationFrame(() => setIsAnimating(true));
      }, 2000);
    }
  }, []);

  const dismiss = (type: 'accepted' | 'declined') => {
    setIsAnimating(false);
    setTimeout(() => {
      localStorage.setItem('cookie-consent', type);
      setIsVisible(false);
    }, 300);
  };

  if (!isVisible) return null;

  return (
    <div className={`fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 sm:max-w-sm z-50 transition-all duration-300 ease-out ${isAnimating ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
      <div className="relative bg-card/95 backdrop-blur-xl border border-border/60 rounded-2xl shadow-xl p-5">
        {/* Close button */}
        <button
          onClick={() => dismiss('declined')}
          className="absolute top-3 right-3 p-1 rounded-lg text-muted-foreground/60 hover:text-foreground hover:bg-muted/60 transition-colors"
        >
          <X className="h-3.5 w-3.5" />
        </button>

        <div className="space-y-3 pr-6">
          <h3 className="text-sm font-semibold text-foreground tracking-tight">
            Cookie Preferences
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            We use cookies to improve your experience and analyze traffic. You can manage your preferences anytime.
          </p>
          <div className="flex items-center gap-3 text-[11px]">
            <Link 
              to="/cookie-policy" 
              className="text-muted-foreground hover:text-primary underline underline-offset-2 transition-colors"
            >
              Cookie Policy
            </Link>
            <span className="text-border">·</span>
            <Link 
              to="/privacy-policy" 
              className="text-muted-foreground hover:text-primary underline underline-offset-2 transition-colors"
            >
              Privacy Policy
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-4">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => dismiss('declined')}
            className="flex-1 h-9 text-xs font-medium rounded-xl border-border/60 hover:bg-muted/60"
          >
            Decline
          </Button>
          <Button 
            size="sm" 
            onClick={() => dismiss('accepted')}
            className="flex-1 h-9 text-xs font-medium rounded-xl shadow-sm"
          >
            Accept All
          </Button>
        </div>
      </div>
    </div>
  );
};