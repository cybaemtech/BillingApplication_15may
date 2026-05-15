import { type ReactNode, useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowUpRight,
  BarChart3,
  BadgeCheck,
  Ban,
  Building2,
  Check,
  CircleDollarSign,
  CreditCard,
  Crown,
  Download,
  Eye,
  Edit2,
  Gauge,
  HardDriveDownload,
  IndianRupee,
  Loader2,
  RefreshCw,
  Rocket,
  Search,
  Settings2,
  Shield,
  ShieldCheck,
  Sparkles,
  Trash2,
  UserCog,
  Users,
  X,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { featureAccessApi, subscriptionApi } from "@/lib/api";

declare global {
  interface Window {
    Razorpay?: any;
  }
}

function loadRazorpayScript() {
  return new Promise<boolean>((resolve) => {
    if (window.Razorpay) { resolve(true); return; }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

// ========== PLAN FEATURE DEFINITIONS ==========
const PLAN_FEATURES: Record<string, { included: string[]; excluded: string[] }> = {
  Free: {
    included: ["5 Invoices/month", "1 User", "Basic reports", "Email support"],
    excluded: ["No E-Invoice", "No WhatsApp", "No POS"],
  },
  Basic: {
    included: ["100 Invoices/month", "5 Users", "GST returns (GSTR-1, GSTR-3B)", "E-Invoice & E-Way Bill", "Email + WhatsApp notifications", "Advanced reports"],
    excluded: ["No POS", "Limited inventory"],
  },
  Pro: {
    included: ["Unlimited Invoices", "Unlimited Users", "All GST features", "POS Module", "Full Inventory management", "Multi-warehouse", "Custom invoice templates", "Priority support", "API access", "Data backup & restore"],
    excluded: [],
  },
};

const PLAN_PRICES: Record<string, number> = { Free: 0, Basic: 999, Pro: 2499 };
const TENANTS_PAGE_SIZE = 8;

type StatusTone = "green" | "amber" | "slate" | "blue" | "purple" | "red";

function StatusPill({ tone, children, className = "" }: { tone: StatusTone; children: ReactNode; className?: string }) {
  const classes: Record<StatusTone, string> = {
    green: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
    amber: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
    slate: "bg-slate-500/10 text-slate-600 dark:text-slate-400",
    blue: "bg-blue-500/15 text-blue-700 dark:text-blue-400",
    purple: "bg-purple-500/15 text-purple-700 dark:text-purple-400",
    red: "bg-red-500/15 text-red-700 dark:text-red-400",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold tracking-wide ${classes[tone]} ${className}`}>
      {children}
    </span>
  );
}

function getEffectiveSubscriptionStatus(org: any) {
  const rawStatus = String(org?.subscription_status || "inactive").toLowerCase();
  const endDate = org?.subscription_end_date ? new Date(org.subscription_end_date) : null;
  const now = new Date();

  if (rawStatus === "trial") return "trial";
  if (rawStatus === "suspended") return "suspended";
  if (rawStatus === "inactive") return "inactive";
  if (endDate && !Number.isNaN(endDate.getTime()) && endDate < now) return "expired";
  return rawStatus || "inactive";
}

function getSubscriptionTone(status: string): StatusTone {
  if (status === "active") return "green";
  if (status === "trial") return "blue";
  if (status === "expired") return "amber";
  if (status === "suspended") return "red";
  return "slate";
}

// ========== PLAN FEATURE MANAGEMENT DIALOG ==========
const MODULE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  Dashboard: { bg: "bg-blue-500/10", text: "text-blue-600", border: "border-blue-200/60 dark:border-blue-500/20" },
  Sales: { bg: "bg-emerald-500/10", text: "text-emerald-600", border: "border-emerald-200/60 dark:border-emerald-500/20" },
  Purchase: { bg: "bg-amber-500/10", text: "text-amber-600", border: "border-amber-200/60 dark:border-amber-500/20" },
  Inventory: { bg: "bg-purple-500/10", text: "text-purple-600", border: "border-purple-200/60 dark:border-purple-500/20" },
  Accounting: { bg: "bg-sky-500/10", text: "text-sky-600", border: "border-sky-200/60 dark:border-sky-500/20" },
  GST: { bg: "bg-orange-500/10", text: "text-orange-600", border: "border-orange-200/60 dark:border-orange-500/20" },
  POS: { bg: "bg-pink-500/10", text: "text-pink-600", border: "border-pink-200/60 dark:border-pink-500/20" },
  Automation: { bg: "bg-indigo-500/10", text: "text-indigo-600", border: "border-indigo-200/60 dark:border-indigo-500/20" },
};

function PlanFeatureManagementDialog({
  configurablePlans,
  groupedFeatureCatalog,
  selectedFeaturePlan,
  selectedFeaturePlanId,
  setSelectedFeaturePlanId,
  updatePlanFeatures,
}: {
  configurablePlans: any[];
  groupedFeatureCatalog: Record<string, any[]>;
  selectedFeaturePlan: any;
  selectedFeaturePlanId: string | null;
  setSelectedFeaturePlanId: (id: string) => void;
  updatePlanFeatures: any;
}) {
  const [open, setOpen] = useState(false);
  const featuresEnabled = selectedFeaturePlan ? (selectedFeaturePlan.features || []).length : 0;
  const featuresTotal = Object.values(groupedFeatureCatalog).flat().length;

  return (
    <>
      {/* Trigger Card */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 p-5 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-white/15 p-2.5 backdrop-blur-sm">
                <Settings2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold">Plan Feature Management</h3>
                <p className="mt-0.5 text-sm text-white/70">Control which modules each subscription plan can access</p>
              </div>
            </div>
            <Button
              onClick={() => setOpen(true)}
              className="bg-white text-purple-700 hover:bg-white/90 font-semibold shadow-lg gap-2"
              size="sm"
            >
              <Settings2 className="h-3.5 w-3.5" />
              Manage Features
            </Button>
          </div>
          <div className="mt-4 flex items-center gap-6 text-sm text-white/80">
            <span>📦 {configurablePlans.length} Plans</span>
            <span>✅ {featuresEnabled} of {featuresTotal} features enabled</span>
            {updatePlanFeatures.isPending && <span className="flex items-center gap-1.5"><Loader2 className="h-3.5 w-3.5 animate-spin" />Saving…</span>}
          </div>
        </div>
        <div className="px-5 py-3 flex items-center gap-2">
          {configurablePlans.map((plan: any) => (
            <button
              key={plan.id}
              onClick={() => { setSelectedFeaturePlanId(plan.id); setOpen(true); }}
              className={`rounded-full px-3 py-1 text-xs font-medium border transition-all ${selectedFeaturePlanId === plan.id ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"}`}
            >
              {plan.name}
            </button>
          ))}
        </div>
      </div>

      {/* Popup Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 px-6 py-5 text-white flex-shrink-0">
            <div className="flex items-start justify-between gap-4">
              <div>
                <DialogTitle className="text-xl font-bold text-white">Plan Feature Management</DialogTitle>
                <DialogDescription className="mt-1 text-white/70">
                  Toggle modules for each subscription plan. Changes save instantly.
                </DialogDescription>
              </div>
              <div className="w-44 flex-shrink-0">
                <Select value={selectedFeaturePlan?.id || ""} onValueChange={setSelectedFeaturePlanId}>
                  <SelectTrigger className="bg-white/15 border-white/20 text-white backdrop-blur-sm">
                    <SelectValue placeholder="Select plan" />
                  </SelectTrigger>
                  <SelectContent>
                    {configurablePlans.map((plan: any) => (
                      <SelectItem key={plan.id} value={plan.id}>{plan.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {selectedFeaturePlan && (
              <div className="mt-3 flex items-center gap-4 text-sm text-white/80">
                <span className="font-medium text-white">{selectedFeaturePlan.name} Plan</span>
                <span>·</span>
                <span>{featuresEnabled} features active</span>
                {updatePlanFeatures.isPending && (
                  <span className="flex items-center gap-1.5 ml-auto">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Saving…
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Content - scrollable */}
          <div className="flex-1 overflow-y-auto p-6">
            {selectedFeaturePlan ? (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {Object.entries(groupedFeatureCatalog).map(([moduleName, items]) => {
                  const colors = MODULE_COLORS[moduleName] || { bg: "bg-slate-500/10", text: "text-slate-600", border: "border-slate-200/60 dark:border-slate-500/20" };
                  const checkedCount = (items as any[]).filter((f) => (selectedFeaturePlan.features || []).includes(f.key)).length;
                  const allChecked = checkedCount === items.length;
                  return (
                    <div key={moduleName} className={`rounded-xl border ${colors.border} bg-card overflow-hidden`}>
                      {/* Module header */}
                      <div className={`${colors.bg} px-4 py-3 flex items-center justify-between`}>
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-semibold ${colors.text}`}>{moduleName}</span>
                          <span className="rounded-full bg-white/60 dark:bg-black/20 px-1.5 py-0.5 text-[10px] font-medium text-foreground/70">
                            {checkedCount}/{items.length}
                          </span>
                        </div>
                        {/* Select All toggle */}
                        <button
                          className={`text-[10px] font-medium ${colors.text} hover:opacity-70 transition-opacity`}
                          onClick={() => {
                            const current = selectedFeaturePlan.features || [];
                            const moduleKeys = (items as any[]).map((f) => f.key);
                            const next = allChecked
                              ? current.filter((k: string) => !moduleKeys.includes(k))
                              : [...new Set([...current, ...moduleKeys])];
                            updatePlanFeatures.mutate({ planId: selectedFeaturePlan.id, featureKeys: next });
                          }}
                        >
                          {allChecked ? "Deselect all" : "Select all"}
                        </button>
                      </div>
                      {/* Features */}
                      <div className="p-3 space-y-1">
                        {(items as any[]).map((feature) => {
                          const checked = (selectedFeaturePlan.features || []).includes(feature.key);
                          return (
                            <label
                              key={feature.key}
                              className={`flex items-center justify-between gap-3 rounded-lg px-3 py-2 cursor-pointer transition-colors ${checked ? `${colors.bg} bg-opacity-50` : "hover:bg-muted/40"}`}
                            >
                              <span className={`text-sm ${checked ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                                {feature.label}
                              </span>
                              <div className="relative flex-shrink-0">
                                <input
                                  type="checkbox"
                                  className="sr-only"
                                  checked={checked}
                                  disabled={updatePlanFeatures.isPending}
                                  onChange={(e) => {
                                    const current = selectedFeaturePlan.features || [];
                                    const next = e.target.checked
                                      ? [...current, feature.key]
                                      : current.filter((key: string) => key !== feature.key);
                                    updatePlanFeatures.mutate({ planId: selectedFeaturePlan.id, featureKeys: next });
                                  }}
                                />
                                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${checked ? `${colors.bg} ${colors.text} border-current` : "border-muted-foreground/30"}`}>
                                  {checked && (
                                    <svg className="w-3 h-3" viewBox="0 0 12 12" fill="currentColor">
                                      <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                                    </svg>
                                  )}
                                </div>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex items-center justify-center h-40 text-muted-foreground">
                Select a plan to manage its features.
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function PlanPricingManagementDialog({
  plans,
}: {
  plans: any[];
}) {
  const [open, setOpen] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ price: "", invoice_limit: "", user_limit: "" });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // On plan selection, load data
  useEffect(() => {
    if (selectedPlanId) {
      const p = plans.find((x) => x.id === selectedPlanId);
      if (p) {
        setFormData({
          price: p.price?.toString() || "0",
          invoice_limit: p.invoice_limit == null ? "" : p.invoice_limit.toString(),
          user_limit: p.user_limit == null ? "" : p.user_limit.toString(),
        });
      }
    } else if (plans?.length > 0) {
      setSelectedPlanId(plans[0].id);
    }
  }, [selectedPlanId, plans]);

  const updatePlanMutation = useMutation({
    mutationFn: async (payload: { id: string; price: number; invoice_limit: number | null; user_limit: number | null }) => {
      const res = await subscriptionApi.updatePlan(payload.id, payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscription_plans"] });
      toast({ title: "Plan updated", description: "Pricing and limits updated successfully." });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err?.response?.data?.error || err.message, variant: "destructive" });
    },
  });

  const handleSave = () => {
    if (!selectedPlanId) return;
    updatePlanMutation.mutate({
      id: selectedPlanId,
      price: Number(formData.price),
      invoice_limit: formData.invoice_limit ? Number(formData.invoice_limit) : null,
      user_limit: formData.user_limit ? Number(formData.user_limit) : null,
    });
  };

  const selectedPlan = plans.find((p) => p.id === selectedPlanId);

  return (
    <>
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 p-5 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-white/15 p-2.5 backdrop-blur-sm">
                <CircleDollarSign className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold">Plan Pricing & Details</h3>
                <p className="mt-0.5 text-sm text-white/70">Manage subscription prices, user limits, and invoice quotas</p>
              </div>
            </div>
            <Button
              onClick={() => setOpen(true)}
              className="bg-white text-teal-700 hover:bg-white/90 font-semibold shadow-lg gap-2"
              size="sm"
            >
              <CircleDollarSign className="h-3.5 w-3.5" />
              Manage Pricing
            </Button>
          </div>
          <div className="mt-4 flex items-center gap-6 text-sm text-white/80">
            <span>📦 {plans.length} Configurable Plans</span>
          </div>
        </div>
        <div className="px-5 py-3 flex items-center gap-2">
          {plans.map((plan: any) => (
            <button
              key={plan.id}
              onClick={() => { setSelectedPlanId(plan.id); setOpen(true); }}
              className={`rounded-full px-3 py-1 text-xs font-medium border transition-all ${selectedPlanId === plan.id ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"}`}
            >
              {plan.name}
            </button>
          ))}
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 px-6 py-5 text-white flex-shrink-0">
            <div className="flex items-start justify-between gap-4">
              <div>
                <DialogTitle className="text-xl font-bold text-white">Plan Pricing Management</DialogTitle>
                <DialogDescription className="mt-1 text-white/70">
                  Configure subscription prices and limits globally.
                </DialogDescription>
              </div>
              <div className="w-44 flex-shrink-0">
                <Select value={selectedPlanId || ""} onValueChange={setSelectedPlanId}>
                  <SelectTrigger className="bg-white/15 border-white/20 text-white backdrop-blur-sm">
                    <SelectValue placeholder="Select plan" />
                  </SelectTrigger>
                  <SelectContent>
                    {plans.map((plan: any) => (
                      <SelectItem key={plan.id} value={plan.id}>{plan.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {selectedPlan ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Plan Price (₹)</label>
                    <Input
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      placeholder="e.g. 0, 999"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">User Limit</label>
                    <Input
                      type="number"
                      value={formData.user_limit}
                      onChange={(e) => setFormData({ ...formData, user_limit: e.target.value })}
                      placeholder="Leave empty for unlimited"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Invoice Limit</label>
                    <Input
                      type="number"
                      value={formData.invoice_limit}
                      onChange={(e) => setFormData({ ...formData, invoice_limit: e.target.value })}
                      placeholder="Leave empty for unlimited"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <Button onClick={handleSave} disabled={updatePlanMutation.isPending}>
                    {updatePlanMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Pricing & Limits
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-10">Select a plan to configure</div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Super admin email constant
const SUPER_ADMIN_EMAIL = "ganesh@gmail.com";

export default function SubscriptionSaaSSection() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { userRole, user } = useAuth();
  const normalizedRole = String(userRole || user?.role || "").toUpperCase();
  const isAdmin = normalizedRole === "ADMIN" || normalizedRole === "SUPER_ADMIN";
  const isSuperAdmin = normalizedRole === "SUPER_ADMIN" || user?.email?.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();
  const [upgradingPlan, setUpgradingPlan] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const [editingOrgId, setEditingOrgId] = useState<string | null>(null);
  const [editOrgForm, setEditOrgForm] = useState<any>(null);
  const [showPlans, setShowPlans] = useState(false);
  const [tenantPage, setTenantPage] = useState(1);
  const [selectedFeaturePlanId, setSelectedFeaturePlanId] = useState<string | null>(null);
  const [detailsPlanName, setDetailsPlanName] = useState<string | null>(null);

  const { data: subscription } = useQuery({
    queryKey: ["subscription_current"],
    queryFn: subscriptionApi.current,
    retry: false,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });
  const { data: plansData } = useQuery({
    queryKey: ["subscription_plans"],
    queryFn: subscriptionApi.plans,
    retry: false,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });
  const { data: overview } = useQuery({
    queryKey: ["subscription_overview"],
    queryFn: subscriptionApi.overview,
    retry: false,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });
  const { data: organizationsData } = useQuery({
    queryKey: ["subscription_organizations"],
    queryFn: subscriptionApi.organizations,
    enabled: isSuperAdmin || isAdmin,
    retry: false,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });
  const { data: planFeatureData } = useQuery({
    queryKey: ["plan_features"],
    queryFn: featureAccessApi.planFeatures,
    enabled: isSuperAdmin,
    retry: false,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });

  const confirmUpgrade = useMutation({
    mutationFn: (planName: string) => subscriptionApi.confirmUpgrade(planName),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["subscription_current"] });
      await queryClient.invalidateQueries({ queryKey: ["subscription_plans"] });
      await queryClient.invalidateQueries({ queryKey: ["subscription_overview"] });
      await queryClient.invalidateQueries({ queryKey: ["subscription_organizations"] });
      await queryClient.invalidateQueries({ queryKey: ["plan_features"] });
      await queryClient.invalidateQueries({ queryKey: ["access_context"] });
      toast({ title: "🎉 Plan upgraded successfully!" });
    },
    onError: (error: any) => toast({ title: "Upgrade failed", description: error.message, variant: "destructive" }),
  });

  const updateOrganizationStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => subscriptionApi.updateOrganizationStatus(id, status),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["subscription_organizations"] });
      toast({ title: "Company status updated" });
    },
    onError: (error: any) => toast({ title: "Status update failed", description: error.message, variant: "destructive" }),
  });

  const assignOrganizationPlan = useMutation({
    mutationFn: ({ id, planName }: { id: string; planName: string }) => subscriptionApi.assignOrganizationPlan(id, planName),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["subscription_organizations"] });
      await queryClient.invalidateQueries({ queryKey: ["subscription_plans"] });
      await queryClient.invalidateQueries({ queryKey: ["subscription_current"] });
      await queryClient.invalidateQueries({ queryKey: ["subscription_overview"] });
      await queryClient.invalidateQueries({ queryKey: ["access_context"] });
      toast({ title: "Company plan updated" });
    },
    onError: (error: any) => toast({ title: "Plan update failed", description: error.message, variant: "destructive" }),
  });
  const updateOrganization = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) => subscriptionApi.updateOrganization(id, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["subscription_organizations"] });
      await queryClient.invalidateQueries({ queryKey: ["subscription_current"] });
      await queryClient.invalidateQueries({ queryKey: ["subscription_overview"] });
      await queryClient.invalidateQueries({ queryKey: ["company"] });
      await queryClient.invalidateQueries({ queryKey: ["gst_settings"] });
      await queryClient.invalidateQueries({ queryKey: ["invoice_settings"] });
      setEditingOrgId(null);
      setEditOrgForm(null);
      toast({ title: "Company updated" });
    },
    onError: (error: any) => toast({ title: "Update failed", description: error.message, variant: "destructive" }),
  });
  const deleteOrganization = useMutation({
    mutationFn: (id: string) => subscriptionApi.deleteOrganization(id),
    onSuccess: async (_data, id) => {
      await queryClient.invalidateQueries({ queryKey: ["subscription_organizations"] });
      await queryClient.invalidateQueries({ queryKey: ["subscription_current"] });
      await queryClient.invalidateQueries({ queryKey: ["subscription_overview"] });
      await queryClient.invalidateQueries({ queryKey: ["company"] });
      await queryClient.invalidateQueries({ queryKey: ["gst_settings"] });
      await queryClient.invalidateQueries({ queryKey: ["invoice_settings"] });
      setSelectedOrgId((current) => (current === id ? null : current));
      toast({ title: "Company deleted" });
    },
    onError: (error: any) => toast({ title: "Delete failed", description: error.message, variant: "destructive" }),
  });
  const updatePlanFeatures = useMutation({
    mutationFn: ({ planId, featureKeys }: { planId: string; featureKeys: string[] }) => featureAccessApi.updatePlanFeatures(planId, featureKeys),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["plan_features"] });
      await queryClient.invalidateQueries({ queryKey: ["subscription_plans"] });
      await queryClient.invalidateQueries({ queryKey: ["subscription_current"] });
      await queryClient.invalidateQueries({ queryKey: ["subscription_overview"] });
      await queryClient.invalidateQueries({ queryKey: ["access_context"] });
      toast({ title: "Plan features updated" });
    },
    onError: (error: any) => toast({ title: "Feature update failed", description: error.message, variant: "destructive" }),
  });

  const currentPlanName = subscription?.plan?.name || plansData?.currentPlan || "Free";
  const plans = plansData?.plans || [];
  const configurablePlans = planFeatureData?.plans || [];
  const featureCatalog = planFeatureData?.catalog || [];
  const organizations = organizationsData?.organizations || [];
  const users = overview?.users || [];
  const effectiveUsers = users.length > 0
    ? users
    : user
      ? [{ id: user.id, email: user.email, display_name: user.displayName || user.email, role: user.role || "viewer", is_active: true }]
      : [];

  const selectedOrg = organizations.find((o: any) => o.id === selectedOrgId) || null;
  const editingOrg = organizations.find((o: any) => o.id === editingOrgId) || null;
  const selectedFeaturePlan = configurablePlans.find((plan: any) => plan.id === selectedFeaturePlanId) || configurablePlans[0] || null;
  const livePlanByName = Object.fromEntries(plans.map((plan: any) => [String(plan.name || "").toLowerCase(), plan]));

  useEffect(() => {
    console.log("SubscriptionSaaSSection State:", { isSuperAdmin, isAdmin, organizationsLength: organizations.length });
    if (organizationsData) {
      console.log("organizationsData received:", organizationsData);
    }
  }, [isSuperAdmin, isAdmin, organizations, organizationsData]);

  const filteredOrganizations = organizations.filter((org: any) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      (org.company_name || "").toLowerCase().includes(term) ||
      (org.domain || "").toLowerCase().includes(term) ||
      (org.plan?.name || "").toLowerCase().includes(term)
    );
  });
  const groupedFeatureCatalog = featureCatalog.reduce((acc: Record<string, any[]>, feature: any) => {
    const module = feature.module || "General";
    if (!acc[module]) {
      acc[module] = [];
    }
    acc[module].push(feature);
    return acc;
  }, {});
  const tenantTotalPages = Math.max(1, Math.ceil(filteredOrganizations.length / TENANTS_PAGE_SIZE));
  const paginatedOrganizations = filteredOrganizations.slice(
    (tenantPage - 1) * TENANTS_PAGE_SIZE,
    tenantPage * TENANTS_PAGE_SIZE,
  );

  useEffect(() => {
    setTenantPage(1);
  }, [searchTerm]);

  useEffect(() => {
    if (tenantPage > tenantTotalPages) {
      setTenantPage(tenantTotalPages);
    }
  }, [tenantPage, tenantTotalPages]);

  useEffect(() => {
    if (!selectedFeaturePlanId && configurablePlans.length > 0) {
      setSelectedFeaturePlanId(configurablePlans[0].id);
    }
  }, [selectedFeaturePlanId, configurablePlans]);

  useEffect(() => {
    if (!editingOrg) return;
    setEditOrgForm({
      company_name: editingOrg.company_name || "",
      gstin: editingOrg.gstin || "",
      city: editingOrg.city || "",
      state: editingOrg.state || "",
      phone: editingOrg.phone || "",
      email: editingOrg.email || "",
      website: editingOrg.website || "",
      address: editingOrg.address || "",
      pincode: editingOrg.pincode || "",
      plan_name: editingOrg.plan?.name || "Free",
      status: editingOrg.subscription_status || "active",
      auto_renew: Boolean(editingOrg.auto_renew),
    });
  }, [editingOrgId]);

  // Compute super admin stats
  const totalTenants = organizations.length;
  const totalActiveUsers = organizations.reduce((sum: number, o: any) => sum + (o.accessSummary?.activeUsers || 0), 0);
  const totalInvoicesToday = organizations.reduce((sum: number, o: any) => sum + (o.usage?.invoices || 0), 0);
  const totalRevenue = organizations.reduce((sum: number, o: any) => {
    const planPrice = o.plan?.price || PLAN_PRICES[o.plan?.name] || 0;
    return sum + Number(planPrice);
  }, 0);

  const handleUpgrade = async (planName: string) => {
    setUpgradingPlan(planName);
    try {
      const orderResponse = await subscriptionApi.createRazorpayOrder(planName);
      const loaded = await loadRazorpayScript();
      if (!loaded || !window.Razorpay) throw new Error("Razorpay checkout script failed to load");
      const razorpay = new window.Razorpay({
        key: orderResponse.razorpayKeyId,
        order_id: orderResponse.order.id,
        name: "BillFlow",
        description: `Upgrade to ${planName}`,
        handler: async () => { await confirmUpgrade.mutateAsync(planName); },
        theme: { color: "#2563eb" },
      });
      razorpay.open();
    } catch (error: any) {
      if (String(error.message || "").includes("Razorpay is not configured")) {
        await confirmUpgrade.mutateAsync(planName);
      } else {
        toast({ title: "Upgrade failed", description: error.message, variant: "destructive" });
      }
    } finally {
      setUpgradingPlan(null);
    }
  };

  const handleSync = async () => {
    setIsSyncing(true);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["subscription_current"] }),
      queryClient.invalidateQueries({ queryKey: ["subscription_plans"] }),
      queryClient.invalidateQueries({ queryKey: ["subscription_overview"] }),
      queryClient.invalidateQueries({ queryKey: ["subscription_organizations"] }),
      queryClient.invalidateQueries({ queryKey: ["plan_features"] }),
      queryClient.invalidateQueries({ queryKey: ["access_context"] }),
    ]);
    setTimeout(() => setIsSyncing(false), 600);
    toast({ title: "Data synced" });
  };

  return (
    <div className="space-y-8">
      {/* ===== CURRENT SUBSCRIPTION BANNER (not for super admin) ===== */}
      {!isSuperAdmin && (
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-foreground">Current Subscription</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                You are on the <StatusPill tone={currentPlanName === "Pro" ? "purple" : currentPlanName === "Basic" ? "blue" : "amber"}>{currentPlanName}</StatusPill> plan
              </p>
              <div className="mt-3 space-y-1 text-sm text-muted-foreground">
                <p>Billing period: <span className="text-foreground font-medium">Monthly</span></p>
                <p>Next billing date: <span className="text-foreground font-medium">—</span></p>
                <p>Status: <StatusPill tone="green">Active</StatusPill></p>
              </div>
            </div>
            {isAdmin && (
              <Button
                variant={showPlans ? "outline" : "default"}
                size="sm"
                onClick={() => setShowPlans(!showPlans)}
                className="gap-1.5 shrink-0"
              >
                {showPlans ? <X className="h-3.5 w-3.5" /> : <ArrowUpRight className="h-3.5 w-3.5" />}
                {showPlans ? "Close" : "Upgrade Plan"}
              </Button>
            )}
          </div>
        </div>
      )}

      {/* ===== PRICING PLAN CARDS (shown on upgrade click, hidden for super admin) ===== */}
      {!isSuperAdmin && showPlans && (
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {(["Free", "Basic", "Pro"] as const).map((planName) => {
          const isCurrent = currentPlanName === planName;
          const isPopular = planName === "Basic";
          const livePlan = livePlanByName[planName.toLowerCase()] || {};
          const price = Number(livePlan.price ?? PLAN_PRICES[planName] ?? 0);
          const includedFeatures = Array.isArray(livePlan.included_features) && livePlan.included_features.length > 0
            ? livePlan.included_features
            : PLAN_FEATURES[planName].included;
          const excludedFeatures = Array.isArray(livePlan.excluded_features) && livePlan.excluded_features.length > 0
            ? livePlan.excluded_features.slice(0, PLAN_FEATURES[planName].excluded.length || 3)
            : PLAN_FEATURES[planName].excluded;
          const planIcons: Record<string, any> = { Free: Zap, Basic: Crown, Pro: Sparkles };
          const PlanIcon = planIcons[planName];

          return (
            <div
              key={planName}
              className={`relative flex flex-col rounded-2xl border-2 bg-card p-6 transition-all ${
                isPopular
                  ? "border-blue-500 shadow-lg shadow-blue-500/10"
                  : isCurrent
                  ? "border-primary/40"
                  : "border-border"
              }`}
            >
              {isPopular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white">Most Popular</span>
                </div>
              )}

              <div className="flex flex-col items-center text-center">
                <div className={`rounded-xl p-2.5 ${
                  planName === "Pro" ? "bg-purple-500/10 text-purple-600" :
                  planName === "Basic" ? "bg-blue-500/10 text-blue-600" :
                  "bg-slate-500/10 text-slate-600"
                }`}>
                  <PlanIcon className="h-6 w-6" />
                </div>
                <h3 className="mt-3 text-lg font-bold text-foreground">{planName}</h3>
                <div className="mt-2 flex items-baseline gap-0.5">
                  <span className="text-3xl font-extrabold text-foreground">₹{price.toLocaleString("en-IN")}</span>
                  <span className="text-sm text-muted-foreground">/month</span>
                </div>
              </div>

              <div className="mt-5 flex-1 space-y-2.5">
                {includedFeatures.slice(0, 5).map((f) => (
                  <div key={f} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 text-emerald-500 shrink-0" />
                    <span className="text-sm text-foreground">{f}</span>
                  </div>
                ))}
                {excludedFeatures.slice(0, 2).map((f) => (
                  <div key={f} className="flex items-start gap-2">
                    <X className="mt-0.5 h-4 w-4 text-muted-foreground/50 shrink-0" />
                    <span className="text-sm text-muted-foreground">{f}</span>
                  </div>
                ))}
                <button
                  className="pt-1 text-xs font-medium text-primary hover:underline"
                  onClick={() => setDetailsPlanName(planName)}
                >
                  View Details
                </button>
              </div>

              <div className="mt-5">
                {isCurrent ? (
                  <Button variant="outline" className="w-full" disabled>
                    Current Plan
                  </Button>
                ) : (
                  <Button
                    className={`w-full ${planName === "Basic" ? "bg-blue-600 hover:bg-blue-700" : ""}`}
                    variant={planName === "Pro" ? "default" : "outline"}
                    disabled={!isAdmin || upgradingPlan === planName || confirmUpgrade.isPending}
                    onClick={() => handleUpgrade(planName)}
                  >
                    {upgradingPlan === planName && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Upgrade
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
      )}

      {!isSuperAdmin && (
        <Dialog open={Boolean(detailsPlanName)} onOpenChange={(open) => { if (!open) setDetailsPlanName(null); }}>
          <DialogContent className="max-w-xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{detailsPlanName || "Plan"} Features</DialogTitle>
              <DialogDescription>Complete feature list for this subscription plan.</DialogDescription>
            </DialogHeader>
            {detailsPlanName && (() => {
              const detailsPlan = livePlanByName[detailsPlanName.toLowerCase()] || {};
              const allIncluded = Array.isArray(detailsPlan.included_features) && detailsPlan.included_features.length > 0
                ? detailsPlan.included_features
                : PLAN_FEATURES[detailsPlanName as "Free" | "Basic" | "Pro"].included;
              const allExcluded = Array.isArray(detailsPlan.excluded_features) && detailsPlan.excluded_features.length > 0
                ? detailsPlan.excluded_features
                : PLAN_FEATURES[detailsPlanName as "Free" | "Basic" | "Pro"].excluded;
              return (
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-semibold text-foreground mb-2">Included</h4>
                    <div className="space-y-2">
                      {allIncluded.map((feature: string) => (
                        <div key={feature} className="flex items-start gap-2 text-sm">
                          <Check className="mt-0.5 h-4 w-4 text-emerald-500 shrink-0" />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  {allExcluded.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-foreground mb-2">Not Included</h4>
                      <div className="space-y-2">
                        {allExcluded.map((feature: string) => (
                          <div key={feature} className="flex items-start gap-2 text-sm text-muted-foreground">
                            <X className="mt-0.5 h-4 w-4 shrink-0" />
                            <span>{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </DialogContent>
        </Dialog>
      )}

      {/* ===== SUPER ADMIN PANEL (only for super admin) ===== */}
      {isSuperAdmin && (
        <div className="space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-foreground">Super Admin Panel</h2>
              <p className="text-sm text-muted-foreground">Manage all tenants and platform controls</p>
            </div>
            <Button variant="outline" size="sm" onClick={handleSync} disabled={isSyncing} className="gap-2 shrink-0">
              <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? "animate-spin" : ""}`} />
              Sync
            </Button>
          </div>

          {/* Super Admin Metrics */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-blue-500/10 p-2.5"><Building2 className="h-5 w-5 text-blue-600" /></div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{totalTenants || organizations.length}</p>
                  <p className="text-xs text-muted-foreground">Total Tenants</p>
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-emerald-500/10 p-2.5"><Users className="h-5 w-5 text-emerald-600" /></div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{totalActiveUsers || effectiveUsers.length}</p>
                  <p className="text-xs text-muted-foreground">Active Users</p>
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-amber-500/10 p-2.5"><IndianRupee className="h-5 w-5 text-amber-600" /></div>
                <div>
                  <p className="text-2xl font-bold text-foreground">₹{(totalRevenue).toLocaleString("en-IN")}</p>
                  <p className="text-xs text-muted-foreground">Revenue (MTD)</p>
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-purple-500/10 p-2.5"><BarChart3 className="h-5 w-5 text-purple-600" /></div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{totalInvoicesToday}</p>
                  <p className="text-xs text-muted-foreground">Invoices Today</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search tenants..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button variant="outline" size="sm" className="gap-1.5">
                <Download className="h-3.5 w-3.5" />
                Export
              </Button>
            </div>

            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Company</th>
                    <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Subdomain</th>
                    <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Plan</th>
                    <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                    <th className="text-right px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Users</th>
                    <th className="text-right px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Invoices</th>
                    <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Created</th>
                    <th className="text-right px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrganizations.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                        {searchTerm ? "No matching tenants found." : "No organizations found. Run the seed script to populate demo data."}
                      </td>
                    </tr>
                  ) : paginatedOrganizations.map((org: any) => {
                    const status = getEffectiveSubscriptionStatus(org);
                    const statusTone = getSubscriptionTone(status);
                    const planTone: StatusTone = org.plan?.name === "Pro" ? "purple" : org.plan?.name === "Basic" ? "blue" : "slate";
                    return (
                      <tr key={org.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-3">
                          <button onClick={() => setSelectedOrgId(org.id)} className="text-primary hover:underline font-medium text-left">
                            {org.company_name || "—"}
                          </button>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{org.domain || "—"}</td>
                        <td className="px-4 py-3"><StatusPill tone={planTone}>{org.plan?.name || "Free"}</StatusPill></td>
                        <td className="px-4 py-3"><StatusPill tone={statusTone}>{status}</StatusPill></td>
                        <td className="px-4 py-3 text-right text-foreground font-medium">{org.accessSummary?.totalUsers || 0}</td>
                        <td className="px-4 py-3 text-right text-foreground font-medium">{org.usage?.invoices || 0}</td>
                        <td className="px-4 py-3 text-muted-foreground">{org.created_at ? new Date(org.created_at).toLocaleDateString("en-CA") : "—"}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => { setSelectedOrgId(org.id); setEditingOrgId(org.id); }} title="Edit company">
                              <Edit2 className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setSelectedOrgId(org.id)} title="View details">
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-red-500 hover:text-red-600"
                              title="Delete company"
                              onClick={() => {
                                if (window.confirm(`Delete ${org.company_name || "this company"}? This will remove the tenant and its data.`)) {
                                  deleteOrganization.mutate(org.id);
                                }
                              }}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3 text-sm">
              <p className="text-muted-foreground">
                Showing {filteredOrganizations.length === 0 ? 0 : (tenantPage - 1) * TENANTS_PAGE_SIZE + 1} to {Math.min(tenantPage * TENANTS_PAGE_SIZE, filteredOrganizations.length)} of {filteredOrganizations.length} companies
              </p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled={tenantPage <= 1} onClick={() => setTenantPage((page) => Math.max(1, page - 1))}>
                  Previous
                </Button>
                <span className="text-muted-foreground">Page {tenantPage} / {tenantTotalPages}</span>
                <Button variant="outline" size="sm" disabled={tenantPage >= tenantTotalPages} onClick={() => setTenantPage((page) => Math.min(tenantTotalPages, page + 1))}>
                  Next
                </Button>
              </div>
            </div>
          </div>

          {/* Organization Detail Modal / Inline */}
          <Dialog open={!!selectedOrg} onOpenChange={(open) => { if (!open) setSelectedOrgId(null); }}>
            <DialogContent className="max-w-5xl max-h-[85vh] overflow-y-auto">
              {selectedOrg && (
            <div className="space-y-5">
                <DialogHeader className="pr-8">
                <DialogTitle>{selectedOrg.company_name || "Company details"}</DialogTitle>
                <DialogDescription>
                  Review company details, subscription status, and activation controls for this company.
                </DialogDescription>
              </DialogHeader>

              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-bold text-foreground">{selectedOrg.company_name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {selectedOrg.domain || "No domain"} · {selectedOrg.city || "—"}, {selectedOrg.state || "—"}
                  </p>
                  {selectedOrg.gstin && <p className="text-xs text-muted-foreground mt-1">GSTIN: {selectedOrg.gstin}</p>}
                  {selectedOrg.email && <p className="text-xs text-muted-foreground">Email: {selectedOrg.email}</p>}
                  {selectedOrg.phone && <p className="text-xs text-muted-foreground">Phone: {selectedOrg.phone}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <StatusPill tone={selectedOrg.plan?.name === "Pro" ? "purple" : selectedOrg.plan?.name === "Basic" ? "blue" : "slate"}>
                    {selectedOrg.plan?.name || "Free"} Plan
                  </StatusPill>
                  <StatusPill tone={getSubscriptionTone(getEffectiveSubscriptionStatus(selectedOrg))}>
                    {getEffectiveSubscriptionStatus(selectedOrg)}
                  </StatusPill>
                </div>
              </div>

              <div className="rounded-xl border border-border bg-muted/10 p-4">
                <p className="text-sm font-semibold text-foreground">Action Buttons</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" disabled={updateOrganizationStatus.isPending} onClick={() => updateOrganizationStatus.mutate({ id: selectedOrg.id, status: "active" })}>
                    Activate Company
                  </Button>
                  <Button size="sm" variant="outline" disabled={updateOrganizationStatus.isPending} onClick={() => updateOrganizationStatus.mutate({ id: selectedOrg.id, status: "suspended" })}>
                    Deactivate Company
                  </Button>
                  {(["Free", "Basic", "Pro"] as const).map((planName) => (
                    <Button key={planName} size="sm" variant={selectedOrg.plan?.name === planName ? "default" : "outline"} disabled={assignOrganizationPlan.isPending} onClick={() => assignOrganizationPlan.mutate({ id: selectedOrg.id, planName })}>
                      {selectedOrg.plan?.name === planName ? `${planName} Plan` : `Assign ${planName}`}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-border bg-muted/10 p-4">
                <p className="text-sm font-semibold text-foreground">Subscription Details</p>
                <div className="mt-3 space-y-2 text-sm text-muted-foreground">
                  <p>Company: <span className="text-foreground">{selectedOrg.company_name}</span></p>
                  <p>Status: <span className="text-foreground capitalize">{getEffectiveSubscriptionStatus(selectedOrg)}</span></p>
                  <p>Plan: <span className="text-foreground">{selectedOrg.plan?.name || "Free"}</span></p>
                  <p>Price: <span className="text-foreground">â‚¹{Number(selectedOrg.plan?.price || PLAN_PRICES[selectedOrg.plan?.name] || 0).toLocaleString("en-IN")}/month</span></p>
                  <p>Start Date: <span className="text-foreground">{selectedOrg.subscription_start_date ? new Date(selectedOrg.subscription_start_date).toLocaleDateString("en-CA") : "—"}</span></p>
                  <p>Expiry Date: <span className="text-foreground">{selectedOrg.subscription_end_date ? new Date(selectedOrg.subscription_end_date).toLocaleDateString("en-CA") : "—"}</span></p>
                  <p>Billing: <span className="text-foreground">{selectedOrg.payment_provider || "Manual / Offline"}</span></p>
                  <p>Auto renew: <span className="text-foreground">{selectedOrg.auto_renew ? "Enabled" : "Disabled"}</span></p>
                  <p>Users: <span className="text-foreground">{selectedOrg.accessSummary?.totalUsers || 0}</span></p>
                  <p>Invoice Limit: <span className="text-foreground">{selectedOrg.plan?.invoice_limit == null ? "Unlimited invoices" : `${selectedOrg.plan.invoice_limit} invoices`}</span></p>
                  <p>Limit: <span className="text-foreground">{selectedOrg.plan?.user_limit == null ? "Unlimited users" : `${selectedOrg.plan.user_limit} users`}</span></p>
                </div>
              </div>

              {/* Organization Users Table */}
              {(selectedOrg.users || []).length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-2">Users in {selectedOrg.company_name}</h4>
                  <div className="rounded-lg border border-border overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border bg-muted/40">
                          <th className="text-left px-4 py-2 text-[11px] font-semibold text-muted-foreground uppercase">Name</th>
                          <th className="text-left px-4 py-2 text-[11px] font-semibold text-muted-foreground uppercase">Email</th>
                          <th className="text-left px-4 py-2 text-[11px] font-semibold text-muted-foreground uppercase">Role</th>
                          <th className="text-left px-4 py-2 text-[11px] font-semibold text-muted-foreground uppercase">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(selectedOrg.users || []).map((u: any) => (
                          <tr key={u.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                            <td className="px-4 py-2 text-foreground font-medium">{u.display_name || u.username || "—"}</td>
                            <td className="px-4 py-2 text-muted-foreground">{u.email || "—"}</td>
                            <td className="px-4 py-2"><StatusPill tone="slate">{String(u.role || "viewer").toUpperCase()}</StatusPill></td>
                            <td className="px-4 py-2">
                              <StatusPill tone={u.is_active ? "green" : "red"}>
                                {u.is_active ? "Active" : "Inactive"}
                              </StatusPill>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
              )}
          </DialogContent>
        </Dialog>
      </div>
      )}

      <Dialog open={!!editingOrg} onOpenChange={(open) => { if (!open) { setEditingOrgId(null); setEditOrgForm(null); } }}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Company</DialogTitle>
            <DialogDescription>Update company details, GST info, subscription status, and plan.</DialogDescription>
          </DialogHeader>

          {editOrgForm && (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Company Name</Label>
                  <Input value={editOrgForm.company_name || ""} onChange={(e) => setEditOrgForm({ ...editOrgForm, company_name: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>GSTIN</Label>
                  <Input value={editOrgForm.gstin || ""} onChange={(e) => setEditOrgForm({ ...editOrgForm, gstin: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input type="email" value={editOrgForm.email || ""} onChange={(e) => setEditOrgForm({ ...editOrgForm, email: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input value={editOrgForm.phone || ""} onChange={(e) => setEditOrgForm({ ...editOrgForm, phone: e.target.value })} />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Website</Label>
                  <Input value={editOrgForm.website || ""} onChange={(e) => setEditOrgForm({ ...editOrgForm, website: e.target.value })} />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Address</Label>
                  <Input value={editOrgForm.address || ""} onChange={(e) => setEditOrgForm({ ...editOrgForm, address: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>City</Label>
                  <Input value={editOrgForm.city || ""} onChange={(e) => setEditOrgForm({ ...editOrgForm, city: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>State</Label>
                  <Input value={editOrgForm.state || ""} onChange={(e) => setEditOrgForm({ ...editOrgForm, state: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Pincode</Label>
                  <Input value={editOrgForm.pincode || ""} onChange={(e) => setEditOrgForm({ ...editOrgForm, pincode: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Plan</Label>
                  <Select value={editOrgForm.plan_name || "Free"} onValueChange={(value) => setEditOrgForm({ ...editOrgForm, plan_name: value })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Free">Free</SelectItem>
                      <SelectItem value="Basic">Basic</SelectItem>
                      <SelectItem value="Pro">Pro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={editOrgForm.status || "active"} onValueChange={(value) => setEditOrgForm({ ...editOrgForm, status: value })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="suspended">Suspended</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Auto Renew</Label>
                  <Select value={editOrgForm.auto_renew ? "true" : "false"} onValueChange={(value) => setEditOrgForm({ ...editOrgForm, auto_renew: value === "true" })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Enabled</SelectItem>
                      <SelectItem value="false">Disabled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                className="w-full"
                onClick={() => updateOrganization.mutate({ id: editingOrgId!, payload: editOrgForm })}
                disabled={!editOrgForm.company_name || updateOrganization.isPending}
              >
                {updateOrganization.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {isSuperAdmin && (
        <PlanFeatureManagementDialog
          configurablePlans={configurablePlans}
          groupedFeatureCatalog={groupedFeatureCatalog}
          selectedFeaturePlan={selectedFeaturePlan}
          selectedFeaturePlanId={selectedFeaturePlanId}
          setSelectedFeaturePlanId={setSelectedFeaturePlanId}
          updatePlanFeatures={updatePlanFeatures}
        />
      )}

      {isSuperAdmin && plansData?.plans && (
        <PlanPricingManagementDialog plans={plansData.plans} />
      )}

      {isSuperAdmin && (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <h3 className="text-base font-semibold text-foreground">Company Approval Flow</h3>
            </div>
            <div className="mt-4 space-y-3 text-sm text-muted-foreground">
              <p><span className="font-medium text-foreground">1.</span> Sign in as `ganesh@gmail.com` and open the Super Admin subscription dashboard.</p>
              <p><span className="font-medium text-foreground">2.</span> Create a company manually or approve the company after signup.</p>
              <p><span className="font-medium text-foreground">3.</span> Assign Free, Basic, or Premium plan and review user and invoice limits before activation.</p>
              <p><span className="font-medium text-foreground">4.</span> Open the company popup to activate, suspend, upgrade, and monitor usage from one place.</p>
            </div>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center gap-2">
              <Rocket className="h-4 w-4 text-blue-600" />
              <h3 className="text-base font-semibold text-foreground">Company Onboarding Flow</h3>
            </div>
            <div className="mt-4 space-y-3 text-sm text-muted-foreground">
              <p><span className="font-medium text-foreground">1.</span> Company admin fills company name, GST or tax info, address, and invoice settings after login.</p>
              <p><span className="font-medium text-foreground">2.</span> Initial master data is entered: customers, vendors, items or products, warehouses, and opening balances.</p>
              <p><span className="font-medium text-foreground">3.</span> Members are added and assigned roles like Admin, Accountant, or Staff using role-based access control.</p>
              <p><span className="font-medium text-foreground">4.</span> Daily usage starts across invoices, bills, expenses, reports, and payment tracking.</p>
            </div>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-amber-600" />
              <h3 className="text-base font-semibold text-foreground">Subscription Lifecycle</h3>
            </div>
            <div className="mt-4 space-y-3 text-sm text-muted-foreground">
              <p><span className="font-medium text-foreground">1.</span> Company selects plan and payment is processed through Razorpay or Stripe style billing.</p>
              <p><span className="font-medium text-foreground">2.</span> Subscription stores plan, start date, expiry date, provider, and auto-renew details.</p>
              <p><span className="font-medium text-foreground">3.</span> User and invoice limits are enforced by plan, while live usage is visible in the company popup.</p>
              <p><span className="font-medium text-foreground">4.</span> On expiry, status changes to expired, actions can be restricted, and the UI can push an upgrade prompt or grace period flow.</p>
            </div>
          </div>
        </div>
      )}

      {/* ===== SYSTEM READINESS ===== */}
      <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
        <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
          <div className="rounded-lg bg-emerald-500/10 p-2"><Shield className="h-4 w-4 text-emerald-600" /></div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground">Tenant Isolation</p>
            <p className="text-xs text-muted-foreground">Tenant-aware APIs filter data by `tenant_id` before every read or write.</p>
          </div>
          <StatusPill tone="green">Active</StatusPill>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
          <div className="rounded-lg bg-emerald-500/10 p-2"><Gauge className="h-4 w-4 text-emerald-600" /></div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground">Realtime Usage</p>
            <p className="text-xs text-muted-foreground">Plans, users, invoices, bills, and master data load from live organization APIs.</p>
          </div>
          <StatusPill tone="green">Active</StatusPill>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
          <div className="rounded-lg bg-blue-500/10 p-2"><CircleDollarSign className="h-4 w-4 text-blue-600" /></div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground">Package Billing</p>
            <p className="text-xs text-muted-foreground">Plan changes support payment-provider billing with stored plan and lifecycle metadata.</p>
          </div>
          <StatusPill tone="blue">Live</StatusPill>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
          <div className="rounded-lg bg-blue-500/10 p-2"><HardDriveDownload className="h-4 w-4 text-blue-600" /></div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground">RBAC + Session Security</p>
            <p className="text-xs text-muted-foreground">JWT auth, session storage, and role-based access control protect company data.</p>
          </div>
          <StatusPill tone="blue">Ready</StatusPill>
        </div>
      </div>
    </div>
  );
}
