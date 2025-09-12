
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase/client";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { Users } from "lucide-react";

type Role = "Editor" | "Viewer";

export function InviteUserDialog({ projectId }: { projectId: string }) {
  const [open, setOpen] = useState(false);
  const [uid, setUid] = useState("");
  const [role, setRole] = useState<Role>("Viewer");
  const [isInviting, setIsInviting] = useState(false);
  const { toast } = useToast();

  const handleInvite = async () => {
    if (!uid.trim()) {
      toast({ title: "User ID is required", variant: "destructive" });
      return;
    }

    setIsInviting(true);
    const projectRef = doc(db, "projects", projectId);
    
    try {
        const projectSnap = await getDoc(projectRef);
        if(!projectSnap.exists()) throw new Error("Project not found");

        const currentRoles = projectSnap.data().roles || {};
        if (currentRoles[uid]) {
            toast({ title: "User already in project", variant: "destructive" });
            setIsInviting(false);
            return;
        }
        
      await updateDoc(projectRef, {
        [`roles.${uid.trim()}`]: role,
      });
      
      toast({
        title: "User Invited!",
        description: "They now have access to this project.",
      });
      setUid("");
      setRole("Viewer");
      setOpen(false);
    } catch (error) {
      console.error("Error inviting user:", error);
      toast({
        title: "Error",
        description: "Could not invite user. Please check the UID and try again.",
        variant: "destructive",
      });
    } finally {
      setIsInviting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm"><Users className="mr-2 h-4 w-4" /> Invite User</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Invite a Collaborator</DialogTitle>
          <DialogDescription>
            Enter the User ID (UID) of the person you want to invite. They must have a BudgetBuddy account.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="uid" className="text-right">
              User ID
            </Label>
            <Input
              id="uid"
              value={uid}
              onChange={(e) => setUid(e.target.value)}
              className="col-span-3 font-mono text-xs"
              placeholder="e.g., aBCdEfgHiJKLmnoPqRs..."
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="role" className="text-right">
              Role
            </Label>
            <Select value={role} onValueChange={(value: Role) => setRole(value)}>
                <SelectTrigger id="role" className="col-span-3">
                    <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="Editor">Editor</SelectItem>
                    <SelectItem value="Viewer">Viewer</SelectItem>
                </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleInvite} disabled={isInviting}>
            {isInviting ? "Inviting..." : "Send Invite"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
