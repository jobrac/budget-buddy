
"use client";

import { useState, useEffect } from "react";
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
import { updateDoc, collection, getDocs, Timestamp, query, doc } from "firebase/firestore";
import { Calendar as CalendarIcon, Pencil } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type { Account, Category, RecurringTransaction } from "@/lib/types";

interface EditRecurringDialogProps {
    projectId: string;
    recurringTransaction: RecurringTransaction;
}

export function EditRecurringDialog({ projectId, recurringTransaction }: EditRecurringDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Form state, initialized with existing data
  const [accountId, setAccountId] = useState(recurringTransaction.accountId);
  const [type, setType] = useState<"Income" | "Expense">(recurringTransaction.type);
  const [amount, setAmount] = useState(recurringTransaction.amount.toString());
  const [category, setCategory] = useState(recurringTransaction.category);
  const [description, setDescription] = useState(recurringTransaction.description || "");
  const [frequency, setFrequency] = useState(recurringTransaction.frequency);
  const [interval, setInterval] = useState(recurringTransaction.interval.toString());
  const [startDate, setStartDate] = useState<Date | undefined>(recurringTransaction.startDate.toDate());
  const [nextDueDate, setNextDueDate] = useState<Date | undefined>(recurringTransaction.nextDueDate.toDate());


  const { toast } = useToast();
  
  // Data from Firestore
  const [categories, setCategories] = useState<Category[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);

  useEffect(() => {
    if (!projectId || !open) return;
    
    const fetchProjectData = async () => {
      // Fetch Categories
      const categoriesQuery = query(collection(db, "projects", projectId, "categories"));
      const categoriesSnapshot = await getDocs(categoriesQuery);
      setCategories(categoriesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category)));

      // Fetch Accounts
      const accountsQuery = collection(db, "projects", projectId, "accounts");
      const accountsSnapshot = await getDocs(accountsQuery);
      setAccounts(accountsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Account[]);
    };

    fetchProjectData();
  }, [projectId, open]);

  const handleSave = async () => {
    if (!accountId || !amount || !category || !startDate || !nextDueDate) {
      toast({ title: "Missing fields", variant: "destructive" });
      return;
    }
    
    const selectedAccount = accounts.find(a => a.id === accountId);
    if (!selectedAccount) {
        toast({ title: "Account not found", variant: "destructive" });
        return;
    }

    setIsSaving(true);
    try {
        const ruleRef = doc(db, "projects", projectId, "recurringTransactions", recurringTransaction.id);
        await updateDoc(ruleRef, {
            accountId,
            accountName: selectedAccount.name,
            amount: parseFloat(amount),
            type,
            category,
            description,
            frequency,
            interval: parseInt(interval, 10),
            startDate: Timestamp.fromDate(startDate),
            nextDueDate: Timestamp.fromDate(nextDueDate),
        });
      
      toast({ title: "Recurring transaction rule updated!" });
      setOpen(false);
    } catch (error) {
      console.error("Error updating recurring transaction:", error);
      toast({ title: "Error", description: "Could not update the rule.", variant: "destructive" });
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Recurring Transaction</DialogTitle>
          <DialogDescription>
            Modify the details of this recurring transaction rule.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-4">
           <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Account</Label>
            <Select onValueChange={setAccountId} value={accountId}>
              <SelectTrigger className="col-span-3"><SelectValue /></SelectTrigger>
              <SelectContent>
                {accounts.map(acc => <SelectItem key={acc.id} value={acc.id}>{acc.name} ({acc.currency})</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Type</Label>
            <Select onValueChange={(v: "Income"|"Expense") => setType(v)} value={type}>
              <SelectTrigger className="col-span-3"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Expense">Expense</SelectItem>
                <SelectItem value="Income">Income</SelectItem>
              </SelectContent>
            </Select>
          </div>
           <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Amount</Label>
            <Input type="number" value={amount} onChange={e => setAmount(e.target.value)} className="col-span-3"/>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Category</Label>
            <Select onValueChange={setCategory} value={category}>
              <SelectTrigger className="col-span-3"><SelectValue /></SelectTrigger>
              <SelectContent>
                {categories.map(cat => <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
           <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Frequency</Label>
            <div className="col-span-3 grid grid-cols-2 gap-2">
                <Select onValueChange={setFrequency} value={frequency}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="yearly">Yearly</SelectItem>
                    </SelectContent>
                </Select>
                <div className="flex items-center gap-2">
                    <Label>Every</Label>
                    <Input type="number" value={interval} onChange={e => setInterval(e.target.value)} className="w-16" min="1"/>
                </div>
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Start Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("col-span-3 justify-start text-left font-normal", !startDate && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus /></PopoverContent>
            </Popover>
          </div>
           <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Next Due</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("col-span-3 justify-start text-left font-normal", !nextDueDate && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {nextDueDate ? format(nextDueDate, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={nextDueDate} onSelect={setNextDueDate} initialFocus /></PopoverContent>
            </Popover>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Description</Label>
            <Input value={description} onChange={e => setDescription(e.target.value)} className="col-span-3" placeholder="Optional"/>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
