
import type { Account } from "@/lib/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";

interface AccountsListProps {
  accounts: Account[];
}

export default function AccountsList({ accounts }: AccountsListProps) {
    const sortedAccounts = [...accounts].sort((a, b) => {
        const dateA = a.createdAt?.toDate() || new Date(0);
        const dateB = b.createdAt?.toDate() || new Date(0);
        return dateB.getTime() - dateA.getTime();
    });

  return (
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Account Name</TableHead>
            <TableHead>Created</TableHead>
            <TableHead>Currency</TableHead>
            <TableHead className="text-right">Current Balance</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedAccounts.map((account) => (
            <TableRow key={account.id}>
              <TableCell className="font-medium">{account.name}</TableCell>
              <TableCell>
                 {account.createdAt ? format(account.createdAt.toDate(), "MMM d, yyyy") : 'N/A'}
              </TableCell>
              <TableCell>{account.currency}</TableCell>
              <TableCell className="text-right font-semibold">
                {new Intl.NumberFormat('en-US', { style: 'currency', currency: account.currency }).format(account.balance)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
