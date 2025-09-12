
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
import { BrainCircuit, Loader2, Sparkles } from "lucide-react";
import { suggestBudgetGoal } from "@/ai/flows/smart-goal-setting";
import type { SuggestBudgetGoalOutput } from "@/ai/schemas/smart-goal-setting";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";


const defaultCategories = [
    "Food", "Transport", "Bills", "Salary", "Freelance", 
    "Entertainment", "Shopping", "Health", "Other", "Groceries", "Utilities"
];

const projectTypes = ["Home Budget", "Office Budget", "Business Budget", "Vacation Plan", "Personal Savings"];

export function CreateProjectDialog({ user }: { user: User }) {
  const [open, setOpen] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [projectType, setProjectType] = useState("Home Budget");
  const [projectBudget, setProjectBudget] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [suggestion, setSuggestion] = useState<SuggestBudgetGoalOutput | null>(null);
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
      setSuggestion(null);
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

  const handleGetSuggestion = async () => {
    setIsSuggesting(true);
    setSuggestion(null);
    try {
        const result = await suggestBudgetGoal({
            projectType,
            incomeHistory: JSON.stringify([]), // Passing empty history for now
            expenseHistory: JSON.stringify([]),
        });
        setSuggestion(result);
        setProjectBudget(result.suggestedGoal.toString());
    } catch(e) {
        toast({ title: "Failed to get suggestion.", variant: "destructive" });
    } finally {
        setIsSuggesting(false);
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
            <Label htmlFor="type" className="text-right">
              Type
            </Label>
             <Select value={projectType} onValueChange={setProjectType}>
                <SelectTrigger id="type" className="col-span-3">
                    <SelectValue placeholder="Select a type" />
                </SelectTrigger>
                <SelectContent>
                    {projectTypes.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
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
          <div className="grid grid-cols-4 items-center gap-4">
            <div className="col-start-2 col-span-3">
                 <Button onClick={handleGetSuggestion} disabled={isSuggesting || !projectType} variant="outline" size="sm">
                    {isSuggesting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                    Get AI Suggestion
                </Button>
            </div>
          </div>

          {suggestion && (
             <div className="col-start-1 col-span-4 mt-2 p-3 border rounded-lg bg-muted/50 space-y-2 text-sm">
                <h4 className="font-semibold flex items-center gap-2"><BrainCircuit className="h-4 w-4 text-primary" />AI Suggestion</h4>
                <p className="text-muted-foreground">{suggestion.reasoning}</p>
             </div>
          )}

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

    