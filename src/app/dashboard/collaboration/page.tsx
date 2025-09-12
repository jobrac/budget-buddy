
"use client";

import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db } from "@/lib/firebase/client";
import { useCollection } from "react-firebase-hooks/firestore";
import { collection, query, where } from "firebase/firestore";
import type { Project } from "@/lib/types";
import ProjectList from "../_components/project-list";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const dynamic = 'force-dynamic';

export default function CollaborationPage() {
    const [user, loading, error] = useAuthState(auth);

    const [projectsSnapshot, projectsLoading, projectsError] = useCollection(
        user ? query(
            collection(db, "projects"), 
            where(`roles.${user.uid}`, "in", ["Editor", "Viewer"])
        ) : undefined
    );

    if (loading || projectsLoading) {
        return (
             <div className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
                <h1 className="text-lg font-semibold md:text-2xl font-headline">Shared with me</h1>
                <div>Loading projects...</div>
            </div>
        )
    }

    if (error || projectsError) {
        return <div>Error: {error?.message || projectsError?.message}</div>
    }

    const sharedProjects = projectsSnapshot?.docs.map(doc => ({ id: doc.id, ...doc.data() as Omit<Project, 'id'> })) || [];

    return (
        <div className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
        <div className="flex items-center">
            <h1 className="text-lg font-semibold md:text-2xl font-headline">
            Shared with me
            </h1>
        </div>
        <div className="flex-1">
            {sharedProjects.length > 0 ? (
                <ProjectList projects={sharedProjects} />
            ) : (
                <Card>
                    <CardHeader>
                    <CardTitle>No Projects Shared With You</CardTitle>
                    <CardDescription>
                        This is where you can see projects other users have invited you to.
                    </CardDescription>
                    </CardHeader>
                    <CardContent>
                    <p>When another user shares a project with you, it will appear here.</p>
                    </CardContent>
                </Card>
            )}
        </div>
        </div>
    );
}
