import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Home,
  Activity,
  DollarSign,
  Code,
  Mail as MailIcon,
  User,
  Rocket,
  X,
  Plus,
} from "lucide-react";
import logo from "@/assets/logo.png";

const navItems = [
  { label: "Home", href: "/", icon: Home },
  { label: "Features", href: "/features", icon: Activity },
  { label: "Pricing", href: "/pricing", icon: DollarSign },
  { label: "Developers", href: "/developers", icon: Code },
  { label: "Contact", href: "/contact", icon: MailIcon },
];

export const Header = () => {
  const location = useLocation();
  const [scrollPos, setScrollPos] = useState(0);
  const [fabOpen, setFabOpen] = useState(false);
  const fabRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
      const percent = (scrollTop / (scrollHeight - clientHeight)) * 100;
      setScrollPos(Math.min(Math.max(percent, 0), 100));
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Click-away listener to close FAB popup
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        fabRef.current &&
        !fabRef.current.contains(event.target as Node)
      ) {
        setFabOpen(false);
      }
    };

    if (fabOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [fabOpen]);

  return (
    <>
      {/* Scroll Progress Bar */}
      <div
        className="fixed top-0 left-0 h-1 bg-primary z-50"
        style={{ width: `${scrollPos}%` }}
      />

      {/* Desktop Header */}
      <header className="hidden lg:flex fixed top-0 w-full bg-background/90 backdrop-blur-sm border-b border-border z-40">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <img src={logo} alt="SEWMR SMS" className="h-8 w-auto" />
          </Link>

          {/* Centered Nav */}
          <nav className="flex space-x-8">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = location.pathname === item.href;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={`flex items-center space-x-1 pb-1 transition-colors duration-200 ${
                    active
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-sm font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right-side CTAs */}
          <div className="space-x-4">
            <Link
              to="/signin"
              className="text-sm font-medium text-muted-foreground hover:text-primary"
            >
              Sign In
            </Link>
            <Link
              to="/signup"
              className="px-4 py-2 bg-primary text-background rounded-full text-sm font-semibold hover:bg-primary-hover transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-background/90 backdrop-blur-sm border-t border-border z-40">
        <div className="flex justify-around py-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = location.pathname === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
                className={`flex flex-col items-center text-xs transition-colors duration-200 ${
                  active
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="h-6 w-6 mb-1" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Floating Action Button with click-away */}
      <div
        ref={fabRef}
        className="lg:hidden fixed bottom-16 right-5 z-50 flex flex-col items-end space-y-2"
      >
        {/* Expanded Buttons */}
        {fabOpen && (
          <>
            <Link
              to="/signin"
              className="flex items-center space-x-2 px-4 py-2 bg-background border border-primary text-primary rounded-full shadow-md text-sm font-semibold hover:bg-primary hover:text-background transition-colors"
              onClick={() => setFabOpen(false)}
            >
              <User className="h-5 w-5" />
              <span>Sign In</span>
            </Link>
            <Link
              to="/signup"
              className="flex items-center space-x-2 px-4 py-2 bg-primary text-background rounded-full shadow-md text-sm font-semibold hover:bg-primary-hover transition-colors"
              onClick={() => setFabOpen(false)}
            >
              <Rocket className="h-5 w-5" />
              <span>Get Started</span>
            </Link>
          </>
        )}

        {/* FAB Toggle Button */}
        <button
          onClick={() => setFabOpen((open) => !open)}
          className="bg-primary hover:bg-primary-hover text-background rounded-full p-4 shadow-lg focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-colors"
          aria-label="Toggle actions"
        >
          {fabOpen ? <X size={24} /> : <Plus size={24} />}
        </button>
      </div>
    </>
  );
};
