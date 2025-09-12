
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
import { doc, updateDoc, collection, writeBatch, query, where, getDocs } from "firebase/firestore";
import type { Category } from "@/lib/types";
import { Pencil } from "lucide-react";

interface EditCategoryDialogProps {
  projectId: string;
  category: Category;
  existingCategories: string[];
}

export function EditCategoryDialog({ projectId, category, existingCategories }: EditCategoryDialogProps) {
  const [open, setOpen] = useState(false);
  const [categoryName, setCategoryName] = useState(category.name);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const handleEditCategory = async () => {
    const trimmedName = categoryName.trim();
    if (!trimmedName) {
      toast({ title: "Category name is required", variant: "destructive" });
      return;
    }
    
    if (trimmedName.toLowerCase() !== category.name.toLowerCase() && existingCategories.some(c => c.toLowerCase() === trimmedName.toLowerCase())) {
        toast({ title: "Category already exists", variant: "destructive" });
        return;
    }
    
    if (trimmedName === category.name) {
        setOpen(false);
        return;
    }

    setIsSaving(true);
    try {
        const batch = writeBatch(db);

        // 1. Update the category document itself
        const categoryRef = doc(db, "projects", projectId, "categories", category.id);
        batch.update(categoryRef, { name: trimmedName });
        
        // 2. Find all transactions using the old category name and update them
        const transactionsRef = collection(db, "projects", projectId, "transactions");
        const q = query(transactionsRef, where("category", "==", category.name));
        const querySnapshot = await getDocs(q);
        
        querySnapshot.forEach((doc) => {
            batch.update(doc.ref, { category: trimmedName });
        });
        
        await batch.commit();

        toast({
            title: "Category Updated",
            description: `"${category.name}" was renamed to "${trimmedName}" and ${querySnapshot.size} transaction(s) were updated.`,
        });
        setOpen(false);
    } catch (error) {
      console.error("Error updating category:", error);
      toast({
        title: "Error updating category",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
            <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Category</DialogTitle>
          <DialogDescription>
            Rename the category. This will update the category for all existing transactions.
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
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleEditCategory} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
