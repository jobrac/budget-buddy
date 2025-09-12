
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
import { addDoc, collection } from "firebase/firestore";
import { PlusCircle } from "lucide-react";

interface CreateCategoryDialogProps {
  projectId: string;
  existingCategories: string[];
}

export function CreateCategoryDialog({ projectId, existingCategories }: CreateCategoryDialogProps) {
  const [open, setOpen] = useState(false);
  const [categoryName, setCategoryName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();

  const handleCreateCategory = async () => {
    const trimmedName = categoryName.trim();
    if (!trimmedName) {
      toast({
        title: "Category name is required",
        variant: "destructive",
      });
      return;
    }
    
    if (existingCategories.some(c => c.toLowerCase() === trimmedName.toLowerCase())) {
         toast({
            title: "Category already exists",
            description: `A category named "${trimmedName}" already exists in this project.`,
            variant: "destructive",
        });
        return;
    }


    setIsCreating(true);
    try {
      await addDoc(collection(db, "projects", projectId, "categories"), {
        name: trimmedName,
        isDefault: false
      });
      toast({
        title: "Category created successfully!",
      });
      setCategoryName("");
      setOpen(false);
    } catch (error) {
      console.error("Error creating category:", error);
      toast({
        title: "Error creating category",
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
        <Button size="sm"><PlusCircle className="mr-2 h-4 w-4" /> Add Category</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Category</DialogTitle>
          <DialogDescription>
            Add a new custom category to this project.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Category Name
            </Label>
            <Input
              id="name"
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              className="col-span-3"
              placeholder="e.g., Subscriptions"
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleCreateCategory} disabled={isCreating}>
            {isCreating ? "Creating..." : "Save Category"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
