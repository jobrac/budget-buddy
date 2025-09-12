
import Link from "next/link";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useEffect, useState } from "react";
import type { Project } from "@/lib/types";
import { checkBudgetStatus } from "@/ai/flows/check-budget-status";
import type { CheckBudgetStatusOutput } from "@/ai/schemas/check-budget-status";
import { AlertTriangle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProjectListProps {
  projects: Project[];
}

function ProjectCard({ project }: { project: Project }) {
  const [budgetStatus, setBudgetStatus] = useState<CheckBudgetStatusOutput | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBudgetStatus = async () => {
      setLoading(true);
      try {
        const status = await checkBudgetStatus({ projectId: project.id });
        setBudgetStatus(status);
      } catch (error) {
        console.error("Failed to fetch budget status:", error);
        setBudgetStatus(null); // Clear status on error
      }
      setLoading(false);
    };

    fetchBudgetStatus();
  }, [project.id]);

  const budget = budgetStatus?.budget || project.budget || 0;
  const expenses = budgetStatus?.expenses || 0;
  const progress = budget > 0 ? (expenses / budget) * 100 : 0;
  const status = budgetStatus?.status;

  const renderStatusMessage = () => {
    if (loading || !budgetStatus || status === 'UNDER_BUDGET') return null;

    const isOverBudget = status === 'OVER_BUDGET';

    return (
      <div className={cn(
        "flex items-center gap-2 text-xs p-2 rounded-md",
        isOverBudget ? "bg-destructive/10 text-destructive" : "bg-amber-500/10 text-amber-600"
      )}>
        {isOverBudget ? <AlertTriangle className="h-4 w-4" /> : <Info className="h-4 w-4" />}
        <span>{budgetStatus.message}</span>
      </div>
    );
  };

  return (
     <Card>
        <CardHeader>
          <CardTitle>{project.name}</CardTitle>
          <CardDescription>Monthly budget overview</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
        {loading ? (
             <div className="space-y-2">
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-4 bg-muted rounded w-full"></div>
             </div>
        ) : (
            <div>
              <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium text-muted-foreground">This Month's Spending</span>
                  <span className="text-sm font-medium">${expenses.toFixed(2)} / ${budget.toFixed(2)}</span>
              </div>
              <Progress value={progress} />
            </div>
        )}
         {renderStatusMessage()}
        </CardContent>
        <CardFooter>
        <Button asChild variant="outline" size="sm">
            <Link href={`/dashboard/project/${project.id}`}>View Project</Link>
        </Button>
        </CardFooter>
    </Card>
  )
}


export default function ProjectList({ projects }: ProjectListProps) {
  return (
    <div className="w-full grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {projects.map((project) => (
        <ProjectCard key={project.id} project={project} />
      ))}
    </div>
  );
}
