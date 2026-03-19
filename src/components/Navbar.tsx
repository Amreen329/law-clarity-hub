import { Link, useLocation } from "react-router-dom";
import { Scale, Menu, X, Library, LayoutDashboard, BookOpen, Home } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import ThemeToggle from "@/components/ThemeToggle";
import UserMenu from "@/components/UserMenu";
import { useAuth } from "@/hooks/use-auth";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const isHome = location.pathname === "/";
  const { user } = useAuth();

  const navLinkClass = (path: string) =>
    `flex items-center gap-1.5 text-sm font-medium transition-colors ${
      location.pathname === path
        ? "text-foreground"
        : "text-muted-foreground hover:text-foreground"
    }`;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-card/80 backdrop-blur-lg">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <Scale className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-display text-lg font-bold text-foreground">
            LegisAI
          </span>
        </Link>

        <div className="hidden items-center gap-4 md:flex">
          {isHome && (
            <>
              <a href="#features" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">Features</a>
              <a href="#how-it-works" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">How It Works</a>
            </>
          )}
          {!isHome && user && (
            <Link to="/" className={navLinkClass("/")}>
              <Home className="h-3.5 w-3.5" /> Home
            </Link>
          )}
          {user && (
            <>
              <Link to="/bills" className={navLinkClass("/bills")}>
                <Library className="h-3.5 w-3.5" /> Bills
              </Link>
              <Link to="/dashboard" className={navLinkClass("/dashboard")}>
                <LayoutDashboard className="h-3.5 w-3.5" /> Dashboard
              </Link>
            </>
          )}
          <ThemeToggle />
          {user ? (
            <UserMenu />
          ) : (
            <Link to="/auth">
              <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
                Sign In
              </Button>
            </Link>
          )}
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <button onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="border-t border-border bg-card px-4 py-4 md:hidden">
          <div className="flex flex-col gap-3">
            {isHome && (
              <>
                <a href="#features" className="text-sm font-medium text-muted-foreground" onClick={() => setIsOpen(false)}>Features</a>
                <a href="#how-it-works" className="text-sm font-medium text-muted-foreground" onClick={() => setIsOpen(false)}>How It Works</a>
              </>
            )}
            {user ? (
              <>
                {!isHome && (
                  <Link to="/" onClick={() => setIsOpen(false)}>
                    <Button size="sm" variant="ghost" className="w-full gap-2 justify-start">
                      <Home className="h-3.5 w-3.5" /> Home
                    </Button>
                  </Link>
                )}
                <Link to="/bills" onClick={() => setIsOpen(false)}>
                  <Button size="sm" variant="outline" className="w-full gap-2">
                    <Library className="h-3.5 w-3.5" /> Bill Directory
                  </Button>
                </Link>
                <Link to="/dashboard" onClick={() => setIsOpen(false)}>
                  <Button size="sm" className="w-full gap-2 bg-primary text-primary-foreground">
                    <LayoutDashboard className="h-3.5 w-3.5" /> Dashboard
                  </Button>
                </Link>
                <UserMenu />
              </>
            ) : (
              <Link to="/auth" onClick={() => setIsOpen(false)}>
                <Button size="sm" className="w-full bg-primary text-primary-foreground">Sign In</Button>
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
