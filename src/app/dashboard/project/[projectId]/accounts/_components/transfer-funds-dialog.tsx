
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
import { addDoc, collection, serverTimestamp, doc, runTransaction, getDocs } from "firebase/firestore";
import type { Account } from "@/lib/types";
import { ArrowRightLeft, Loader2 } from "lucide-react";
import { convertCurrency } from "@/ai/flows/currency-converter";
import { debounce } from 'lodash';

export function TransferFundsDialog({ projectId }: { projectId: string }) {
  const [open, setOpen] = useState(false);
  const [isTransferring, setIsTransferring] = useState(false);
  const [fromAccountId, setFromAccountId] = useState("");
  const [toAccountId, setToAccountId] = useState("");
  const [amount, setAmount] = useState("");
  const [accounts, setAccounts] = useState<Account[]>([]);
  const { toast } = useToast();
  
  const [conversionResult, setConversionResult] = useState<{ amount: number, currency: string } | null>(null);
  const [isConverting, setIsConverting] = useState(false);


  useEffect(() => {
    if (!open) return;
    
    const fetchAccounts = async () => {
      const accountsQuery = collection(db, "projects", projectId, "accounts");
      const accountsSnapshot = await getDocs(accountsQuery);
      const fetchedAccounts = accountsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Account[];
      setAccounts(fetchedAccounts);
    };

    fetchAccounts();
    // Reset form state on open
    setFromAccountId("");
    setToAccountId("");
    setAmount("");
    setConversionResult(null);

  }, [projectId, open]);

  const debouncedConvert = useCallback(
    debounce(async (fromAccount: Account, toAccount: Account, transferAmount: number) => {
      if (fromAccount.currency === toAccount.currency) {
        setConversionResult(null);
        return;
      }
      setIsConverting(true);
      try {
        const result = await convertCurrency({
          amount: transferAmount,
          from: fromAccount.currency,
          to: toAccount.currency,
        });
        setConversionResult({ amount: result.convertedAmount, currency: toAccount.currency });
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
  
  const fromAccount = accounts.find(a => a.id === fromAccountId);
  const toAccount = accounts.find(a => a.id === toAccountId);
  const transferAmount = parseFloat(amount);

  useEffect(() => {
    if (fromAccount && toAccount && !isNaN(transferAmount) && transferAmount > 0) {
      debouncedConvert(fromAccount, toAccount, transferAmount);
    } else {
      setConversionResult(null);
    }
  }, [amount, fromAccountId, toAccountId, accounts, debouncedConvert, fromAccount, toAccount, transferAmount]);


  const handleTransfer = async () => {
    if (!fromAccountId || !toAccountId || !amount) {
      toast({
        title: "Missing fields",
        description: "Please select both accounts and enter an amount.",
        variant: "destructive",
      });
      return;
    }

    if (fromAccountId === toAccountId) {
        toast({
            title: "Invalid accounts",
            description: "Cannot transfer funds to the same account.",
            variant: "destructive"
        });
        return;
    }

    if (isNaN(transferAmount) || transferAmount <= 0) {
        toast({
            title: "Invalid amount",
            description: "Please enter a valid positive number for the amount.",
            variant: "destructive"
        });
        return;
    }
    
    if (!fromAccount || !toAccount) {
        toast({ title: "Account not found", variant: "destructive" });
        return;
    }

    if (fromAccount.balance < transferAmount) {
         toast({
            title: "Insufficient funds",
            description: `The account "${fromAccount.name}" does not have enough funds to complete this transfer.`,
            variant: "destructive"
        });
        return;
    }

    const isConversion = fromAccount.currency !== toAccount.currency;
    if (isConversion && !conversionResult) {
        toast({ title: "Conversion pending", description: "Please wait for currency conversion to complete.", variant: "destructive" });
        return;
    }

    setIsTransferring(true);
    try {
        const fromAccountRef = doc(db, "projects", projectId, "accounts", fromAccountId);
        const toAccountRef = doc(db, "projects", projectId, "accounts", toAccountId);

        await runTransaction(db, async (transaction) => {
            // 1. Decrement balance from the source account
            const fromDoc = await transaction.get(fromAccountRef);
            if (!fromDoc.exists()) throw "Source account does not exist!";
            const newFromBalance = fromDoc.data().balance - transferAmount;
            transaction.update(fromAccountRef, { balance: newFromBalance });

            // 2. Increment balance in the destination account (use converted amount if necessary)
            const amountToCredit = isConversion ? conversionResult!.amount : transferAmount;
            const toDoc = await transaction.get(toAccountRef);
            if (!toDoc.exists()) throw "Destination account does not exist!";
            const newToBalance = toDoc.data().balance + amountToCredit;
            transaction.update(toAccountRef, { balance: newToBalance });

            // Transactions are not created for transfers to avoid double counting
        });

        toast({
            title: "Transfer Successful",
            description: `${transferAmount.toFixed(2)} ${fromAccount.currency} was transferred to ${toAccount.name}.`,
        });
      
        // Reset form
        setFromAccountId("");
        setToAccountId("");
        setAmount("");
        setOpen(false);

    } catch (error) {
        console.error("Error transferring funds:", error);
        toast({
            title: "Error",
            description: "Could not complete the transfer. Please try again.",
            variant: "destructive",
        });
    } finally {
      setIsTransferring(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline"><ArrowRightLeft className="mr-2 h-4 w-4" />Transfer Funds</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Transfer Funds</DialogTitle>
          <DialogDescription>
            Move money between your accounts within this project. Exchange rates are applied automatically.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="fromAccount" className="text-right">
              From
            </Label>
            <Select onValueChange={setFromAccountId} value={fromAccountId}>
              <SelectTrigger id="fromAccount" className="col-span-3">
                <SelectValue placeholder="Select account" />
              </SelectTrigger>
              <SelectContent>
                {accounts.map(account => (
                    <SelectItem key={account.id} value={account.id}>{account.name} ({account.balance.toFixed(2)} {account.currency})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="toAccount" className="text-right">
              To
            </Label>
            <Select onValueChange={setToAccountId} value={toAccountId}>
              <SelectTrigger id="toAccount" className="col-span-3">
                <SelectValue placeholder="Select account" />
              </SelectTrigger>
              <SelectContent>
                 {accounts.map(account => (
                    <SelectItem key={account.id} value={account.id}>{account.name} ({account.balance.toFixed(2)} {account.currency})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
           <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="amount" className="text-right">
              Amount
            </Label>
            <Input
              id="amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="col-span-3"
              placeholder={`0.00 ${fromAccount?.currency || ''}`}
            />
          </div>
           {(isConverting || (conversionResult && fromAccount?.currency !== toAccount?.currency)) && (
            <div className="grid grid-cols-4 items-center gap-4">
              <div className="col-start-2 col-span-3 text-sm text-muted-foreground flex items-center gap-2">
                {isConverting ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Converting...</>
                ) : conversionResult ? `≈ ${conversionResult.amount.toFixed(2)} ${conversionResult.currency}` : ''}
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button onClick={handleTransfer} disabled={isTransferring || isConverting}>
            {isTransferring ? "Transferring..." : "Confirm Transfer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

    