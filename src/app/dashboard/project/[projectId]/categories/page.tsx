
"use client";

import { useCollection } from "react-firebase-hooks/firestore";
import { db } from "@/lib/firebase/client";
import { collection, query, orderBy } from "firebase/firestore";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Category } from "@/lib/types";
import { useParams } from "next/navigation";
import CategoriesList from "./_components/categories-list";
import { CreateCategoryDialog } from "./_components/create-category-dialog";

export default function CategoriesPage() {
  const params = useParams();
  const projectId = params.projectId as string;

  const [categoriesSnapshot, categoriesLoading, categoriesError] = useCollection(
    query(collection(db, "projects", projectId, "categories"), orderBy("name", "asc"))
  );

  if (categoriesLoading) {
    return <div>Loading categories...</div>;
  }

  if (categoriesError) {
    return <div>Error: {categoriesError?.message}</div>;
  }

  const categories = categoriesSnapshot?.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Category[] || [];

  return (
    <>
      <div className="flex items-center justify-between -mt-2">
        <h2 className="text-lg font-semibold md:text-xl font-headline">
          Categories
        </h2>
        <CreateCategoryDialog projectId={projectId} existingCategories={categories.map(c => c.name)} />
      </div>
       <Card>
        <CardHeader>
          <CardTitle>Manage Categories</CardTitle>
          <CardDescription>
            Here are all the categories for this project. You can add, edit, or delete categories.
          </CardDescription>
        </CardHeader>
        <CardContent>
            {categories.length > 0 ? (
                <CategoriesList projectId={projectId} categories={categories} />
            ) : (
                <div className="text-center py-8 text-muted-foreground">
                    <p>No categories found.</p>
                </div>
            )}
        </CardContent>
      </Card>
    </>
  );
}
