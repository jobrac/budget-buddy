
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase/client";
import { addDoc, collection, serverTimestamp, writeBatch, doc } from "firebase/firestore";
import type { User } from "firebase/auth";


const defaultCategories = [
    "Food", "Transport", "Bills", "Salary", "Freelance", 
    "Entertainment", "Shopping", "Health", "Other", "Groceries", "Utilities"
];


export function CreateProjectDialog({ user }: { user: User }) {
  const [open, setOpen] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [projectBudget, setProjectBudget] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();

  const handleCreateProject = async () => {
    if (!projectName.trim() || !projectBudget.trim()) {
      toast({
        title: "Project name and budget are required",
        variant: "destructive",
      });
      return;
    }

    const budget = parseFloat(projectBudget);
    if (isNaN(budget) || budget <= 0) {
        toast({
            title: "Invalid budget",
            description: "Please enter a valid positive number for the budget.",
            variant: "destructive",
        });
        return;
    }


    setIsCreating(true);
    try {
      // Use a batch to perform multiple writes atomically
      const batch = writeBatch(db);

      // 1. Create the project document
      const projectDocRef = doc(collection(db, "projects"));
      batch.set(projectDocRef, {
        name: projectName,
        budget: budget,
        currency: "USD", // Default currency
        createdAt: serverTimestamp(),
        roles: {
          [user.uid]: "Owner",
        },
      });

      // 2. Create the default categories in a subcollection
      const categoriesRef = collection(db, "projects", projectDocRef.id, "categories");
      defaultCategories.forEach(categoryName => {
        const newCategoryRef = doc(categoriesRef);
        batch.set(newCategoryRef, { name: categoryName, isDefault: true });
      });
      
      // Commit the batch
      await batch.commit();


      toast({
        title: "Project created successfully!",
      });
      setProjectName("");
      setProjectBudget("");
      setOpen(false);
    } catch (error) {
      console.error("Error creating project:", error);
      toast({
        title: "Error creating project",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };


  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="mt-4">Create Project</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
          <DialogDescription>
            Give your new budget project a name and a monthly budget. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Name
            </Label>
            <Input
              id="name"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="col-span-3"
              placeholder="e.g., Home Budget"
            />
          </div>
           <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="budget" className="text-right">
              Budget ($)
            </Label>
            <Input
              id="budget"
              type="number"
              value={projectBudget}
              onChange={(e) => setProjectBudget(e.target.value)}
              className="col-span-3"
              placeholder="e.g., 5000"
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleCreateProject} disabled={isCreating}>
            {isCreating ? "Creating..." : "Save Project"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

    
