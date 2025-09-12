
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { db, auth } from "@/lib/firebase/client";
import { doc, setDoc, getDoc } from "firebase/firestore";
import type { UserPreferences } from "@/lib/types";
import { useAuthState } from "react-firebase-hooks/auth";
import { Skeleton } from "@/components/ui/skeleton";

const currencies = ["USD", "EUR", "GBP", "JPY", "INR", "CAD", "AUD"];


export default function SettingsPage() {
  const [user, authLoading, authError] = useAuthState(auth);
  const { toast } = useToast();

  const [preferences, setPreferences] = useState<Partial<UserPreferences>>({});
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!user) {
        if (!authLoading) setLoading(false);
        return;
    };

    const fetchPreferences = async () => {
      setLoading(true);
      const prefRef = doc(db, "users", user.uid);
      const prefSnap = await getDoc(prefRef);

      if (prefSnap.exists()) {
        setPreferences(prefSnap.data());
      } else {
        setPreferences({ defaultCurrency: "USD" }); // Set a default if none exists
      }
      setLoading(false);
    };

    fetchPreferences();
  }, [user, authLoading]);

  const handleSave = async () => {
    if (!user) {
        toast({ title: "You must be logged in.", variant: "destructive" });
        return;
    };

    setIsSaving(true);
    try {
      const prefRef = doc(db, "users", user.uid);
      await setDoc(prefRef, preferences, { merge: true });
      toast({
        title: "Settings Saved",
        description: "Your preferences have been updated.",
      });
    } catch (error) {
      console.error("Error saving preferences:", error);
      toast({
        title: "Error",
        description: "Could not save your preferences.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleCurrencyChange = (value: string) => {
    setPreferences(prev => ({...prev, defaultCurrency: value}));
  }

  if (loading || authLoading) {
    return (
        <div className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
             <div className="flex items-center">
                <h1 className="text-lg font-semibold md:text-2xl font-headline">Settings</h1>
            </div>
            <Card>
                <CardHeader>
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-4 w-full max-w-sm" />
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-10 w-full max-w-xs" />
                    </div>
                </CardContent>
                <CardFooter>
                    <Skeleton className="h-10 w-24" />
                </CardFooter>
            </Card>
        </div>
    )
  }

  if (authError) {
      return <div className="p-6">Error: {authError.message}</div>
  }


  return (
    <div className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
      <div className="flex items-center">
        <h1 className="text-lg font-semibold md:text-2xl font-headline">
          Settings
        </h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Application Settings</CardTitle>
          <CardDescription>
            Manage your global application settings here.
          </CardDescription>
        </CardHeader>
        <CardContent>
           <div className="space-y-2">
                <Label htmlFor="currency">Default Reporting Currency</Label>
                <Select value={preferences.defaultCurrency || 'USD'} onValueChange={handleCurrencyChange}>
                    <SelectTrigger id="currency" className="w-full max-w-xs">
                    <SelectValue placeholder="Select a currency" />
                    </SelectTrigger>
                    <SelectContent>
                    {currencies.map((c) => (
                        <SelectItem key={c} value={c}>
                        {c}
                        </SelectItem>
                    ))}
                    </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground max-w-xs">
                    This currency will be used for aggregated financial reports.
                </p>
            </div>
        </CardContent>
        <CardFooter>
            <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? "Saving..." : "Save Preferences"}
            </Button>
      </CardFooter>
      </Card>
    </div>
  );
}
