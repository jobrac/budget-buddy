
"use client";

import Link from "next/link"
import {
  Home,
  Menu,
  Briefcase,
  PiggyBank,
  Users,
  LineChart,
  Settings,
  ArrowRightLeft
} from "lucide-react"
import { usePathname } from 'next/navigation'

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import Image from "next/image"
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db } from "@/lib/firebase/client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { signOut } from "firebase/auth";
import { collection, query, where } from "firebase/firestore";
import { useCollection } from "react-firebase-hooks/firestore";
import { cn } from "@/lib/utils";
import { FirebaseErrorListener } from "@/components/FirebaseErrorListener";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [user, loading, error] = useAuthState(auth);
  const router = useRouter();
  const pathname = usePathname();

  const [projectsSnapshot, projectsLoading, projectsError] = useCollection(
    user ? query(collection(db, "projects"), where(`roles.${user.uid}`, "in", ["Owner", "Editor", "Viewer"])) : undefined
  );

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/login');
  };

  if (loading || projectsLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  if (projectsError) {
    return <div>Error: {projectsError.message}</div>
  }
  
  if (!user) {
    return null;
  }

  const projects = projectsSnapshot?.docs.map(doc => ({ id: doc.id, ...doc.data() })) || [];

  const navLinks = [
    { href: "/dashboard", label: "Dashboard", icon: Home },
    { href: "/dashboard/transactions", label: "All Transactions", icon: ArrowRightLeft },
    { href: "/dashboard/reports", label: "Global Reports", icon: LineChart },
    { href: "/dashboard/collaboration", label: "Shared with me", icon: Users },
    { href: "/dashboard/settings", label: "Settings", icon: Settings },
  ];

  const isActive = (href: string) => {
     // The main dashboard link is active if the path is /dashboard or starts with /dashboard/project
    if (href === "/dashboard") {
      return pathname === '/dashboard' || pathname.startsWith('/dashboard/project');
    }
    return pathname.startsWith(href);
  }

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      <div className="hidden border-r bg-muted/40 md:block">
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
            <Link href="/" className="flex items-center gap-2 font-semibold">
              <PiggyBank className="h-6 w-6 text-primary" />
              <span className="font-headline">BudgetBuddy</span>
            </Link>
          </div>
          <div className="flex-1">
            <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
              {navLinks.map((link, index) => (
                <Link
                  key={index}
                  href={link.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                    isActive(link.href) && "bg-muted text-primary"
                  )}
                >
                  <link.icon className="h-4 w-4" />
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="mt-auto p-4">
            <Card>
              <CardHeader className="p-2 pt-0 md:p-4">
                <CardTitle className="font-headline">Upgrade to Pro</CardTitle>
                <CardDescription>
                  Unlock all features and get unlimited access to our support
                  team.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-2 pt-0 md:p-4 md:pt-0">
                <Button size="sm" className="w-full">
                  Upgrade
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <div className="flex flex-col">
        <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="shrink-0 md:hidden"
              >
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col">
              <nav className="grid gap-2 text-lg font-medium">
                <Link
                  href="/"
                  className="flex items-center gap-2 text-lg font-semibold mb-4"
                >
                  <PiggyBank className="h-6 w-6 text-primary" />
                  <span className="font-headline">BudgetBuddy</span>
                </Link>
                {navLinks.map((link, index) => (
                  <Link
                    key={index}
                    href={link.href}
                    className={cn(
                      "mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground",
                      isActive(link.href) && "bg-muted text-foreground"
                    )}
                  >
                    <link.icon className="h-5 w-5" />
                    {link.label}
                  </Link>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
          <div className="w-full flex-1">
             {/* Can add a search bar here */}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="icon" className="rounded-full">
                <Image src={user.photoURL || "https://picsum.photos/seed/avatar/40/40"} alt="user avatar" width={40} height={40} className="rounded-full"/>
                <span className="sr-only">Toggle user menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push('/dashboard/settings')}>Settings</DropdownMenuItem>
              <DropdownMenuItem>Support</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>Logout</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>
        <main className="flex flex-1 flex-col">
          <FirebaseErrorListener />
          {children}
        </main>
      </div>
    </div>
  )
}
