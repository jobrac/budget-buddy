
"use client";

import type { Category, Transaction } from "@/lib/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
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
import { useState, useEffect } from "react";
import { db } from "@/lib/firebase/client";
import { collection, query, where, getDocs, limit, deleteDoc, doc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { EditCategoryDialog } from "./edit-category-dialog";


interface CategoriesListProps {
  categories: Category[];
  projectId: string;
}

export default function CategoriesList({ categories, projectId }: CategoriesListProps) {
    const { toast } = useToast();
    const [isDeleting, setIsDeleting] = useState<string | null>(null);
    const [usageCount, setUsageCount] = useState<Record<string, number>>({});
    const [loadingUsage, setLoadingUsage] = useState(true);

    useEffect(() => {
        const fetchUsageCount = async () => {
            setLoadingUsage(true);
            const counts: Record<string, number> = {};
            const transactionsRef = collection(db, "projects", projectId, "transactions");
            const transactionsSnap = await getDocs(transactionsRef);
            const allTransactions = transactionsSnap.docs.map(d => d.data() as Transaction);

            for (const category of categories) {
                counts[category.name] = allTransactions.filter(t => t.category === category.name).length;
            }
            setUsageCount(counts);
            setLoadingUsage(false);
        };
        fetchUsageCount();
    }, [categories, projectId]);

    const handleDelete = async (category: Category) => {
        setIsDeleting(category.id);
        
        if (usageCount[category.name] > 0) {
            toast({
                title: "Cannot Delete Category",
                description: `"${category.name}" is being used by ${usageCount[category.name]} transaction(s).`,
                variant: "destructive",
            });
            setIsDeleting(null);
            return;
        }

        try {
            const categoryDocRef = doc(db, "projects", projectId, "categories", category.id);
            await deleteDoc(categoryDocRef);
            toast({
                title: "Category Deleted",
                description: `"${category.name}" has been successfully deleted.`,
            });
        } catch (error) {
            console.error("Error deleting category:", error);
            toast({
                title: "Error",
                description: "Could not delete the category. Please try again.",
                variant: "destructive",
            });
        } finally {
            setIsDeleting(null);
        }
    };

    return (
        <div className="border rounded-md">
        <Table>
            <TableHeader>
            <TableRow>
                <TableHead>Category Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Transactions</TableHead>
                <TableHead className="text-right">Actions</TableHead>
            </TableRow>
            </TableHeader>
            <TableBody>
            {categories.map((category) => (
                <TableRow key={category.id}>
                <TableCell className="font-medium">{category.name}</TableCell>
                <TableCell>
                    {category.isDefault ? (
                        <Badge variant="secondary">Default</Badge>
                    ) : (
                        <Badge variant="outline">Custom</Badge>
                    )}
                </TableCell>
                <TableCell>
                    {loadingUsage ? '...' : (usageCount[category.name] || 0) }
                </TableCell>
                <TableCell className="text-right space-x-1">
                    <EditCategoryDialog 
                        projectId={projectId} 
                        category={category} 
                        existingCategories={categories.map(c => c.name)}
                    />
                    <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            disabled={!!isDeleting || (usageCount[category.name] > 0 && !loadingUsage)}
                            title={usageCount[category.name] > 0 ? "Cannot delete category in use" : "Delete category"}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the
                            <span className="font-semibold"> {category.name} </span> category.
                        </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(category)} disabled={isDeleting === category.id}>
                            {isDeleting === category.id ? "Deleting..." : "Continue"}
                        </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                    </AlertDialog>
                </TableCell>
                </TableRow>
            ))}
            </TableBody>
        </Table>
        </div>
    );
}
