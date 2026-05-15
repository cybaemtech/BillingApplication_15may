import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { Receipt, CreditCard, ArrowUpRight, FileCheck } from "lucide-react";
import { accountsApi } from "@/lib/api";
import { formatCurrency } from "./accounting-utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { AppPagination } from "@/components/AppPagination";
import { paginateArray } from "@/lib/pagination";

const typeColors: Record<string, string> = {
  asset: "text-primary",
  liability: "text-warning",
  equity: "text-success",
  income: "text-success",
  expense: "text-destructive",
};

const ACCOUNT_TYPES = ["asset", "liability", "equity", "income", "expense"];

export default function ChartOfAccountsPage() {
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [accountType, setAccountType] = useState("asset");
  const [openingBalance, setOpeningBalance] = useState("0");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: accounts = [], isLoading } = useQuery({ queryKey: ["accounts"], queryFn: accountsApi.list });

  const createMutation = useMutation({
    mutationFn: () => accountsApi.create({
      code,
      name,
      account_type: accountType,
      balance: Number(openingBalance || 0),
      is_system: false,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      setOpen(false);
      setCode("");
      setName("");
      setAccountType("asset");
      setOpeningBalance("0");
      toast({ title: "Account created" });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const totals = {
    asset: accounts.filter((a: any) => a.account_type === "asset").reduce((s: number, a: any) => s + Number(a.balance || 0), 0),
    liability: accounts.filter((a: any) => a.account_type === "liability").reduce((s: number, a: any) => s + Number(a.balance || 0), 0),
    income: accounts.filter((a: any) => a.account_type === "income").reduce((s: number, a: any) => s + Number(a.balance || 0), 0),
    expense: accounts.filter((a: any) => a.account_type === "expense").reduce((s: number, a: any) => s + Number(a.balance || 0), 0),
  };
  const [page, setPage] = useState(1);
  const paginatedAccounts = paginateArray(accounts, page);

  return (
    <div>
      <PageHeader title="Chart of Accounts" subtitle="View and manage account structure" action={{ label: "New Account", onClick: () => setOpen(true) }} />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Account</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Code</Label><Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="e.g. 1001" /></div>
            <div className="space-y-2"><Label>Account Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Accounts Receivable" /></div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={accountType} onValueChange={setAccountType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ACCOUNT_TYPES.map((type) => <SelectItem key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Opening Balance</Label><Input type="number" step="0.01" value={openingBalance} onChange={(e) => setOpeningBalance(e.target.value)} /></div>
            <Button className="w-full" onClick={() => createMutation.mutate()} disabled={!code || !name || createMutation.isPending}>
              {createMutation.isPending ? "Creating..." : "Create Account"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="Total Assets" value={formatCurrency(totals.asset)} icon={ArrowUpRight} />
        <StatCard title="Total Liabilities" value={formatCurrency(totals.liability)} icon={Receipt} />
        <StatCard title="Total Income" value={formatCurrency(totals.income)} icon={CreditCard} />
        <StatCard title="Total Expense" value={formatCurrency(totals.expense)} icon={FileCheck} />
      </div>

      <div className="bg-card rounded-lg border border-border overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-muted-foreground">Loading...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground">Code</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground">Account Name</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground">Type</th>
                  <th className="text-right px-5 py-3 text-xs font-medium text-muted-foreground">Balance</th>
                </tr>
              </thead>
              <tbody>
                {paginatedAccounts.data.map((acc: any) => (
                  <tr key={acc.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-5 py-3 font-mono text-xs text-muted-foreground">{acc.code}</td>
                    <td className="px-5 py-3 font-medium text-card-foreground">{acc.name}</td>
                    <td className={`px-5 py-3 font-medium text-xs capitalize ${typeColors[acc.account_type] || ""}`}>{acc.account_type}</td>
                    <td className="px-5 py-3 text-right font-medium text-card-foreground">{formatCurrency(Number(acc.balance || 0))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <AppPagination currentPage={paginatedAccounts.pagination.page} totalPages={paginatedAccounts.pagination.totalPages} totalRecords={paginatedAccounts.pagination.total} onPageChange={setPage} />
    </div>
  );
}
