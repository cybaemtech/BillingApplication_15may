import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/PageHeader";
import { journalEntriesApi, accountsApi } from "@/lib/api";
import { computeAccountMovement, formatCurrency } from "./accounting-utils";
import { useState } from "react";
import { AppPagination } from "@/components/AppPagination";
import { paginateArray } from "@/lib/pagination";

export default function ProfitLossPage() {
  const { data: entries = [], isLoading: entriesLoading } = useQuery({ queryKey: ["journal_entries"], queryFn: journalEntriesApi.list });
  const { data: accounts = [], isLoading: accountsLoading } = useQuery({ queryKey: ["accounts"], queryFn: accountsApi.list });
  const [incomePage, setIncomePage] = useState(1);
  const [expensePage, setExpensePage] = useState(1);

  const computed = computeAccountMovement(accounts, entries);
  const income = computed.filter((account: any) => account.account_type === "income");
  const expense = computed.filter((account: any) => account.account_type === "expense");
  const totalIncome = income.reduce((sum: number, account: any) => sum + Math.max(account.closingBalance, 0), 0);
  const totalExpense = expense.reduce((sum: number, account: any) => sum + Math.max(account.closingBalance, 0), 0);
  const netProfit = totalIncome - totalExpense;

  const Section = ({ title, items, total, page, onPageChange }: { title: string; items: any[]; total: number; page: number; onPageChange: (page: number) => void }) => {
    const paginatedItems = paginateArray(items, page);
    return (
    <div className="bg-card rounded-lg border border-border">
      <div className="px-5 py-4 border-b border-border"><h3 className="text-sm font-semibold text-card-foreground">{title}</h3></div>
      {items.length === 0 ? <div className="p-8 text-center text-muted-foreground text-sm">No accounts.</div> : (
        <div className="divide-y divide-border">
          {paginatedItems.data.map((account: any) => (
            <div key={account.id} className="flex justify-between px-5 py-3">
              <span className="text-sm text-card-foreground">{account.name}</span>
              <span className="text-sm font-medium text-card-foreground">{formatCurrency(Math.max(account.closingBalance, 0))}</span>
            </div>
          ))}
          <div className="flex justify-between px-5 py-3 bg-muted/50 font-bold">
            <span className="text-sm text-card-foreground">Total {title}</span>
            <span className="text-sm text-card-foreground">{formatCurrency(total)}</span>
          </div>
        </div>
      )}
      <AppPagination currentPage={paginatedItems.pagination.page} totalPages={paginatedItems.pagination.totalPages} totalRecords={paginatedItems.pagination.total} onPageChange={onPageChange} />
    </div>
  )};

  return (
    <div>
      <PageHeader title="Profit & Loss" subtitle="Income and expense statement" />
      {entriesLoading || accountsLoading ? (
        <div className="p-12 text-center text-muted-foreground">Loading...</div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Section title="Income" items={income} total={totalIncome} page={incomePage} onPageChange={setIncomePage} />
            <Section title="Expenses" items={expense} total={totalExpense} page={expensePage} onPageChange={setExpensePage} />
          </div>
          <div className={`mt-6 p-5 rounded-lg border border-border ${netProfit >= 0 ? "bg-primary/5" : "bg-destructive/5"}`}>
            <div className="flex justify-between items-center">
              <span className="text-lg font-bold text-card-foreground">{netProfit >= 0 ? "Net Profit" : "Net Loss"}</span>
              <span className={`text-2xl font-bold ${netProfit >= 0 ? "text-primary" : "text-destructive"}`}>{formatCurrency(Math.abs(netProfit))}</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
