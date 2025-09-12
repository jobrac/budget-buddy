
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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { BrainCircuit, Loader2 } from "lucide-react";
import { suggestCollaborationRoles } from "@/ai/flows/suggest-collaboration-roles";
import type { SuggestCollaborationRolesOutput } from "@/ai/schemas/suggest-collaboration-roles";
import { Badge } from "@/components/ui/badge";

export function AiRoleSuggesterDialog({ projectType }: { projectType: string }) {
  const [open, setOpen] = useState(false);
  const [scenario, setScenario] = useState("");
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [suggestion, setSuggestion] = useState<SuggestCollaborationRolesOutput | null>(null);
  const { toast } = useToast();

  const handleGetSuggestion = async () => {
    if (!scenario.trim()) {
      toast({ title: "Please describe your scenario.", variant: "destructive" });
      return;
    }
    setIsSuggesting(true);
    setSuggestion(null);
    try {
      const result = await suggestCollaborationRoles({
        projectType,
        collaborationScenario: scenario,
      });
      setSuggestion(result);
    } catch (error) {
      console.error("Error getting suggestion:", error);
      toast({ title: "Error", description: "Could not get a suggestion at this time.", variant: "destructive" });
    } finally {
      setIsSuggesting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline"><BrainCircuit className="mr-2 h-4 w-4" /> Get Suggestions</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>AI Role Suggester</DialogTitle>
          <DialogDescription>
            Describe how you want to collaborate, and our AI will suggest the best roles for your team members.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="scenario">Collaboration Scenario</Label>
            <Textarea
              id="scenario"
              value={scenario}
              onChange={(e) => setScenario(e.target.value)}
              placeholder="e.g., 'I want to share my household budget with my partner so we can both add expenses.' or 'My accountant needs to see my business finances but not edit them.'"
              rows={4}
            />
          </div>
          <Button onClick={handleGetSuggestion} disabled={isSuggesting}>
            {isSuggesting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Thinking...</> : "Get AI Suggestion"}
          </Button>

          {suggestion && (
            <div className="mt-4 p-4 border rounded-lg bg-muted/50 space-y-4">
                <h4 className="font-semibold">Our Suggestion</h4>
                <div className="space-y-1">
                    <p className="text-sm font-medium">Suggested Roles:</p>
                    <div className="flex flex-wrap gap-2">
                        {suggestion.suggestedRoles.map(role => (
                            <Badge key={role} variant="secondary">{role}</Badge>
                        ))}
                    </div>
                </div>
                 <div className="space-y-1">
                    <p className="text-sm font-medium">Justification:</p>
                    <p className="text-sm text-muted-foreground">{suggestion.justification}</p>
                </div>
            </div>
          )}
        </div>
        <DialogFooter>
            <Button variant="secondary" onClick={() => setOpen(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
