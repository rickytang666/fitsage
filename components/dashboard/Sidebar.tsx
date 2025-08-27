"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  IconHome,
  IconBarbellFilled,
  IconBook2,
  IconLogout2,
  IconLayoutSidebarRightExpandFilled,
} from "@tabler/icons-react";
import { ModeToggle } from "@/components/ModeToggle";

// Navigation items definition
const navigationItems = [
  { name: "Home", href: "/profile", color: "#0070f3" },
  { name: "Workouts", href: "/workouts", color: "#34c759" },
  { name: "Diary", href: "/diary", color: "#5e5ce6" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Check if a link is active
  const isActiveLink = (href: string) => {
    const isActive =
      pathname === href || (href !== "/profile" && pathname.startsWith(href));
    console.log(`Link ${href}: pathname=${pathname}, isActive=${isActive}`);
    return isActive;
  };

  // Close mobile menu when a link is clicked
  const handleLinkClick = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      {/* Mobile Top Navbar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-15 bg-sidebar border-b-3 border-border shadow-lg z-50 px-5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Image
            src="/logo.svg"
            alt="FitSage Logo"
            className="h-8 w-8"
            height={32}
            width={32}
          />
          <span className="text-xl font-bold text-primary tracking-wide">
            FitSage
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="p-2 hover:bg-sidebar-accent rounded-lg transition-colors"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <IconLayoutSidebarRightExpandFilled width={36} height={36} />
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-50 flex items-start justify-end"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <div
            className="w-70 bg-background h-full shadow-2xl flex flex-col p-5 animate-[slideIn_0.3s_ease-out]"
            onClick={(e) => e.stopPropagation()}
          >
            <nav className="mb-5 flex-1 space-y-5">
              {navigationItems.map((item) => {
                const active = isActiveLink(item.href);
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={handleLinkClick}
                    className={`flex items-center gap-3 p-3 rounded-3xl text-foreground font-semibold no-underline border-none cursor-pointer outline-none transition-all duration-200 ${
                      active
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-primary hover:text-primary-foreground"
                    }`}
                  >
                    <span>
                      {item.name === "Home" ? (
                        <IconHome />
                      ) : item.name === "Workouts" ? (
                        <IconBarbellFilled />
                      ) : item.name === "Diary" ? (
                        <IconBook2 />
                      ) : (
                        ""
                      )}
                    </span>
                    <span className="text-base">{item.name}</span>
                  </Link>
                );
              })}
            </nav>
            <div className="border-t border-border pt-4">
              <div className="flex justify-center mb-4">
                <ModeToggle />
              </div>
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  signOut();
                }}
                className="w-full p-3 bg-red-500 text-white border-none rounded-xl cursor-pointer text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-200 shadow-md hover:bg-red-700 hover:shadow-lg"
              >
                <IconLogout2 />
                <span>Sign Out</span>
              </button>
              {user && (
                <p className="mt-3 text-xs text-foreground text-center font-medium">
                  {user.email}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <div className="hidden lg:flex w-[230px] p-5 bg-sidebar h-full shadow-lg flex-col border-r-3 border-border">
        <div className="flex items-center gap-3 mb-8 pb-4 border-b border-border">
          <Image
            src="/logo.svg"
            alt="FitSage Logo"
            className="h-9 w-9"
            height={36}
            width={36}
          />
          <span className="text-2xl font-bold text-primary tracking-wide">
            FitSage
          </span>
        </div>

        {/* Navigation Links */}
        <nav className="mb-5 flex-1">
          {navigationItems.map((item) => {
            const active = isActiveLink(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 p-3 mb-2 text-foreground rounded-full no-underline font-semibold cursor-pointer transition-all duration-200 ${
                  active
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-primary hover:text-primary-foreground"
                }`}
              >
                <span>
                  {item.name === "Home" ? (
                    <IconHome />
                  ) : item.name === "Workouts" ? (
                    <IconBarbellFilled />
                  ) : item.name === "Diary" ? (
                    <IconBook2 />
                  ) : (
                    ""
                  )}
                </span>
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Logout Button */}
        <div className="mb-5 border-t border-border pt-4">
          <div className="flex justify-center mb-4">
            <ModeToggle />
          </div>
          <button
            onClick={() => {
              signOut();
            }}
            className="w-full p-1.5 bg-red-500 text-white border-none rounded-full cursor-pointer text-xs font-semibold flex items-center justify-center gap-2 transition-all duration-200 shadow-md hover:bg-red-700 hover:shadow-lg"
          >
            <IconLogout2 />
            <span>Sign Out</span>
          </button>
          {user && (
            <p className="mt-3 text-xs text-foreground text-center font-medium mb-10">
              {user.email}
            </p>
          )}
        </div>
      </div>
    </>
  );
}
