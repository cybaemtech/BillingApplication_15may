import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/PageHeader";
import { journalEntriesApi, accountsApi } from "@/lib/api";
import { computeAccountMovement, formatCurrency } from "./accounting-utils";
import { useState } from "react";
import { AppPagination } from "@/components/AppPagination";
import { paginateArray } from "@/lib/pagination";

export default function TrialBalancePage() {
  const { data: entries = [], isLoading: entriesLoading } = useQuery({ queryKey: ["journal_entries"], queryFn: journalEntriesApi.list });
  const { data: accounts = [], isLoading: accountsLoading } = useQuery({ queryKey: ["accounts"], queryFn: accountsApi.list });
  const [page, setPage] = useState(1);

  const balances = computeAccountMovement(accounts, entries).filter((account: any) => account.trialDebit > 0 || account.trialCredit > 0);
  const paginatedBalances = paginateArray(balances, page);
  const totalDr = balances.reduce((sum: number, account: any) => sum + account.trialDebit, 0);
  const totalCr = balances.reduce((sum: number, account: any) => sum + account.trialCredit, 0);

  return (
    <div>
      <PageHeader title="Trial Balance" subtitle="Account balances summary" />
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        {entriesLoading || accountsLoading ? (
          <div className="p-12 text-center text-muted-foreground">Loading...</div>
        ) : (
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border bg-muted/50">
              <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground">Code</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground">Account</th>
              <th className="text-right px-5 py-3 text-xs font-medium text-muted-foreground">Debit</th>
              <th className="text-right px-5 py-3 text-xs font-medium text-muted-foreground">Credit</th>
            </tr></thead>
            <tbody>
              {balances.length === 0 ? (
                <tr><td colSpan={4} className="p-12 text-center text-muted-foreground">No data yet.</td></tr>
              ) : (<>
                {paginatedBalances.data.map((account: any) => (
                  <tr key={account.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                    <td className="px-5 py-3 font-mono text-xs text-muted-foreground">{account.code}</td>
                    <td className="px-5 py-3 text-card-foreground">{account.name}</td>
                    <td className="px-5 py-3 text-right font-medium text-card-foreground">{account.trialDebit > 0 ? formatCurrency(account.trialDebit) : "-"}</td>
                    <td className="px-5 py-3 text-right font-medium text-card-foreground">{account.trialCredit > 0 ? formatCurrency(account.trialCredit) : "-"}</td>
                  </tr>
                ))}
                <tr className="bg-muted/50 font-bold">
                  <td colSpan={2} className="px-5 py-3 text-card-foreground">Total</td>
                  <td className="px-5 py-3 text-right text-card-foreground">{formatCurrency(totalDr)}</td>
                  <td className="px-5 py-3 text-right text-card-foreground">{formatCurrency(totalCr)}</td>
                </tr>
              </>)}
            </tbody>
          </table>
        )}
      </div>
      <AppPagination currentPage={paginatedBalances.pagination.page} totalPages={paginatedBalances.pagination.totalPages} totalRecords={paginatedBalances.pagination.total} onPageChange={setPage} />
    </div>
  );
}
