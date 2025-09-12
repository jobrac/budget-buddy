import Image from 'next/image';
import { Check } from 'lucide-react';
import { PlaceHolderImages } from '@/lib/placeholder-images';

const collabImage = PlaceHolderImages.find(img => img.id === 'collaboration');

export default function CollaborationShowcase() {
  return (
    <section className="container py-24 sm:py-32">
      <div className="grid lg:grid-cols-[1fr,1fr] gap-12 place-items-center">
        <div>
          <h2 className="text-3xl md:text-4xl font-bold font-headline">
            Collaborate on Budgets{" "}
            <span className="bg-gradient-to-b from-primary/60 to-primary text-transparent bg-clip-text">
              Seamlessly
            </span>
          </h2>
          <p className="mt-4 text-muted-foreground text-xl">
            Invite your family, team, or partners to manage finances together. Set roles, track contributions, and stay on the same page.
          </p>
          <div className="mt-8 space-y-6">
            <div className="flex items-start gap-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary flex-shrink-0">
                <Check className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-semibold font-headline">Role-Based Access</h3>
                <p className="text-muted-foreground mt-1">
                  Assign Owner, Editor, or Viewer roles to control who can do what.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary flex-shrink-0">
                <Check className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-semibold font-headline">Real-Time Sync</h3>
                <p className="text-muted-foreground mt-1">
                  All changes are synced instantly across all devices and collaborators.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary flex-shrink-0">
                <Check className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-semibold font-headline">AI-Powered Suggestions</h3>
                <p className="text-muted-foreground mt-1">
                  Get smart suggestions on who to assign which role for optimal project management.
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-8 lg:mt-0">
          {collabImage && (
            <Image
              src={collabImage.imageUrl}
              alt={collabImage.description}
              width={800}
              height={600}
              className="rounded-lg shadow-xl"
              data-ai-hint={collabImage.imageHint}
            />
          )}
        </div>
      </div>
    </section>
  );
}
