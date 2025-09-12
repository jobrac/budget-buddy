
"use client";

import { useState, useEffect, useCallback } from "react";
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
import { addDoc, collection, serverTimestamp, getDocs, doc, runTransaction, query, getDoc } from "firebase/firestore";
import { Calendar as CalendarIcon, Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type { Account, Category, Project } from "@/lib/types";
import { convertCurrency } from "@/ai/flows/currency-converter";
import { debounce } from 'lodash';


export function AddTransactionDialog({ projectId }: { projectId: string }) {
  const [open, setOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<"Income" | "Expense">("Expense");
  const [category, setCategory] = useState("");
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [description, setDescription] = useState("");
  const [accountId, setAccountId] = useState("");

  const { toast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [project, setProject] = useState<Project | null>(null);
  
  const [openCategory, setOpenCategory] = useState(false);
  const [search, setSearch] = useState('');

  const [conversionResult, setConversionResult] = useState<{ amount: number, currency: string } | null>(null);
  const [isConverting, setIsConverting] = useState(false);


  const resetForm = useCallback(() => {
      setAmount("");
      setType("Expense");
      setCategory("");
      setDate(new Date());
      setDescription("");
      setAccountId(accounts.length > 0 ? accounts[0].id : "");
      setConversionResult(null);
  }, [accounts]);


  useEffect(() => {
    if (!open) return;
    
    const fetchProjectData = async () => {
      // Fetch Project
      const projectRef = doc(db, "projects", projectId);
      const projectSnap = await getDoc(projectRef);
      if(projectSnap.exists()) {
        setProject({ id: projectSnap.id, ...projectSnap.data() } as Project);
      }

      // Fetch Categories
      const categoriesQuery = query(collection(db, "projects", projectId, "categories"));
      const categoriesSnapshot = await getDocs(categoriesQuery);
      const fetchedCategories = categoriesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
      setCategories(fetchedCategories.sort((a, b) => a.name.localeCompare(b.name)));

      // Fetch Accounts
      const accountsQuery = collection(db, "projects", projectId, "accounts");
      const accountsSnapshot = await getDocs(accountsQuery);
      const fetchedAccounts = accountsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Account[];
      setAccounts(fetchedAccounts);
      if(fetchedAccounts.length > 0) {
        setAccountId(fetchedAccounts[0].id);
      }
    };

    fetchProjectData();
    resetForm();
  }, [projectId, open, resetForm]);

  // Debounced currency conversion
  const debouncedConvert = useCallback(
    debounce(async (account: Account, projectCurrency: string, transactionAmount: number) => {
      if (account.currency === projectCurrency) {
        setConversionResult(null);
        return;
      }
      setIsConverting(true);
      try {
        const result = await convertCurrency({
          amount: transactionAmount,
          from: account.currency,
          to: projectCurrency,
        });
        setConversionResult({ amount: result.convertedAmount, currency: projectCurrency });
      } catch (error) {
        console.error("Conversion error:", error);
        toast({ title: "Currency conversion failed.", variant: "destructive" });
        setConversionResult(null);
      } finally {
        setIsConverting(false);
      }
    }, 500),
    [toast]
  );

  useEffect(() => {
    const transactionAmount = parseFloat(amount);
    const selectedAccount = accounts.find(a => a.id === accountId);
    if (selectedAccount && project && !isNaN(transactionAmount) && transactionAmount > 0) {
      debouncedConvert(selectedAccount, project.currency, transactionAmount);
    } else {
      setConversionResult(null);
    }
  }, [amount, accountId, accounts, project, debouncedConvert]);


  const handleSave = async () => {
    if (!amount || !category || !date || !accountId || !project) {
      toast({
        title: "Missing fields",
        description: "Please fill out all required fields.",
        variant: "destructive",
      });
      return;
    }

    const selectedAccount = accounts.find(a => a.id === accountId);
    if (!selectedAccount) {
        toast({ title: "Account not found", variant: "destructive" });
        return;
    }
    
    const isConversion = selectedAccount.currency !== project.currency;
    if (isConversion && !conversionResult) {
      toast({ title: "Conversion processing", description: "Please wait for currency conversion to finish.", variant: "destructive" });
      return;
    }

    setIsSaving(true);
    try {
      const originalAmount = parseFloat(amount);
      const accountRef = doc(db, "projects", projectId, "accounts", accountId);
      const transactionRef = collection(db, "projects", projectId, "transactions");

      await runTransaction(db, async (transaction) => {
        const accountDoc = await transaction.get(accountRef);
        if (!accountDoc.exists()) {
          throw "Account does not exist!";
        }

        const currentBalance = accountDoc.data().balance;
        const newBalance = type === 'Income' ? currentBalance + originalAmount : currentBalance - originalAmount;
        
        transaction.update(accountRef, { balance: newBalance });
        
        const reportingAmount = isConversion && conversionResult ? conversionResult.amount : originalAmount;

        transaction.set(doc(transactionRef), {
            amount: reportingAmount, // This is in the project's currency
            type,
            category,
            date: serverTimestamp(), 
            clientDate: date,
            description,
            createdAt: serverTimestamp(),
            accountId: accountId,
            accountName: selectedAccount.name,
            originalAmount: originalAmount,
            accountCurrency: selectedAccount.currency,
        });
      });

      toast({
        title: "Transaction Added",
        description: "Your transaction has been saved successfully.",
      });
      
      resetForm();
      setOpen(false);

    } catch (error) {
      console.error("Error adding transaction:", error);
      toast({
        title: "Error",
        description: "Could not save the transaction. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleCreateCategory = async (newCategoryName: string) => {
    const formattedCategory = newCategoryName.trim();
    if (!formattedCategory) return;
    
    const existingCategory = categories.find(c => c.name.toLowerCase() === formattedCategory.toLowerCase());
    if (existingCategory) {
        setCategory(existingCategory.name);
        setSearch('');
        setOpenCategory(false);
        return;
    }

    try {
        const categoriesRef = collection(db, "projects", projectId, "categories");
        const newCategoryDoc = await addDoc(categoriesRef, { name: formattedCategory, isDefault: false });
        const newCategory = { id: newCategoryDoc.id, name: formattedCategory, isDefault: false };
        
        const updatedCategories = [...categories, newCategory].sort((a,b) => a.name.localeCompare(b.name));
        setCategories(updatedCategories);
        setCategory(formattedCategory);
        setSearch('');
        setOpenCategory(false);
    } catch(e) {
        toast({ title: "Failed to create category", variant: "destructive" });
    }
  };
  
  const selectedAccount = accounts.find(a => a.id === accountId);


  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Add Transaction</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Transaction</DialogTitle>
          <DialogDescription>
            Log a new income or expense for this project.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
           <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="account" className="text-right">
              Account
            </Label>
            <Select onValueChange={setAccountId} value={accountId}>
              <SelectTrigger id="account" className="col-span-3">
                <SelectValue placeholder="Select account" />
              </SelectTrigger>
              <SelectContent>
                {accounts.map(account => (
                    <SelectItem key={account.id} value={account.id}>{account.name} ({account.currency})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="type" className="text-right">
              Type
            </Label>
            <Select onValueChange={(value: "Income" | "Expense") => setType(value)} defaultValue={type}>
              <SelectTrigger id="type" className="col-span-3">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Expense">Expense</SelectItem>
                <SelectItem value="Income">Income</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="amount" className="text-right">
              Amount ({selectedAccount?.currency})
            </Label>
            <Input
              id="amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="col-span-3"
              placeholder="e.g., 50.00"
            />
          </div>
          {(isConverting || (conversionResult && selectedAccount?.currency !== project?.currency)) && (
            <div className="grid grid-cols-4 items-center gap-4">
              <div className="col-start-2 col-span-3 text-sm text-muted-foreground flex items-center gap-2">
                {isConverting ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Converting...</>
                ) : conversionResult ? `≈ ${conversionResult.amount.toFixed(2)} ${conversionResult.currency}` : ''}
              </div>
            </div>
          )}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="category" className="text-right">
              Category
            </Label>
             <Popover open={openCategory} onOpenChange={setOpenCategory}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={openCategory}
                    className="col-span-3 justify-between font-normal"
                  >
                    {category
                      ? categories.find((c) => c.name.toLowerCase() === category.toLowerCase())?.name
                      : "Select or create..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[280px] p-0">
                  <Command>
                    <CommandInput 
                      placeholder="Search or create..."
                      value={search}
                      onValueChange={setSearch}
                    />
                    <CommandList>
                      <CommandEmpty>
                         {search.trim() && !categories.some(c => c.name.toLowerCase() === search.trim().toLowerCase()) && (
                            <div
                              className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none"
                              onClick={() => handleCreateCategory(search)}
                            >
                              Create "{search.trim()}"
                            </div>
                         )}
                      </CommandEmpty>
                      <CommandGroup>
                        {categories.map((c) => (
                          <CommandItem
                            key={c.id}
                            value={c.name}
                            onSelect={(currentValue) => {
                               const selectedCategory = categories.find(cat => cat.name.toLowerCase() === currentValue.toLowerCase());
                               if (selectedCategory) {
                                   setCategory(selectedCategory.name);
                               }
                               setOpenCategory(false);
                               setSearch('');
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                category.toLowerCase() === c.name.toLowerCase() ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {c.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="date" className="text-right">
              Date
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "col-span-3 justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
           <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="description" className="text-right">
              Description
            </Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="col-span-3"
              placeholder="Optional notes"
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSave} disabled={isSaving || isConverting}>
            {isSaving ? "Saving..." : "Save Transaction"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

    