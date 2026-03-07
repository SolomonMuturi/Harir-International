"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Search, LogOut } from "lucide-react";
import { Input } from "../ui/input";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { useEffect, useRef, useState } from "react";
import { logActivity } from "@/lib/activity-logger";

export function Header() {
  const { data: session } = useSession();
  const router = useRouter();
  const logoutTimerRef = useRef<NodeJS.Timeout | null>(null);
  const INACTIVITY_TIMEOUT = 5 * 60 * 1000; // 5 minutes
  const [showWarning, setShowWarning] = useState(false);

  const getInitials = (name: string = "") => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  const handleLogout = async () => {
    try {
      await logActivity({
        user: session?.user?.email || session?.user?.name || "Unknown",
        action: "INACTIVITY_LOGOUT",
        status: "success",
        metadata: { reason: "Session expired due to inactivity or offline" },
      });
      await signOut({ redirect: false, callbackUrl: "/" });
      toast.success("Logged out successfully");
      router.push("/");
      router.refresh();
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Failed to logout");
    }
  };

  const resetLogoutTimer = () => {
    if (logoutTimerRef.current) {
      clearTimeout(logoutTimerRef.current);
    }
    // Show warning modal 1 minute before logout
    logoutTimerRef.current = setTimeout(() => {
      setShowWarning(true);
      setTimeout(() => {
        toast.warning("Session expired due to inactivity");
        handleLogout();
      }, 60 * 1000);
    }, INACTIVITY_TIMEOUT - 60 * 1000);
  };

  const setupActivityListeners = () => {
    const events = ["mousemove", "keydown", "click", "scroll", "touchstart"];
    const handleUserActivity = () => {
      resetLogoutTimer();
    };
    events.forEach((event) => {
      window.addEventListener(event, handleUserActivity);
    });
    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, handleUserActivity);
      });
    };
  };

  useEffect(() => {
    if (session?.user) {
      resetLogoutTimer();
      const cleanup = setupActivityListeners();
      return () => {
        cleanup();
        if (logoutTimerRef.current) {
          clearTimeout(logoutTimerRef.current);
        }
      };
    }
  }, [session?.user]);

  useEffect(() => {
    const handleOffline = () => {
      toast.warning("You are offline. Logging out for security.");
      handleLogout();
    };
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (logoutTimerRef.current) {
        clearTimeout(logoutTimerRef.current);
      }
    };
  }, []);

  const user = session?.user;
  const userRole = (user as any)?.role || "No Role";
  const userInitials = getInitials(user?.name || user?.email || "U");

  const WarningModal = () =>
    showWarning ? (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
        <div className="bg-black rounded-lg shadow-lg p-6 max-w-sm w-full text-center">
          <h2 className="text-lg font-bold mb-2 text-warning">Session Expiring Soon</h2>
          <p className="mb-4">You will be logged out in 1 minute due to inactivity.</p>
          <button
            className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/80"
            onClick={() => {
              setShowWarning(false);
              resetLogoutTimer();
            }}
          >
            Stay Logged In
          </button>
        </div>
      </div>
    ) : null;

  return (
    <>
      <WarningModal />
      <header className="sticky top-0 z-50 flex h-16 items-center gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 md:px-6">
        <div className="flex items-center gap-3">
          <SidebarTrigger className="md:hidden" />
          <div className="hidden md:block">
            <h1 className="font-headline text-xl font-semibold tracking-tight">Dashboard</h1>
          </div>
        </div>
        <div className="flex flex-1 items-center justify-end gap-3 md:gap-4">
          <div className="relative hidden sm:block">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search..."
              className="pl-9 w-[200px] lg:w-[280px] transition-all focus:w-[240px] lg:focus:w-[320px]"
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className={cn(
                  "h-10 w-10 p-0 rounded-full",
                  "hover:bg-primary/10 hover:scale-105",
                  "transition-all duration-200",
                  "border border-border hover:border-primary/20"
                )}
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/80 text-primary-foreground font-semibold text-sm shadow-sm">
                  {userInitials}
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-56 p-0"
              align="end"
              forceMount
              sideOffset={8}
            >
              <div className="p-4 border-b">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/80 text-primary-foreground font-semibold shadow-sm">
                    {userInitials}
                  </div>
                  <div className="flex flex-col overflow-hidden">
                    <p className="text-sm font-medium truncate">
                      {user?.name || "User"}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {user?.email}
                    </p>
                    <div className="mt-1">
                      <Badge variant="secondary" className="text-xs font-normal px-2 py-0 h-5">
                        {userRole}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
              <DropdownMenuSeparator className="mx-2" />
              <div className="p-2">
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="cursor-pointer rounded-md px-3 py-2 text-sm transition-colors focus:bg-destructive/10 focus:text-destructive text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
    </>
  );
}