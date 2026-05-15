import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/PageHeader";
import { journalEntriesApi, accountsApi } from "@/lib/api";
import { computeAccountMovement, formatCurrency } from "./accounting-utils";
import { useState } from "react";
import { AppPagination } from "@/components/AppPagination";
import { paginateArray } from "@/lib/pagination";

export default function BalanceSheetPage() {
  const { data: entries = [], isLoading: entriesLoading } = useQuery({ queryKey: ["journal_entries"], queryFn: journalEntriesApi.list });
  const { data: accounts = [], isLoading: accountsLoading } = useQuery({ queryKey: ["accounts"], queryFn: accountsApi.list });
  const [assetPage, setAssetPage] = useState(1);
  const [liabilityPage, setLiabilityPage] = useState(1);
  const [equityPage, setEquityPage] = useState(1);

  const computed = computeAccountMovement(accounts, entries);
  const assets = computed.filter((account: any) => account.account_type === "asset");
  const liabilities = computed.filter((account: any) => account.account_type === "liability");
  const equity = computed.filter((account: any) => account.account_type === "equity");
  const totalAssets = assets.reduce((sum: number, account: any) => sum + Math.max(account.closingBalance, 0), 0);
  const totalLiabilities = liabilities.reduce((sum: number, account: any) => sum + Math.max(account.closingBalance, 0), 0);
  const totalEquity = equity.reduce((sum: number, account: any) => sum + Math.max(account.closingBalance, 0), 0);

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
      <PageHeader title="Balance Sheet" subtitle="Financial position statement" />
      {entriesLoading || accountsLoading ? (
        <div className="p-12 text-center text-muted-foreground">Loading...</div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Section title="Assets" items={assets} total={totalAssets} page={assetPage} onPageChange={setAssetPage} />
            <div className="space-y-6">
              <Section title="Liabilities" items={liabilities} total={totalLiabilities} page={liabilityPage} onPageChange={setLiabilityPage} />
              <Section title="Equity" items={equity} total={totalEquity} page={equityPage} onPageChange={setEquityPage} />
            </div>
          </div>
          <div className="mt-6 rounded-lg border border-border bg-muted/40 px-5 py-4 flex justify-between font-semibold">
            <span>Liabilities + Equity</span>
            <span>{formatCurrency(totalLiabilities + totalEquity)}</span>
          </div>
        </>
      )}
    </div>
  );
}
