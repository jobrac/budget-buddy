import { PiggyBank } from 'lucide-react';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="border-t">
      <div className="container flex flex-col items-center justify-between gap-4 py-10 md:h-24 md:flex-row md:py-0">
        <div className="flex flex-col items-center gap-4 px-8 md:flex-row md:gap-2 md:px-0">
          <Link href="/" className="flex items-center space-x-2">
            <PiggyBank className="h-6 w-6 text-primary" />
            <span className="font-bold sm:inline-block font-headline">
              BudgetBuddy
            </span>
          </Link>
          <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
            © {new Date().getFullYear()} All rights reserved.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Link href="#" className="text-sm text-muted-foreground hover:text-foreground">Privacy Policy</Link>
          <Link href="#" className="text-sm text-muted-foreground hover:text-foreground">Terms of Service</Link>
        </div>
      </div>
    </footer>
  );
}
