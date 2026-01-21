import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Printer, LogOut, LayoutDashboard } from "lucide-react";

export function Navbar() {
  const { user, logout } = useAuth();
  const [location] = useLocation();

  const isPublic = !location.startsWith("/admin");

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between px-4 sm:px-8">
        <Link href="/" className="mr-6 flex items-center space-x-2">
          <Printer className="h-6 w-6 text-primary" />
          <span className="hidden font-display font-bold sm:inline-block">PrintShop</span>
        </Link>
        
        <nav className="flex items-center space-x-4">
          {isPublic ? (
             <Link href="/admin/login">
               <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                 Admin Access
               </Button>
             </Link>
          ) : user ? (
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-muted-foreground hidden sm:inline-block">
                {user.username}
              </span>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => logout()}
                title="Logout"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          ) : null}
        </nav>
      </div>
    </header>
  );
}
