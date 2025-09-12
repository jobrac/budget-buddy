'use client';

import Link from 'next/link';
import { usePathname, useParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Receipt, Users, LineChart, ArrowLeft, Wallet, Tags, Settings, Repeat } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { doc } from 'firebase/firestore';
import { useDocument } from 'react-firebase-hooks/firestore';
import { db } from '@/lib/firebase/client';
import type { Project } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

export default function ProjectLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const params = useParams();
  const projectId = params.projectId as string;

  const [projectSnapshot, projectLoading, projectError] = useDocument(
    doc(db, 'projects', projectId)
  );

  const project = { id: projectSnapshot?.id, ...projectSnapshot?.data() } as Project;


  const projectNavLinks = [
    {
      href: `/dashboard/project/${projectId}`,
      label: 'Transactions',
      icon: Receipt,
    },
    {
      href: `/dashboard/project/${projectId}/accounts`,
      label: 'Accounts',
      icon: Wallet,
    },
    {
      href: `/dashboard/project/${projectId}/categories`,
      label: 'Categories',
      icon: Tags,
    },
     {
      href: `/dashboard/project/${projectId}/recurring`,
      label: 'Recurring',
      icon: Repeat,
    },
     {
      href: `/dashboard/project/${projectId}/reports`,
      label: 'Reports',
      icon: LineChart,
    },
    {
      href: `/dashboard/project/${projectId}/collaboration`,
      label: 'Collaboration',
      icon: Users,
    },
    {
      href: `/dashboard/project/${projectId}/settings`,
      label: 'Settings',
      icon: Settings,
    },
  ];

  const isActive = (href: string) => {
    // Exact match for transactions page
    if (href.endsWith('/transactions') || href === `/dashboard/project/${projectId}`) {
       return pathname === `/dashboard/project/${projectId}` || pathname === `/dashboard/project/${projectId}/transactions`;
    }
    return pathname.startsWith(href);
  };
  
  const getProjectName = () => {
    if (projectLoading) return <Skeleton className="h-6 w-48" />;
    if (projectError) return "Error";
    if (!project) return "Project not found";
    return project.name;
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
       <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/dashboard">
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Back to Projects</span>
          </Link>
        </Button>
        <h1 className="font-semibold text-lg md:text-2xl font-headline">
            {getProjectName()}
        </h1>
      </div>
      <div className="grid md:grid-cols-[180px_1fr] lg:grid-cols-[220px_1fr] gap-6">
        <div className="flex flex-col gap-2">
            <nav className="grid gap-1 text-sm text-muted-foreground">
            {projectNavLinks.map((link) => (
                <Link
                key={link.href}
                href={link.href}
                className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary',
                    isActive(link.href) && 'bg-muted text-primary'
                )}
                >
                <link.icon className="h-4 w-4" />
                {link.label}
                </Link>
            ))}
            </nav>
        </div>
        <div className="flex flex-col gap-6">
            {children}
        </div>
       </div>
    </div>
  );
}
