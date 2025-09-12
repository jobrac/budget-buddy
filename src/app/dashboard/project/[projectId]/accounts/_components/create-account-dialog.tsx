
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
import { addDoc, collection, serverTimestamp } from "firebase/firestore";

const currencies = ["USD", "EUR", "GBP", "JPY", "INR", "CAD", "AUD"];

export function CreateAccountDialog({ projectId }: { projectId: string }) {
  const [open, setOpen] = useState(false);
  const [accountName, setAccountName] = useState("");
  const [initialBalance, setInitialBalance] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();

  const handleCreateAccount = async () => {
    if (!accountName.trim()) {
      toast({
        title: "Account name is required",
        variant: "destructive",
      });
      return;
    }
    
    const balance = parseFloat(initialBalance) || 0;

    setIsCreating(true);
    try {
      await addDoc(collection(db, "projects", projectId, "accounts"), {
        name: accountName,
        balance: balance,
        currency: currency,
        createdAt: serverTimestamp(),
      });
      toast({
        title: "Account created successfully!",
      });
      setAccountName("");
      setInitialBalance("");
      setCurrency("USD");
      setOpen(false);
    } catch (error) {
      console.error("Error creating account:", error);
      toast({
        title: "Error creating account",
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
        <Button size="sm">Add Account</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Account</DialogTitle>
          <DialogDescription>
            Give your new account a name, currency, and an optional starting balance.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Account Name
            </Label>
            <Input
              id="name"
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              className="col-span-3"
              placeholder="e.g., Cash, Bank Account"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="currency" className="text-right">
              Currency
            </Label>
            <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger id="currency" className="col-span-3">
                    <SelectValue placeholder="Select a currency" />
                </SelectTrigger>
                <SelectContent>
                    {currencies.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
          </div>
           <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="balance" className="text-right">
              Initial Balance
            </Label>
            <Input
              id="balance"
              type="number"
              value={initialBalance}
              onChange={(e) => setInitialBalance(e.target.value)}
              className="col-span-3"
              placeholder="e.g., 100.00 (optional)"
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleCreateAccount} disabled={isCreating}>
            {isCreating ? "Creating..." : "Save Account"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
