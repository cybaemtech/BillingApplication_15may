import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/PageHeader";
import { journalEntriesApi, accountsApi } from "@/lib/api";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, normalizeJournalLines } from "./accounting-utils";
import { AppPagination } from "@/components/AppPagination";
import { emptyPaginatedResponse } from "@/lib/pagination";

const emptyLine = { account_id: "", debit: "", credit: "", description: "" };

export default function JournalEntriesPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [entryDate, setEntryDate] = useState(new Date().toISOString().split("T")[0]);
  const [description, setDescription] = useState("");
  const [journalType, setJournalType] = useState("general");
  const [lines, setLines] = useState<any[]>([{ ...emptyLine }, { ...emptyLine }]);
  const [page, setPage] = useState(1);

  const { data: response = emptyPaginatedResponse<any>(), isLoading } = useQuery({
    queryKey: ["journal_entries", page],
    queryFn: () => journalEntriesApi.listPage(page),
  });
  const entries = response.data;
  const { data: accounts = [] } = useQuery({ queryKey: ["accounts"], queryFn: accountsApi.list });

  const createMutation = useMutation({
    mutationFn: () => journalEntriesApi.create({ date: entryDate, description, journal_type: journalType }, lines.map((line) => ({
      account_id: line.account_id,
      debit: Number(line.debit || 0),
      credit: Number(line.credit || 0),
      description: line.description || null,
    }))),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["journal_entries"] });
      setOpen(false);
      setEntryDate(new Date().toISOString().split("T")[0]);
      setDescription("");
      setJournalType("general");
      setLines([{ ...emptyLine }, { ...emptyLine }]);
      toast({ title: "Journal entry created" });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: journalEntriesApi.delete,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["journal_entries"] });
      toast({ title: "Journal entry deleted" });
    },
  });

  const totalDebit = lines.reduce((sum, line) => sum + Number(line.debit || 0), 0);
  const totalCredit = lines.reduce((sum, line) => sum + Number(line.credit || 0), 0);
  const balanced = totalDebit > 0 && totalDebit === totalCredit;

  return (
    <div>
      <PageHeader title="Journal Entries" subtitle="Manual journal entries" action={{ label: "New Entry", onClick: () => setOpen(true) }} />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader><DialogTitle>New Journal Entry</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2"><Label>Date</Label><Input type="date" value={entryDate} onChange={(e) => setEntryDate(e.target.value)} /></div>
              <div className="space-y-2"><Label>Type</Label><Select value={journalType} onValueChange={setJournalType}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="general">General</SelectItem><SelectItem value="sales">Sales</SelectItem><SelectItem value="purchase">Purchase</SelectItem><SelectItem value="receipt">Receipt</SelectItem><SelectItem value="payment">Payment</SelectItem></SelectContent></Select></div>
              <div className="space-y-2"><Label>Description</Label><Input value={description} onChange={(e) => setDescription(e.target.value)} /></div>
            </div>

            <div className="space-y-3">
              {lines.map((line, index) => (
                <div key={index} className="grid grid-cols-[1.3fr_0.7fr_0.7fr_1fr_auto] gap-3 items-end">
                  <div className="space-y-2">
                    <Label>Account</Label>
                    <Select value={line.account_id} onValueChange={(value) => setLines(lines.map((current, i) => i === index ? { ...current, account_id: value } : current))}>
                      <SelectTrigger><SelectValue placeholder="Select account" /></SelectTrigger>
                      <SelectContent>
                        {accounts.map((account: any) => <SelectItem key={account.id} value={account.id}>{account.code} - {account.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2"><Label>Debit</Label><Input type="number" step="0.01" value={line.debit} onChange={(e) => setLines(lines.map((current, i) => i === index ? { ...current, debit: e.target.value, credit: e.target.value ? "" : current.credit } : current))} /></div>
                  <div className="space-y-2"><Label>Credit</Label><Input type="number" step="0.01" value={line.credit} onChange={(e) => setLines(lines.map((current, i) => i === index ? { ...current, credit: e.target.value, debit: e.target.value ? "" : current.debit } : current))} /></div>
                  <div className="space-y-2"><Label>Line Description</Label><Input value={line.description} onChange={(e) => setLines(lines.map((current, i) => i === index ? { ...current, description: e.target.value } : current))} /></div>
                  <Button variant="ghost" onClick={() => setLines(lines.filter((_, i) => i !== index))} disabled={lines.length <= 2}>Remove</Button>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between rounded-lg bg-muted/40 p-3 text-sm">
              <div className="flex gap-6">
                <span>Total Debit: <strong>{formatCurrency(totalDebit)}</strong></span>
                <span>Total Credit: <strong>{formatCurrency(totalCredit)}</strong></span>
              </div>
              <span className={balanced ? "text-emerald-600 font-medium" : "text-destructive font-medium"}>{balanced ? "Balanced" : "Not Balanced"}</span>
            </div>

            <div className="flex items-center justify-between">
              <Button variant="outline" onClick={() => setLines([...lines, { ...emptyLine }])}>Add Line</Button>
              <Button onClick={() => createMutation.mutate()} disabled={!balanced || createMutation.isPending || lines.some((line) => !line.account_id)}>
                {createMutation.isPending ? "Saving..." : "Create Entry"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <div className="bg-card rounded-lg border border-border overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-muted-foreground">Loading...</div>
        ) : entries.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">No journal entries yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground">Entry #</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground">Date</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground">Type</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground">Description</th>
                  <th className="text-right px-5 py-3 text-xs font-medium text-muted-foreground">Debit</th>
                  <th className="text-right px-5 py-3 text-xs font-medium text-muted-foreground">Credit</th>
                  <th className="text-right px-5 py-3 text-xs font-medium text-muted-foreground"></th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry: any) => {
                  const lineItems = normalizeJournalLines(entry);
                  const entryDebit = lineItems.reduce((sum: number, line: any) => sum + Number(line.debit || 0), 0);
                  const entryCredit = lineItems.reduce((sum: number, line: any) => sum + Number(line.credit || 0), 0);
                  return (
                    <tr key={entry.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-5 py-3 font-medium text-primary">{entry.document_number}</td>
                      <td className="px-5 py-3 text-muted-foreground">{entry.date}</td>
                      <td className="px-5 py-3"><StatusBadge status={entry.journal_type} /></td>
                      <td className="px-5 py-3 text-card-foreground">{entry.description || "-"}</td>
                      <td className="px-5 py-3 text-right font-medium text-card-foreground">{formatCurrency(entryDebit)}</td>
                      <td className="px-5 py-3 text-right font-medium text-card-foreground">{formatCurrency(entryCredit)}</td>
                      <td className="px-5 py-3 text-right"><Button variant="ghost" size="sm" onClick={() => { if (confirm("Delete this journal entry?")) deleteMutation.mutate(entry.id); }}>Delete</Button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <AppPagination currentPage={response.pagination.page} totalPages={response.pagination.totalPages} totalRecords={response.pagination.total} onPageChange={setPage} />
    </div>
  );
}
