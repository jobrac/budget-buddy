
'use server';

import { db } from "@/lib/firebase/client";
import { doc, writeBatch, collection, getDocs } from "firebase/firestore";

// This server action will handle the deletion.
export async function deleteProject(projectId: string): Promise<{success: boolean, error?: string}> {
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
