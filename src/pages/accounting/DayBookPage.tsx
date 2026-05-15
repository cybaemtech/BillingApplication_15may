import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/PageHeader";
import { journalEntriesApi } from "@/lib/api";
import { StatusBadge } from "@/components/StatusBadge";
import { formatCurrency, normalizeJournalLines } from "./accounting-utils";
import { useState } from "react";
import { AppPagination } from "@/components/AppPagination";
import { emptyPaginatedResponse } from "@/lib/pagination";

export default function DayBookPage() {
  const [page, setPage] = useState(1);
  const { data: response = emptyPaginatedResponse<any>(), isLoading } = useQuery({
    queryKey: ["journal_entries", page],
    queryFn: () => journalEntriesApi.listPage(page),
  });
  const entries = response.data;

  return (
    <div>
      <PageHeader title="Day Book" subtitle="Daily transaction register" />
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        {isLoading ? <div className="p-12 text-center text-muted-foreground">Loading...</div> : entries.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">No entries yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border bg-muted/50">
                <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground">Date</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground">Entry #</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground">Type</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground">Account</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-muted-foreground">Debit</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-muted-foreground">Credit</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground">Description</th>
              </tr></thead>
              <tbody>
                {entries.flatMap((entry: any) =>
                  normalizeJournalLines(entry).map((line: any, index: number) => (
                    <tr key={`${entry.id}-${index}`} className="border-b border-border last:border-0 hover:bg-muted/30">
                      <td className="px-5 py-3 text-muted-foreground">{entry.date}</td>
                      <td className="px-5 py-3 font-medium text-primary">{entry.document_number}</td>
                      <td className="px-5 py-3"><StatusBadge status={entry.journal_type} /></td>
                      <td className="px-5 py-3 text-card-foreground">{line.account_name || line.accounts?.name || "-"}</td>
                      <td className="px-5 py-3 text-right font-medium text-card-foreground">{Number(line.debit) > 0 ? formatCurrency(Number(line.debit || 0)) : "-"}</td>
                      <td className="px-5 py-3 text-right font-medium text-card-foreground">{Number(line.credit) > 0 ? formatCurrency(Number(line.credit || 0)) : "-"}</td>
                      <td className="px-5 py-3 text-muted-foreground">{line.description || entry.description || "-"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <AppPagination currentPage={response.pagination.page} totalPages={response.pagination.totalPages} totalRecords={response.pagination.total} onPageChange={setPage} />
    </div>
  );
}
