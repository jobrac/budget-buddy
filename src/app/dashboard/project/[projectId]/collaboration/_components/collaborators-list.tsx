
"use client";

import { useState } from "react";
import type { Project } from "@/lib/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db } from "@/lib/firebase/client";
import { doc, updateDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
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

interface CollaboratorsListProps {
  project: Project;
}

type Role = "Owner" | "Editor" | "Viewer";

export function CollaboratorsList({ project }: CollaboratorsListProps) {
  const [user] = useAuthState(auth);
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  const collaborators = Object.entries(project.roles);
  const currentUserRole = user ? project.roles[user.uid] : undefined;
  const isOwner = currentUserRole === "Owner";

  const handleRoleChange = async (uid: string, newRole: Role) => {
    setIsUpdating(uid);
    const projectRef = doc(db, "projects", project.id);
    try {
      await updateDoc(projectRef, {
        [`roles.${uid}`]: newRole,
      });
      toast({
        title: "Role updated",
        description: `User role has been changed to ${newRole}.`,
      });
    } catch (error) {
      console.error("Error updating role:", error);
      toast({ title: "Error", description: "Failed to update role.", variant: "destructive" });
    } finally {
      setIsUpdating(null);
    }
  };

  const handleRemoveUser = async (uid: string) => {
    setIsUpdating(uid);
    const projectRef = doc(db, "projects", project.id);
    
    // Create a new roles object without the user to be removed
    const newRoles = { ...project.roles };
    delete (newRoles as any)[uid];

    try {
      await updateDoc(projectRef, {
        roles: newRoles,
      });
      toast({
        title: "User removed",
        description: `User has been removed from the project.`,
      });
    } catch (error) {
      console.error("Error removing user:", error);
      toast({ title: "Error", description: "Failed to remove user.", variant: "destructive" });
    } finally {
      setIsUpdating(null);
    }
  };

  if (collaborators.length === 0) {
    return <p className="text-muted-foreground">No collaborators yet.</p>;
  }

  return (
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User ID</TableHead>
            <TableHead>Role</TableHead>
            {isOwner && <TableHead className="text-right">Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {collaborators.map(([uid, role]) => {
            const isCurrentUser = user?.uid === uid;
            const canBeModified = isOwner && !isCurrentUser; // Owners can't change their own role or be removed

            return (
              <TableRow key={uid}>
                <TableCell className="font-mono text-xs">{uid}{isCurrentUser && " (You)"}</TableCell>
                <TableCell>
                  {canBeModified ? (
                     <Select
                        value={role}
                        onValueChange={(newRole: Role) => handleRoleChange(uid, newRole)}
                        disabled={!!isUpdating}
                    >
                        <SelectTrigger className="w-[120px]">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Editor">Editor</SelectItem>
                            <SelectItem value="Viewer">Viewer</SelectItem>
                        </SelectContent>
                    </Select>
                  ) : (
                    role
                  )}
                </TableCell>
                {isOwner && (
                  <TableCell className="text-right">
                    {canBeModified ? (
                       <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" disabled={!!isUpdating}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This will permanently remove the user from this project.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleRemoveUser(uid)} disabled={isUpdating === uid}>
                                        {isUpdating === uid ? "Removing..." : "Continue"}
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                )}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
