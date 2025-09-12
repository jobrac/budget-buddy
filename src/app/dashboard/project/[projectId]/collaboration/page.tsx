
"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useParams } from "next/navigation";
import { useDocument } from "react-firebase-hooks/firestore";
import { doc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import type { Project } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { CollaboratorsList } from "./_components/collaborators-list";
import { InviteUserDialog } from "./_components/invite-user-dialog";
import { AiRoleSuggesterDialog } from "./_components/ai-role-suggester-dialog";

export default function CollaborationPage() {
  const params = useParams();
  const projectId = params.projectId as string;

  const [projectSnapshot, projectLoading, projectError] = useDocument(
    doc(db, "projects", projectId)
  );

  if (projectLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-full max-w-lg" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-12 w-full" />
        </CardContent>
      </Card>
    )
  }

  if (projectError || !projectSnapshot?.exists()) {
    return <div>Error: {projectError?.message || 'Project not found.'}</div>;
  }

  const project = { id: projectSnapshot.id, ...projectSnapshot.data() } as Project;
  const projectType = project.name; // Using project name as a proxy for type

  return (
    <>
      <div className="flex items-center justify-between -mt-2">
        <h2 className="text-lg font-semibold md:text-xl font-headline">
          Collaboration
        </h2>
        <div className="flex items-center gap-2">
            <AiRoleSuggesterDialog projectType={projectType} />
            <InviteUserDialog projectId={projectId} />
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Manage Access</CardTitle>
          <CardDescription>
            Invite users and manage their roles for this project. Not sure what roles to assign? Use the AI Suggester.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CollaboratorsList project={project} />
        </CardContent>
      </Card>
    </>
  );
}
