import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { workflowsApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

const triggerOptions = [
  { value: "invoice_created", label: "Invoice Created" },
  { value: "payment_received", label: "Payment Received" },
  { value: "invoice_overdue", label: "Invoice Overdue" },
  { value: "low_stock", label: "Low Stock Alert" },
  { value: "bill_due", label: "Bill Due" },
];

export default function WorkflowsPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", trigger: "invoice_created" });

  const { data: workflows = [], isLoading } = useQuery({
    queryKey: ["workflows"],
    queryFn: () => workflowsApi.list(),
  });

  const createMut = useMutation({
    mutationFn: () => workflowsApi.create({
      name: form.name,
      trigger: form.trigger,
      conditions: [],
      actions: [],
      status: "active",
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["workflows"] });
      setOpen(false);
      setForm({ name: "", trigger: "invoice_created" });
      toast({ title: "Workflow created" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: any }) => workflowsApi.update(id, updates),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["workflows"] });
      toast({ title: "Workflow updated" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => workflowsApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["workflows"] });
      toast({ title: "Workflow deleted" });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Workflows</h1>
          <p className="text-sm text-muted-foreground mt-1">Create lightweight automation rules for common billing events.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm"><Plus className="w-4 h-4 mr-1" /> New Workflow</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New Workflow</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <Input placeholder="Workflow Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <Select value={form.trigger} onValueChange={(v) => setForm({ ...form, trigger: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {triggerOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={() => createMut.mutate()} disabled={!form.name || createMut.isPending} className="w-full">
                {createMut.isPending ? "Creating..." : "Create"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border border-border rounded-lg overflow-hidden bg-card">
        <Table>
          <TableHeader><TableRow>
            <TableHead>Name</TableHead><TableHead>Trigger</TableHead><TableHead>Status</TableHead><TableHead>Active</TableHead><TableHead></TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {isLoading ? <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow> :
            workflows.length === 0 ? <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No workflows</TableCell></TableRow> :
            workflows.map((workflow: any) => {
              const triggerLabel = triggerOptions.find((option) => option.value === workflow.trigger)?.label || String(workflow.trigger || "-").replace(/_/g, " ");
              const isActive = String(workflow.status || "active").toLowerCase() === "active";
              return (
                <TableRow key={workflow.id}>
                  <TableCell className="font-medium">{workflow.name}</TableCell>
                  <TableCell className="capitalize">{triggerLabel}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={isActive ? "border-emerald-200 text-emerald-700 bg-emerald-50" : "border-slate-200 text-slate-700 bg-slate-50"}>
                      {workflow.status || "active"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Switch checked={isActive} onCheckedChange={(checked) => updateMut.mutate({ id: workflow.id, updates: { status: checked ? "active" : "inactive" } })} />
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => deleteMut.mutate(workflow.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
