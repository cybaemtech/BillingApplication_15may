import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Boxes, Package } from "lucide-react";
import { itemCategoriesApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/PageHeader";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
}

export default function CategoryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: category, isLoading } = useQuery({
    queryKey: ["item_category", id],
    queryFn: () => itemCategoriesApi.get(id!),
    enabled: !!id,
  });

  if (isLoading) {
    return <div className="p-8 text-muted-foreground">Loading...</div>;
  }

  if (!category) {
    return <div className="p-8 text-muted-foreground">Category not found.</div>;
  }

  return (
    <div className="space-y-6">
      <Button variant="outline" onClick={() => navigate("/inventory/categories")}>
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Categories
      </Button>

      <PageHeader title={category.name} subtitle={category.description || "No description available"} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-card rounded-lg border border-border p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-3 text-primary">
              <Boxes className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Items In Category</p>
              <p className="text-2xl font-semibold text-card-foreground">{Number(category.item_count || 0)}</p>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-lg border border-border p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-muted p-3 text-foreground">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Created</p>
              <p className="text-lg font-semibold text-card-foreground">
                {category.created_at ? new Date(category.created_at).toLocaleDateString() : "-"}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-lg border border-border overflow-hidden">
        {category.items?.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">No items found under this category.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground">Item</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground">SKU</th>
                  <th className="text-right px-5 py-3 text-xs font-medium text-muted-foreground">Purchase Price</th>
                  <th className="text-right px-5 py-3 text-xs font-medium text-muted-foreground">Selling Price</th>
                  <th className="text-right px-5 py-3 text-xs font-medium text-muted-foreground">Stock</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {category.items.map((item: any) => (
                  <tr
                    key={item.id}
                    className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors cursor-pointer"
                    onClick={() => navigate(`/inventory/items/${item.id}`)}
                  >
                    <td className="px-5 py-3 font-medium text-card-foreground">{item.name}</td>
                    <td className="px-5 py-3 text-muted-foreground">{item.sku || "-"}</td>
                    <td className="px-5 py-3 text-right text-card-foreground">{formatCurrency(Number(item.purchase_rate || 0))}</td>
                    <td className="px-5 py-3 text-right text-card-foreground">{formatCurrency(Number(item.selling_rate || 0))}</td>
                    <td className="px-5 py-3 text-right text-muted-foreground">{Number(item.current_stock || 0)} {item.unit || ""}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${item.is_active === false ? "bg-destructive/10 text-destructive" : "bg-emerald-500/10 text-emerald-600"}`}>
                        {item.is_active === false ? "Inactive" : "Active"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
