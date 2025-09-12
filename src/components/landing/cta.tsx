import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function CtaSection() {
  return (
    <section id="cta" className="relative py-24 sm:py-32">
      <div className="absolute top-0 -z-10 h-full w-full bg-background bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(100,181,246,0.2),rgba(255,255,255,0))]"></div>
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl font-headline">Ready to take control?</h2>
          <p className="mt-6 text-lg leading-8 text-muted-foreground">
            Start managing your finances effectively. Create your first budget project for free and see the difference.
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <Button asChild size="lg">
              <Link href="/dashboard">Get Started Now</Link>
            </Button>
            <Button asChild variant="ghost" size="lg">
              <Link href="#features">Learn more <span aria-hidden="true" className="ml-1">→</span></Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
