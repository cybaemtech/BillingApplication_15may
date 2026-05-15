import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/PageHeader";
import { paymentsReceivedApi, paymentsMadeApi } from "@/lib/api";
import { useState } from "react";
import { AppPagination } from "@/components/AppPagination";
import { paginateArray } from "@/lib/pagination";

export default function CashFlowPage() {
  const { data: received = [] } = useQuery({ queryKey: ["payments_received"], queryFn: paymentsReceivedApi.list });
  const { data: made = [] } = useQuery({ queryKey: ["payments_made"], queryFn: paymentsMadeApi.list });
  const [receivedPage, setReceivedPage] = useState(1);
  const [madePage, setMadePage] = useState(1);
  const paginatedReceived = paginateArray(received, receivedPage);
  const paginatedMade = paginateArray(made, madePage);

  const totalIn = received.reduce((s: number, p: any) => s + Number(p.amount), 0);
  const totalOut = made.reduce((s: number, p: any) => s + Number(p.amount), 0);
  const netCash = totalIn - totalOut;

  return (
    <div>
      <PageHeader title="Cash Flow Statement" subtitle="Cash movement analysis" />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-card rounded-lg border border-border p-5">
          <p className="text-xs text-muted-foreground">Cash Inflow</p>
          <p className="text-2xl font-bold text-primary mt-1">₹{totalIn.toLocaleString()}</p>
        </div>
        <div className="bg-card rounded-lg border border-border p-5">
          <p className="text-xs text-muted-foreground">Cash Outflow</p>
          <p className="text-2xl font-bold text-destructive mt-1">₹{totalOut.toLocaleString()}</p>
        </div>
        <div className={`rounded-lg border border-border p-5 ${netCash >= 0 ? "bg-primary/5" : "bg-destructive/5"}`}>
          <p className="text-xs text-muted-foreground">Net Cash Flow</p>
          <p className={`text-2xl font-bold mt-1 ${netCash >= 0 ? "text-primary" : "text-destructive"}`}>₹{Math.abs(netCash).toLocaleString()}</p>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-lg border border-border">
          <div className="px-5 py-4 border-b border-border"><h3 className="text-sm font-semibold text-card-foreground">Recent Inflows</h3></div>
          {received.length === 0 ? <div className="p-8 text-center text-muted-foreground text-sm">No inflows.</div> : (
            <div className="divide-y divide-border">
              {paginatedReceived.data.map((p: any) => (
                <div key={p.id} className="flex justify-between px-5 py-3">
                  <div><p className="text-sm text-card-foreground">{p.customers?.name}</p><p className="text-xs text-muted-foreground">{p.date}</p></div>
                  <span className="text-sm font-medium text-primary">+₹{Number(p.amount).toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
          <AppPagination currentPage={paginatedReceived.pagination.page} totalPages={paginatedReceived.pagination.totalPages} totalRecords={paginatedReceived.pagination.total} onPageChange={setReceivedPage} />
        </div>
        <div className="bg-card rounded-lg border border-border">
          <div className="px-5 py-4 border-b border-border"><h3 className="text-sm font-semibold text-card-foreground">Recent Outflows</h3></div>
          {made.length === 0 ? <div className="p-8 text-center text-muted-foreground text-sm">No outflows.</div> : (
            <div className="divide-y divide-border">
              {paginatedMade.data.map((p: any) => (
                <div key={p.id} className="flex justify-between px-5 py-3">
                  <div><p className="text-sm text-card-foreground">{p.vendors?.name}</p><p className="text-xs text-muted-foreground">{p.date}</p></div>
                  <span className="text-sm font-medium text-destructive">-₹{Number(p.amount).toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
          <AppPagination currentPage={paginatedMade.pagination.page} totalPages={paginatedMade.pagination.totalPages} totalRecords={paginatedMade.pagination.total} onPageChange={setMadePage} />
        </div>
      </div>
    </div>
  );
}
