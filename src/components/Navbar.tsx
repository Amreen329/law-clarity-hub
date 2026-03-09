import { Link, useLocation } from "react-router-dom";
import { Scale, Menu, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const isHome = location.pathname === "/";

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

        <div className="hidden items-center gap-6 md:flex">
          {isHome && (
            <>
              <a href="#features" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">Features</a>
              <a href="#how-it-works" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">How It Works</a>
            </>
          )}
          <Link to="/dashboard">
            <Button size="sm" className="bg-primary text-primary-foreground hover:bg-civic-navy-light">
              Open Dashboard
            </Button>
          </Link>
        </div>

        <button className="md:hidden" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
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
            <Link to="/dashboard" onClick={() => setIsOpen(false)}>
              <Button size="sm" className="w-full bg-primary text-primary-foreground">Open Dashboard</Button>
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
