import Link from 'next/link';
import { PiggyBank } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center">
        <Link href="/" className="mr-6 flex items-center space-x-2">
          <PiggyBank className="h-6 w-6 text-primary" />
          <span className="font-bold sm:inline-block font-headline">
            BudgetBuddy
          </span>
        </Link>
        <div className="flex flex-1 items-center justify-end space-x-4">
          <nav className="flex items-center space-x-2">
            <Button asChild>
              <Link href="/dashboard">Get Started</Link>
            </Button>
            <Button variant="outline" asChild>
               <Link href="/login">Sign In</Link>
            </Button>
          </nav>
        </div>
      </div>
    </header>
  );
}
