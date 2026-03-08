import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X, Cookie } from "lucide-react";
import { Link } from "react-router-dom";

export const CookieConsent = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookie-consent');
    if (!consent) {
      setTimeout(() => setIsVisible(true), 2000); // Show after 2 seconds
    }
  }, []);

  const acceptCookies = () => {
    localStorage.setItem('cookie-consent', 'accepted');
    setIsVisible(false);
  };

  const declineCookies = () => {
    localStorage.setItem('cookie-consent', 'declined');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border shadow-2xl z-50 animate-slide-in-right">
      <div className="container mx-auto p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start space-x-3 flex-1">
            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
              <Cookie className="h-4 w-4 text-primary" />
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-foreground">
                We use cookies
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                We use cookies to enhance your browsing experience, analyze site traffic, 
                and provide personalized content. By clicking "Accept", you consent to our use of cookies.
              </p>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <Link 
                  to="/cookie-policy" 
                  className="text-primary hover:text-primary-hover underline"
                >
                  Cookie Policy
                </Link>
                <span className="text-muted-foreground">•</span>
                <Link 
                  to="/privacy-policy" 
                  className="text-primary hover:text-primary-hover underline"
                >
                  Privacy Policy
                </Link>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 flex-shrink-0">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={declineCookies}
              className="text-xs"
            >
              Decline
            </Button>
            <Button 
              variant="default" 
              size="sm" 
              onClick={acceptCookies}
              className="text-xs"
            >
              Accept
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={declineCookies}
              className="p-1 h-6 w-6"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};