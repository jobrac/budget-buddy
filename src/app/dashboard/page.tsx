
"use client";

import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db } from "@/lib/firebase/client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import ProjectList from "./_components/project-list";
import { CreateProjectDialog } from "./_components/create-project-dialog";
import { collection, query, where } from "firebase/firestore";
import { useCollection } from "react-firebase-hooks/firestore";
import type { Project } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";

export default function DashboardPage() {
  const [user, loading, error] = useAuthState(auth);
  const router = useRouter();

  const [projectsSnapshot, projectsLoading, projectsError] = useCollection(
    user ? query(collection(db, "projects"), where(`roles.${user.uid}`, "in", ["Owner", "Editor", "Viewer"])) : undefined
  );

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);


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
  
  const projects = projectsSnapshot?.docs.map(doc => ({ id: doc.id, ...doc.data() as Omit<Project, 'id'> })) || [];

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold md:text-2xl font-headline">My Projects</h1>
        {projects.length > 0 && <CreateProjectDialog user={user} />}
      </div>
      <div
        className="flex flex-1 items-start justify-center rounded-lg border border-dashed shadow-sm p-4"
      >
        {projects.length > 0 ? (
            <ProjectList projects={projects} />
          ) : (
            <div className="flex flex-col items-center gap-1 text-center m-auto">
              <h3 className="text-2xl font-bold tracking-tight font-headline">
                You have no projects yet
              </h3>
              <p className="text-sm text-muted-foreground">
                You can start tracking your finances by adding a new project.
              </p>
              <CreateProjectDialog user={user} />
            </div>
          )}
      </div>
    </div>
  )
}
