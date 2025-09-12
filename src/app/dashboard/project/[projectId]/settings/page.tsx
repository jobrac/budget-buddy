
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase/client";
import { doc, updateDoc, getDoc, writeBatch, collection, getDocs, deleteDoc } from "firebase/firestore";
import type { Project } from "@/lib/types";
import { useParams, useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";


const currencies = ["USD", "EUR", "GBP", "JPY", "INR", "CAD", "AUD"];

// This server action will handle the deletion. It's defined here for collocation,
// but it only runs on the server.
async function deleteProject(projectId: string): Promise<{success: boolean, error?: string}> {
    'use server';
    try {
        const projectRef = doc(db, "projects", projectId);
        const batch = writeBatch(db);

        // Subcollections to delete
        const subcollections = ["transactions", "accounts", "categories", "recurringTransactions"];

        for (const sub of subcollections) {
            const subcollectionRef = collection(db, "projects", projectId, sub);
            const snapshot = await getDocs(subcollectionRef);
            snapshot.docs.forEach(doc => {
                batch.delete(doc.ref);
            });
        }
        
        // Delete the main project document
        batch.delete(projectRef);

        await batch.commit();
        
        return { success: true };
    } catch (error) {
        console.error("Error deleting project:", error);
        return { success: false, error: (error as Error).message || "Failed to delete project." };
    }
}


export default function ProjectSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;
  const { toast } = useToast();

  const [project, setProject] = useState<Project | null>(null);
  const [projectName, setProjectName] = useState("");
  const [projectBudget, setProjectBudget] = useState("");
  const [currency, setCurrency] = useState("");
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!projectId) return;

    const fetchProject = async () => {
      setLoading(true);
      const projectRef = doc(db, "projects", projectId);
      const projectSnap = await getDoc(projectRef);

      if (projectSnap.exists()) {
        const projectData = { id: projectSnap.id, ...projectSnap.data() } as Project;
        setProject(projectData);
        setProjectName(projectData.name);
        setProjectBudget(projectData.budget.toString());
        setCurrency(projectData.currency || "USD");
      } else {
        toast({
          title: "Error",
          description: "Project not found.",
          variant: "destructive",
        });
      }
      setLoading(false);
    };

    fetchProject();
  }, [projectId, toast]);

  const handleSaveChanges = async () => {
    if (!project) return;

    if (!projectName.trim()) {
        toast({ title: "Project name cannot be empty.", variant: "destructive"});
        return;
    }

    const budgetValue = parseFloat(projectBudget);
    if (isNaN(budgetValue) || budgetValue < 0) {
        toast({ title: "Invalid budget amount.", variant: "destructive"});
        return;
    }


    setIsSaving(true);
    try {
      const projectRef = doc(db, "projects", projectId);
      await updateDoc(projectRef, { 
          name: projectName,
          budget: budgetValue,
          currency 
      });
      toast({
        title: "Settings Saved",
        description: "Your project settings have been updated successfully.",
      });
    } catch (error) {
      console.error("Error saving settings:", error);
      toast({
        title: "Error",
        description: "Could not save your settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleDeleteProject = async () => {
      setIsDeleting(true);
      const result = await deleteProject(projectId);
      if (result.success) {
          toast({
              title: "Project Deleted",
              description: `The project "${projectName}" has been permanently deleted.`,
          });
          router.push("/dashboard");
      } else {
          toast({
              title: "Error Deleting Project",
              description: result.error,
              variant: "destructive",
          });
          setIsDeleting(false);
      }
  }


  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-full max-w-sm" />
        </CardHeader>
        <CardContent className="space-y-6">
           <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full max-w-xs" />
           </div>
           <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full max-w-xs" />
           </div>
           <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full max-w-xs" />
           </div>
        </CardContent>
        <CardFooter>
          <Skeleton className="h-10 w-24" />
        </CardFooter>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
        <Card>
            <CardHeader>
                <CardTitle>Project Settings</CardTitle>
                <CardDescription>
                Manage your project name, budget, and reporting currency.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="name">Project Name</Label>
                    <Input 
                        id="name" 
                        value={projectName} 
                        onChange={(e) => setProjectName(e.target.value)} 
                        className="w-full max-w-xs"
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="budget">Monthly Budget</Label>
                    <Input 
                        id="budget"
                        type="number" 
                        value={projectBudget} 
                        onChange={(e) => setProjectBudget(e.target.value)} 
                        className="w-full max-w-xs"
                    />
                </div>
                <div className="space-y-2">
                <Label htmlFor="currency">Project Currency</Label>
                <Select value={currency} onValueChange={setCurrency}>
                    <SelectTrigger id="currency" className="w-full max-w-xs">
                    <SelectValue placeholder="Select a currency" />
                    </SelectTrigger>
                    <SelectContent>
                    {currencies.map((c) => (
                        <SelectItem key={c} value={c}>
                        {c}
                        </SelectItem>
                    ))}
                    </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground max-w-xs">
                    This is the main currency used for budget tracking and aggregated reports.
                </p>
                </div>
            </CardContent>
            <CardFooter>
                <Button onClick={handleSaveChanges} disabled={isSaving}>
                {isSaving ? "Saving..." : "Save Changes"}
                </Button>
            </CardFooter>
        </Card>
        <Card className="border-destructive">
             <CardHeader>
                <CardTitle>Delete Project</CardTitle>
                <CardDescription>
                    Permanently delete this project, including all its accounts, transactions, and settings. This action cannot be undone.
                </CardDescription>
            </CardHeader>
            <CardFooter>
                 <AlertDialog>
                    <AlertDialogTrigger asChild>
                       <Button variant="destructive">Delete Project</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete the project <span className="font-bold">"{projectName}"</span> and all of its associated data, including accounts, transactions, categories, and recurring rules. <span className="font-bold">This action cannot be undone.</span>
                        </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteProject} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90">
                            {isDeleting ? "Deleting..." : "Yes, delete this project"}
                        </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </CardFooter>
        </Card>
    </div>
  );
}
