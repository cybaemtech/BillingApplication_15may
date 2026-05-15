import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { posSessionsApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { StatusBadge } from "@/components/StatusBadge";
import { AppPagination } from "@/components/AppPagination";
import { emptyPaginatedResponse } from "@/lib/pagination";
import { useNavigate } from "react-router-dom";

export default function POSSessionsPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [openingBalance, setOpeningBalance] = useState("0");
  const [page, setPage] = useState(1);

  const { data: response = emptyPaginatedResponse<any>(), isLoading } = useQuery({
    queryKey: ["pos_sessions", page],
    queryFn: () => posSessionsApi.listPage(page),
  });
  const sessions = response.data;

  const createMut = useMutation({
    mutationFn: () => posSessionsApi.create({ opening_balance: Number(openingBalance) || 0 }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["pos_sessions"] }); setOpen(false); toast({ title: "Session opened" }); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const closeMut = useMutation({
    mutationFn: (id: string) => posSessionsApi.update(id, { status: "closed", closed_at: new Date().toISOString() }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["pos_sessions"] }); toast({ title: "Session closed" }); },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">POS Sessions</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm"><Plus className="w-4 h-4 mr-1" /> Open Session</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Open POS Session</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <Input placeholder="Opening Cash Balance" type="number" value={openingBalance} onChange={(e) => setOpeningBalance(e.target.value)} />
              <Button onClick={() => createMut.mutate()} className="w-full">Open Session</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <div className="border border-border rounded-lg overflow-hidden">
        <Table>
          <TableHeader><TableRow>
            <TableHead>Opened At</TableHead><TableHead>Opening Balance</TableHead><TableHead>Total Sales</TableHead>
            <TableHead>Status</TableHead><TableHead></TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {isLoading ? <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow> :
            sessions.length === 0 ? <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No sessions</TableCell></TableRow> :
            sessions.map((s: any) => (
              <TableRow key={s.id} className="cursor-pointer hover:bg-muted/30" onClick={() => navigate(`/pos/sessions/${s.id}`)}>
                <TableCell className="font-medium">{new Date(s.opened_at || s.openedAt).toLocaleString()}</TableCell>
                <TableCell>₹{Number(s.opening_balance || s.openingBalance).toLocaleString()}</TableCell>
                <TableCell>₹{Number(s.total_sales || s.totalSales || 0).toLocaleString()}</TableCell>
                <TableCell><StatusBadge status={s.status === "open" ? "confirmed" : "closed"} /></TableCell>
                <TableCell>
                  {s.status === "open" && <Button size="sm" variant="outline" onClick={(event) => { event.stopPropagation(); closeMut.mutate(s.id); }}>Close</Button>}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <AppPagination currentPage={response.pagination.page} totalPages={response.pagination.totalPages} totalRecords={response.pagination.total} onPageChange={setPage} />
    </div>
  );
}
