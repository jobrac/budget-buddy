import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { PlaceHolderImages } from '@/lib/placeholder-images';

const heroImage = PlaceHolderImages.find(img => img.id === 'hero');

export default function Hero() {
  return (
    <section className="container grid lg:grid-cols-2 place-items-center py-20 md:py-32 gap-10">
      <div className="text-center lg:text-start space-y-6">
        <main className="text-5xl md:text-6xl font-bold font-headline">
          <h1 className="inline">
            <span className="inline bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
              Budgeting
            </span>{" "}
            made simple
          </h1>{" "}
          for everyone
        </main>

        <p className="text-xl text-muted-foreground md:w-10/12 mx-auto lg:mx-0">
          Track expenses, manage projects, and collaborate with ease. Take control of your finances with BudgetBuddy.
        </p>

        <div className="space-y-4 md:space-y-0 md:space-x-4">
          <Button className="w-full md:w-1/3" asChild>
            <Link href="/dashboard">Get Started</Link>
          </Button>
          <Button variant="outline" className="w-full md:w-1/3" asChild>
            <Link href="#features">Learn More</Link>
          </Button>
        </div>
      </div>

      <div className="z-10">
        {heroImage && (
          <Image
            src={heroImage.imageUrl}
            alt={heroImage.description}
            width={1200}
            height={800}
            className="rounded-lg shadow-2xl"
            data-ai-hint={heroImage.imageHint}
            priority
          />
        )}
      </div>
      
      <div className="hidden lg:block absolute top-[20%] left-1/2 -translate-x-1/2 -translate-y-1/2 size-96 bg-primary/10 rounded-full blur-3xl -z-10" />
    </section>
  );
}
