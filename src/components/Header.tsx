import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  User,
  Rocket,
  X,
  Plus,
  Menu,
  ChevronRight,
} from "lucide-react";
import logo from "@/assets/logo.png";

const navItems = [
  { label: "Home", href: "/" },
  { label: "Features", href: "/features" },
  { label: "Pricing", href: "/pricing" },
  { label: "Developers", href: "/developers" },
  { label: "Contact", href: "/contact" },
];

export const Header = () => {
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [fabOpen, setFabOpen] = useState(false);
  const fabRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (fabRef.current && !fabRef.current.contains(event.target as Node)) {
        setFabOpen(false);
      }
    };
    if (fabOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [fabOpen]);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  return (
    <>
      {/* Desktop Header */}
      <header
        className={`hidden lg:block fixed top-0 w-full z-50 transition-all duration-500 ${
          scrolled
            ? "bg-background/80 backdrop-blur-2xl border-b border-border/40 shadow-[0_1px_3px_0_hsl(var(--foreground)/0.04)]"
            : "bg-transparent"
        }`}
      >
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2.5 group">
              <img
                src={logo}
                alt="SEWMR SMS"
                className="h-8 w-auto transition-transform duration-300 group-hover:scale-105"
              />
            </Link>

            {/* Center Nav — pill-shaped container */}
            <nav className="flex items-center bg-muted/50 backdrop-blur-sm rounded-full px-1.5 py-1 border border-border/30">
              {navItems.map((item) => {
                const active = location.pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={`relative px-4 py-1.5 text-[13px] font-medium rounded-full transition-all duration-300 ${
                      active
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            {/* Right CTAs */}
            <div className="flex items-center gap-3">
              <Link
                to="/signin"
                className="text-[13px] font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5"
              >
                Sign In
              </Link>
              <Link
                to="/signup"
                className="group inline-flex items-center gap-1.5 px-5 py-2 bg-foreground text-background rounded-full text-[13px] font-semibold hover:bg-foreground/90 transition-all duration-300 shadow-[0_1px_3px_0_hsl(var(--foreground)/0.2)]"
              >
                Get Started
                <ChevronRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Header Bar */}
      <header
        className={`lg:hidden fixed top-0 w-full z-50 transition-all duration-500 ${
          scrolled || mobileOpen
            ? "bg-background/80 backdrop-blur-2xl border-b border-border/40"
            : "bg-transparent"
        }`}
      >
        <div className="flex items-center justify-between px-4 h-14">
          <Link to="/" className="flex items-center gap-2">
            <img src={logo} alt="SEWMR SMS" className="h-7 w-auto" />
          </Link>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 rounded-xl text-foreground hover:bg-muted/60 transition-colors"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile Dropdown */}
        <div
          className={`overflow-hidden transition-all duration-300 ease-out ${
            mobileOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <nav className="px-4 pb-4 space-y-1">
            {navItems.map((item) => {
              const active = location.pathname === item.href;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={`block px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
            <div className="pt-3 flex flex-col gap-2">
              <Link
                to="/signin"
                className="block text-center px-4 py-2.5 rounded-xl text-sm font-medium border border-border/60 text-foreground hover:bg-muted/60 transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/signup"
                className="block text-center px-4 py-2.5 rounded-xl text-sm font-semibold bg-foreground text-background hover:bg-foreground/90 transition-colors"
              >
                Get Started
              </Link>
            </div>
          </nav>
        </div>
      </header>

      {/* Mobile FAB (for auth quick-access when scrolling) */}
      <div
        ref={fabRef}
        className="lg:hidden fixed bottom-6 right-5 z-50 flex flex-col items-end gap-2"
      >
        {fabOpen && (
          <div className="flex flex-col gap-2 animate-in slide-in-from-bottom-2 duration-200">
            <Link
              to="/signin"
              className="flex items-center gap-2 px-4 py-2.5 bg-background border border-border/60 text-foreground rounded-full shadow-lg text-sm font-medium hover:bg-muted/60 transition-colors"
              onClick={() => setFabOpen(false)}
            >
              <User className="h-4 w-4" />
              <span>Sign In</span>
            </Link>
            <Link
              to="/signup"
              className="flex items-center gap-2 px-4 py-2.5 bg-foreground text-background rounded-full shadow-lg text-sm font-semibold hover:bg-foreground/90 transition-colors"
              onClick={() => setFabOpen(false)}
            >
              <Rocket className="h-4 w-4" />
              <span>Get Started</span>
            </Link>
          </div>
        )}
        <button
          onClick={() => setFabOpen((o) => !o)}
          className="bg-foreground text-background rounded-full p-3.5 shadow-xl hover:bg-foreground/90 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          aria-label="Toggle actions"
        >
          {fabOpen ? <X className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
        </button>
      </div>
    </>
  );
};
