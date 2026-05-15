import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { gstSettingsApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export default function GSTSettingsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: settings, isLoading } = useQuery({ queryKey: ["gst_settings"], queryFn: gstSettingsApi.get });

  const [form, setForm] = useState<any>(null);
  const loaded = form || settings || {};

  const mutation = useMutation({
    mutationFn: (data: any) => gstSettingsApi.upsert(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["gst_settings"] }); toast({ title: "GST settings saved" }); },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    mutation.mutate({
      gstin: fd.get("gstin") as string,
      legal_name: fd.get("legal_name") as string,
      trade_name: fd.get("trade_name") as string,
      state: fd.get("state") as string,
      state_code: fd.get("state_code") as string,
    });
  };

  if (isLoading) return <div className="p-12 text-center text-muted-foreground">Loading...</div>;

  return (
    <div>
      <PageHeader title="GST Settings" subtitle="Configure GST/tax details" />
      <div className="bg-card rounded-lg border border-border p-6 max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2"><Label>GSTIN</Label><Input name="gstin" defaultValue={loaded.gstin || ""} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Legal Name</Label><Input name="legal_name" defaultValue={loaded.legal_name || ""} /></div>
            <div className="space-y-2"><Label>Trade Name</Label><Input name="trade_name" defaultValue={loaded.trade_name || ""} /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>State</Label><Input name="state" defaultValue={loaded.state || ""} /></div>
            <div className="space-y-2"><Label>State Code</Label><Input name="state_code" defaultValue={loaded.state_code || ""} /></div>
          </div>
          <Button type="submit" disabled={mutation.isPending}>{mutation.isPending ? "Saving..." : "Save Settings"}</Button>
        </form>
      </div>
    </div>
  );
}
