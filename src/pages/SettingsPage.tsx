import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Building2, Users, Receipt, FileText, ArrowLeft, Trash2, Star, Edit2, ShieldCheck, CreditCard, Loader2, Database, Gauge, LockKeyhole, Shield, HardDriveDownload, UserCog, CircleDashed, Rocket, Monitor, Search, Plus } from "lucide-react";
import { adminUsersApi, featureAccessApi, gstSettingsApi, taxRatesApi, documentSequencesApi, userRolesApi, companyApi, invoiceSettingsApi, subscriptionApi, customersApi, invoicesApi, rolesApi } from "@/lib/api";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import SubscriptionSaaSSection from "@/pages/settings/SubscriptionSaaSSection";

type Section = null | "organization" | "users" | "taxes" | "invoice" | "subscription";

declare global {
  interface Window {
    Razorpay?: any;
  }
}

function loadRazorpayScript() {
  return new Promise<boolean>((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function SettingsPage() {
  const [section, setSection] = useState<Section>(null);
  const { userRole } = useAuth();
  const normalizedRole = String(userRole || "").toUpperCase();
  const isAdmin = normalizedRole === "ADMIN" || normalizedRole === "SUPER_ADMIN";

  if (section) {
    const blockedForUser = !isAdmin && (section === "organization" || section === "users" || section === "taxes");
    return (
      <div>
        <Button variant="ghost" size="sm" className="mb-4" onClick={() => setSection(null)}>
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Settings
        </Button>
        {blockedForUser ? (
          <div className="text-sm text-muted-foreground">You do not have access to this settings section.</div>
        ) : null}
        {!blockedForUser && section === "organization" && <OrganizationSection />}
        {!blockedForUser && section === "users" && <UsersSection />}
        {!blockedForUser && section === "taxes" && <TaxesSection />}
        {section === "invoice" && <InvoiceSettingsSection />}
        {section === "subscription" && <SubscriptionSaaSSection />}
      </div>
    );
  }

  const sections = [
    { key: "organization" as Section, icon: Building2, label: "Organization", desc: "Company details, GSTIN, address" },
    { key: "users" as Section, icon: Users, label: "Users & Roles", desc: "Manage team and permissions" },
    { key: "taxes" as Section, icon: Receipt, label: "Taxes", desc: "GST slabs and tax configuration" },
    { key: "invoice" as Section, icon: FileText, label: "Invoice Settings", desc: "Document numbering and prefixes" },
    { key: "subscription" as Section, icon: CreditCard, label: "Subscription & SaaS", desc: "Plans, billing, tenant readiness, security" },
  ];
  const visibleSections = isAdmin
    ? sections
    : sections.filter((item) => item.key !== "organization" && item.key !== "users" && item.key !== "taxes");

  return (
    <div>
      <PageHeader title="Settings" subtitle="Configure your accounting system" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {visibleSections.map((s) => {
          const Icon = s.icon;
          return (
            <button key={s.key} onClick={() => setSection(s.key)} className="bg-card rounded-xl border border-border p-5 text-left hover:shadow-md hover:border-primary/30 transition-all group">
              <div className="flex items-start gap-4">
                <div className="p-2.5 rounded-lg bg-accent group-hover:bg-primary/10 transition-colors">
                  <Icon className="w-5 h-5 text-accent-foreground group-hover:text-primary transition-colors" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-card-foreground">{s.label}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{s.desc}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ReadOnlyNote() {
  return <p className="text-sm text-muted-foreground mb-4">Only admins can modify settings. You have read-only access.</p>;
}

function StatusPill({ tone, children }: { tone: "green" | "amber" | "slate" | "blue"; children: React.ReactNode }) {
  const classes = {
    green: "bg-emerald-500/10 text-emerald-700",
    amber: "bg-amber-500/10 text-amber-700",
    slate: "bg-slate-500/10 text-slate-700",
    blue: "bg-primary/10 text-primary",
  };

  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${classes[tone]}`}>{children}</span>;
}

function SubscriptionMetric({ label, value, hint, icon: Icon }: { label: string; value: string; hint?: string; icon: any }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
          <p className="mt-2 text-xl font-semibold text-card-foreground">{value}</p>
          {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
        </div>
        <div className="rounded-lg bg-muted/50 p-2">
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>
    </div>
  );
}

function ReadinessRow({ icon: Icon, title, description, status, tone }: { icon: any; title: string; description: string; status: string; tone: "green" | "amber" | "slate" | "blue" }) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-xl border border-border bg-card p-4">
      <div className="flex items-start gap-3">
        <div className="rounded-lg bg-muted/40 p-2">
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
        <div>
          <p className="text-sm font-semibold text-card-foreground">{title}</p>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      <StatusPill tone={tone}>{status}</StatusPill>
    </div>
  );
}

function FeatureRow({ label, enabled, lockedText = "Upgrade required" }: { label: string; enabled: boolean; lockedText?: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border py-2.5 last:border-0">
      <span className="text-sm text-card-foreground">{label}</span>
      {enabled ? <StatusPill tone="green">Enabled</StatusPill> : <StatusPill tone="amber">{lockedText}</StatusPill>}
    </div>
  );
}

function SubscriptionSection() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { userRole } = useAuth();
  const isAdmin = userRole === "admin";
  const [upgradingPlan, setUpgradingPlan] = useState<string | null>(null);

  const { data: subscription } = useQuery({
    queryKey: ["subscription_current"],
    queryFn: subscriptionApi.current,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });
  const { data: company } = useQuery({ queryKey: ["company"], queryFn: companyApi.get });
  const { data: gst } = useQuery({ queryKey: ["gst_settings"], queryFn: gstSettingsApi.get });
  const { data: invoiceSettings } = useQuery({ queryKey: ["invoice_settings"], queryFn: invoiceSettingsApi.get });
  const { data: taxRates = [] } = useQuery({ queryKey: ["tax_rates"], queryFn: taxRatesApi.list });
  const { data: users = [] } = useQuery({ queryKey: ["user_roles"], queryFn: userRolesApi.list });
  const { data: sequences = [] } = useQuery({ queryKey: ["document_sequences"], queryFn: documentSequencesApi.list });
  const { data: customers = [] } = useQuery({ queryKey: ["customers"], queryFn: customersApi.list, retry: false });
  const { data: invoices = [] } = useQuery({ queryKey: ["invoices"], queryFn: invoicesApi.list, retry: false });

  const confirmUpgrade = useMutation({
    mutationFn: (planName: string) => subscriptionApi.confirmUpgrade(planName),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["subscription_current"] });
      toast({ title: "Subscription updated" });
    },
    onError: (error: any) => toast({ title: "Upgrade failed", description: error.message, variant: "destructive" }),
  });

  const handleUpgrade = async (planName: string) => {
    setUpgradingPlan(planName);
    try {
      const orderResponse = await subscriptionApi.createRazorpayOrder(planName);
      const loaded = await loadRazorpayScript();
      if (!loaded || !window.Razorpay) {
        throw new Error("Razorpay checkout script failed to load");
      }

      const razorpay = new window.Razorpay({
        key: orderResponse.razorpayKeyId,
        order_id: orderResponse.order.id,
        name: "BillFlow",
        description: `Upgrade to ${planName}`,
        handler: async () => {
          await confirmUpgrade.mutateAsync(planName);
        },
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

  const planName = subscription?.plan?.name || "Free";
  const userCount = users.length;
  const companyReady = Boolean(company?.company_name || company?.legal_name || gst?.legal_name);
  const gstReady = Boolean(gst?.gstin);
  const customerReady = customers.length > 0;
  const invoiceReady = invoices.length > 0;
  const onboardingCompleted = [companyReady, gstReady, customerReady, invoiceReady].filter(Boolean).length;
  const tenantRoles = ["admin", "accountant", "sales", "viewer"];
  const existingRoles = new Set(users.map((user: any) => String(user.role || "").toLowerCase()));
  const roleCoverage = tenantRoles.filter((role) => existingRoles.has(role)).length;
  const hasInvoiceTemplate = Boolean(invoiceSettings?.template || invoiceSettings?.template_id || sequences.length);
  const hasTaxSlabs = taxRates.length > 0;
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground font-display">Subscription & SaaS</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Live tenant subscription controls, user model, onboarding readiness, billing flow, and operational SaaS status.
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold text-card-foreground">Current Subscription</h3>
              <StatusPill tone={planName === "Pro" ? "green" : planName === "Basic" ? "blue" : "amber"}>{planName} Plan</StatusPill>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Tenant: <span className="font-medium text-card-foreground">{company?.company_name || gst?.legal_name || "Workspace not configured"}</span>
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Status: <span className="font-medium text-card-foreground capitalize">{subscription?.subscription?.status || "active"}</span>
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {["Free", "Basic", "Pro"].filter((plan) => plan !== planName).map((plan) => (
              <Button
                key={plan}
                variant={plan === "Pro" ? "default" : "outline"}
                disabled={!isAdmin || upgradingPlan === plan || confirmUpgrade.isPending}
                onClick={() => handleUpgrade(plan)}
              >
                {upgradingPlan === plan ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Upgrade to {plan}
              </Button>
            ))}
          </div>
        </div>
        {!isAdmin && <p className="mt-3 text-xs text-muted-foreground">Only admins can change billing plans and upgrade subscriptions.</p>}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SubscriptionMetric label="Users in Tenant" value={String(userCount)} hint={`${roleCoverage} of 4 target tenant roles in use`} icon={Users} />
        <SubscriptionMetric label="Onboarding Progress" value={`${onboardingCompleted} / 4`} hint="Company, GST, first customer, first invoice" icon={Rocket} />
        <SubscriptionMetric label="Plan Price" value={`₹${Number(subscription?.plan?.price || 0).toLocaleString("en-IN")}`} hint={`${planName} monthly billing plan`} icon={CreditCard} />
        <SubscriptionMetric label="Invoice Limit" value={subscription?.plan?.invoice_limit == null ? "Unlimited" : String(subscription.plan.invoice_limit)} hint="Plan-level invoice allowance" icon={FileText} />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-5">
          <h3 className="text-base font-semibold text-card-foreground">User Management Per Company</h3>
          <p className="mt-1 text-sm text-muted-foreground">Users belong to the current tenant and operate under role-based access.</p>
          <div className="mt-4 space-y-3">
            <ReadinessRow icon={UserCog} title="Tenant-scoped users" description={`Active users available for this company: ${userCount}. User management is already isolated per tenant context.`} status={userCount > 0 ? "Live" : "Needs setup"} tone={userCount > 0 ? "green" : "amber"} />
            <ReadinessRow icon={Users} title="Role model" description={`Expected roles: Admin, Accountant, Sales, Viewer. Current role coverage: ${roleCoverage}/4.`} status={roleCoverage >= 2 ? "Operational" : "Partial"} tone={roleCoverage >= 2 ? "green" : "amber"} />
            <ReadinessRow icon={LockKeyhole} title="Authentication system" description="Email + password sign-in is already wired. API uses token-based auth and resolves tenant before protected requests." status="JWT active" tone="green" />
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <h3 className="text-base font-semibold text-card-foreground">Subscription Features</h3>
          <p className="mt-1 text-sm text-muted-foreground">Plan-gated capabilities are enforced in the backend and reflected in the UI.</p>
          <div className="mt-4">
            <FeatureRow label="Subscription payment flow" enabled lockedText="Admin action required" />
            <FeatureRow label="Auto renewal readiness" enabled={Boolean(subscription?.subscription?.auto_renew)} lockedText="Not enabled" />
            <FeatureRow label="Invoice limit tracking" enabled />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-5">
          <h3 className="text-base font-semibold text-card-foreground">Onboarding Flow</h3>
          <p className="mt-1 text-sm text-muted-foreground">Signup should lead the tenant through company creation, GST setup, first customer, and first invoice.</p>
          <div className="mt-4 space-y-3">
            <ReadinessRow icon={Building2} title="1. Register + Create Company" description={companyReady ? `Company workspace found: ${company?.company_name || gst?.legal_name}` : "Company workspace details are still missing for this tenant."} status={companyReady ? "Completed" : "Pending"} tone={companyReady ? "green" : "amber"} />
            <ReadinessRow icon={Receipt} title="2. GST Setup" description={gstReady ? `GSTIN configured: ${gst?.gstin}` : "GST registration details are not fully configured."} status={gstReady ? "Completed" : "Pending"} tone={gstReady ? "green" : "amber"} />
            <ReadinessRow icon={Users} title="3. Add First Customer" description={customerReady ? `${customers.length} customer records available.` : "No customer has been created in this tenant yet."} status={customerReady ? "Completed" : "Pending"} tone={customerReady ? "green" : "amber"} />
            <ReadinessRow icon={FileText} title="4. Create First Invoice" description={invoiceReady ? `${invoices.length} invoice records available.` : "No invoice has been created yet for this workspace."} status={invoiceReady ? "Completed" : "Pending"} tone={invoiceReady ? "green" : "amber"} />
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <h3 className="text-base font-semibold text-card-foreground">Billing & Payments</h3>
          <p className="mt-1 text-sm text-muted-foreground">Primary payment path is Razorpay, with plan upgrades tied to tenant subscription state.</p>
          <div className="mt-4 space-y-3">
            <ReadinessRow icon={CreditCard} title="Razorpay integration" description="Upgrade flow already attempts Razorpay order creation and falls back safely when keys are not configured." status="Integrated" tone="green" />
            <ReadinessRow icon={Receipt} title="SaaS billing invoices" description="Subscription metadata is tracked, but dedicated SaaS invoice issuance still needs full accounting-side automation." status="Partial" tone="amber" />
            <ReadinessRow icon={CircleDashed} title="Stripe support" description="Optional second payment provider is not yet wired in the current application flow." status="Pending" tone="slate" />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        <h3 className="text-base font-semibold text-card-foreground">Data Security, Isolation & Performance</h3>
        <div className="mt-4 grid grid-cols-1 gap-3 xl:grid-cols-2">
          <ReadinessRow icon={ShieldCheck} title="Tenant isolation" description="Protected APIs resolve tenant context before access. Subscription, company, customer, and invoice flows are tenant-filtered." status="Active" tone="green" />
          <ReadinessRow icon={Shield} title="Secure authentication" description="Tenant-aware token authentication is in place. Users load workspace-scoped data after sign-in." status="Active" tone="green" />
          <ReadinessRow icon={Gauge} title="Pagination" description="Paginated list APIs exist across major modules and subscription-adjacent lists support page and limit controls." status="Active" tone="green" />
          <ReadinessRow icon={Database} title="Caching & background jobs" description="Frontend query caching is active. Dedicated background jobs for PDF and email workloads still need a job runner." status="Partial" tone="amber" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-5">
          <h3 className="text-base font-semibold text-card-foreground">Settings Per Tenant</h3>
          <p className="mt-1 text-sm text-muted-foreground">Each tenant should maintain its own GST, invoice, email, and tax configuration.</p>
          <div className="mt-4 space-y-3">
            <ReadinessRow icon={Receipt} title="GST settings" description={gstReady ? "GST configuration exists for this tenant." : "GST configuration is still pending."} status={gstReady ? "Configured" : "Pending"} tone={gstReady ? "green" : "amber"} />
            <ReadinessRow icon={FileText} title="Invoice template & numbering" description={hasInvoiceTemplate ? `Invoice setup found. Document sequences: ${sequences.length}.` : "Invoice template and numbering setup still need completion."} status={hasInvoiceTemplate ? "Configured" : "Pending"} tone={hasInvoiceTemplate ? "green" : "amber"} />
            <ReadinessRow icon={Receipt} title="Tax slabs" description={hasTaxSlabs ? `${taxRates.length} tenant tax slabs configured.` : "No tenant tax slabs configured yet."} status={hasTaxSlabs ? "Configured" : "Pending"} tone={hasTaxSlabs ? "green" : "amber"} />
            <ReadinessRow icon={Building2} title="Company profile" description={companyReady ? "Company profile is available for this tenant." : "Company profile is incomplete."} status={companyReady ? "Configured" : "Pending"} tone={companyReady ? "green" : "amber"} />
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <h3 className="text-base font-semibold text-card-foreground">Platform Roadmap Status</h3>
          <p className="mt-1 text-sm text-muted-foreground">These are the SaaS sections you asked for, mapped to what is live now versus what still needs dedicated implementation.</p>
          <div className="mt-4 space-y-3">
            <ReadinessRow icon={Monitor} title="Existing modules per tenant" description="Sales, purchase, inventory, accounting, GST, reports, POS, settings should all be tenant-aware. Some core modules are already scoped, but full uniform enforcement still needs audit coverage." status="In progress" tone="amber" />
            <ReadinessRow icon={UserCog} title="Super admin panel" description="Global tenant management, usage, disable controls, and subscription administration do not yet have a dedicated UI." status="Pending" tone="slate" />
            <ReadinessRow icon={HardDriveDownload} title="Backup & restore" description="Tenant-specific backup and restore flows are not yet exposed in the current application." status="Pending" tone="slate" />
            <ReadinessRow icon={Rocket} title="Zoho/FreshBooks-style SaaS maturity" description="The subscription core, tenant context, and settings foundation exist, but the full SaaS operating layer is not complete yet." status="Foundation ready" tone="blue" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ===== Organization =====
function OrganizationSection() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { userRole } = useAuth();
  const isAdmin = userRole === "admin";
  const { data: gst, isLoading } = useQuery({ queryKey: ["gst_settings"], queryFn: gstSettingsApi.get });
  const [form, setForm] = useState<any>(null);

  const currentForm = form || gst || {};
  const updateField = (field: string, value: any) => setForm({ ...currentForm, [field]: value });

  const saveMutation = useMutation({
    mutationFn: (data: any) => gstSettingsApi.upsert(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gst_settings"] });
      toast({ title: "Settings saved" });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  if (isLoading) return <div className="text-center text-muted-foreground py-12">Loading...</div>;

  return (
    <div>
      <h2 className="text-lg font-semibold text-foreground mb-4 font-display">Organization Settings</h2>
      {!isAdmin && <ReadOnlyNote />}
      <div className="bg-card border border-border rounded-xl p-6 space-y-4 max-w-lg">
        <div className="space-y-2"><Label>Legal Name</Label><Input value={currentForm.legal_name || ""} onChange={e => updateField("legal_name", e.target.value)} disabled={!isAdmin} /></div>
        <div className="space-y-2"><Label>Trade Name</Label><Input value={currentForm.trade_name || ""} onChange={e => updateField("trade_name", e.target.value)} disabled={!isAdmin} /></div>
        <div className="space-y-2"><Label>GSTIN</Label><Input value={currentForm.gstin || ""} onChange={e => updateField("gstin", e.target.value)} placeholder="22AAAAA0000A1Z5" disabled={!isAdmin} /></div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2"><Label>State</Label><Input value={currentForm.state || ""} onChange={e => updateField("state", e.target.value)} disabled={!isAdmin} /></div>
          <div className="space-y-2"><Label>State Code</Label><Input value={currentForm.state_code || ""} onChange={e => updateField("state_code", e.target.value)} disabled={!isAdmin} /></div>
        </div>
        <Button onClick={() => saveMutation.mutate(currentForm)} disabled={saveMutation.isPending || !isAdmin}>
          {saveMutation.isPending ? "Saving..." : "Save Settings"}
        </Button>
      </div>
    </div>
  );
}

// ===== Users =====
function UsersSection() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user, userRole } = useAuth();
  const normalizedRole = String(userRole || user?.role || "").toUpperCase();
  const isSuperAdmin = normalizedRole === "SUPER_ADMIN";
  const isAdmin = normalizedRole === "ADMIN" || normalizedRole === "SUPER_ADMIN";
  const companyRoleOptions = [
    { value: "admin", label: "Admin" },
    { value: "accountant", label: "Accountant" },
    { value: "staff", label: "Staff" },
    { value: "viewer", label: "Viewer" },
  ];
  const superAdminRoleOptions = companyRoleOptions;
  const { data: roles = [], isLoading } = useQuery({ queryKey: ["user_roles"], queryFn: userRolesApi.list });
  const { data: rolePermissionData } = useQuery({
    queryKey: ["role_permissions"],
    queryFn: featureAccessApi.rolePermissions,
    enabled: isAdmin,
  });
  const { data: tenantRoles = [] } = useQuery({
    queryKey: ["tenant_roles"],
    queryFn: rolesApi.list,
    enabled: isAdmin,
  });

  const [addOpen, setAddOpen] = useState(false);
  const [addUserOpen, setAddUserOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [userSearch, setUserSearch] = useState("");
  const [selectedCybaemUsers, setSelectedCybaemUsers] = useState<string[]>([]);
  const [newUser, setNewUser] = useState({
    display_name: "",
    email: "",
    username: "",
    phone: "",
    password: "",
    role: "accountant",
    is_active: true,
    accessPermissions: [] as string[],
  });
  const [newCompanyAdmin, setNewCompanyAdmin] = useState({
    company_name: "",
    gstin: "",
    address: "",
    company_email: "",
    admin_name: "",
    admin_email: "",
    admin_phone: "",
    admin_password: "",
    plan_name: "Free",
    invoice_limit: "",
    user_limit: "",
    start_date: new Date().toISOString().split("T")[0],
    end_date: "",
    auto_renew: false,
  });
  const [editForm, setEditForm] = useState<any>({
    display_name: "",
    email: "",
    username: "",
    phone: "",
    password: "",
    role: "accountant",
    is_active: true,
    accessPermissions: [] as string[],
  });
  const [newRoleName, setNewRoleName] = useState("");
  const [showRoleCreator, setShowRoleCreator] = useState(false);

  const refreshUsers = async () => {
    await queryClient.invalidateQueries({ queryKey: ["user_roles"] });
    await queryClient.invalidateQueries({ queryKey: ["subscription_organizations"] });
    await queryClient.invalidateQueries({ queryKey: ["company"] });
    await queryClient.invalidateQueries({ queryKey: ["gst_settings"] });
    await queryClient.invalidateQueries({ queryKey: ["invoice_settings"] });
    await queryClient.invalidateQueries({ queryKey: ["subscription_current"] });
  };

  const createUserMutation = useMutation({
    mutationFn: () => adminUsersApi.create({
      display_name: newUser.display_name,
      email: newUser.email,
      username: newUser.username,
      phone: newUser.phone,
      password: newUser.password,
      role: newUser.role,
      is_active: newUser.is_active,
      accessPermissions: newUser.accessPermissions,
    }),
    onSuccess: async () => {
      if (newUser.role && newUser.accessPermissions.length > 0) {
        await featureAccessApi.updateRolePermissions(newUser.role, newUser.accessPermissions);
      }
      await refreshUsers();
      setAddOpen(false);
      setAddUserOpen(false);
      setNewUser({ display_name: "", email: "", username: "", phone: "", password: "", role: "accountant", is_active: true, accessPermissions: [] });
      toast({ title: "User created" });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const createCompanyAdminMutation = useMutation({
    mutationFn: () => adminUsersApi.createCompanyWithAdmin(newCompanyAdmin),
    onSuccess: async () => {
      await refreshUsers();
      setAddOpen(false);
      setNewCompanyAdmin({
        company_name: "",
        gstin: "",
        address: "",
        company_email: "",
        admin_name: "",
        admin_email: "",
        admin_phone: "",
        admin_password: "",
        plan_name: "Free",
        invoice_limit: "",
        user_limit: "",
        start_date: new Date().toISOString().split("T")[0],
        end_date: "",
        auto_renew: false,
      });
      toast({ title: "Company and admin created" });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) => adminUsersApi.update(id, payload),
    onSuccess: async () => {
      if (editForm.role && Array.isArray(editForm.accessPermissions) && editForm.accessPermissions.length > 0) {
        await featureAccessApi.updateRolePermissions(editForm.role, editForm.accessPermissions);
      }
      await refreshUsers();
      setEditingUser(null);
      toast({ title: "User updated" });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const createRoleMutation = useMutation({
    mutationFn: () => rolesApi.create({ name: newRoleName.trim().toLowerCase(), label: newRoleName.trim() }),
    onSuccess: async () => {
      const roleValue = newRoleName.trim().toLowerCase();
      setNewRoleName("");
      setShowRoleCreator(false);
      await queryClient.invalidateQueries({ queryKey: ["tenant_roles"] });
      await queryClient.invalidateQueries({ queryKey: ["role_permissions"] });
      setNewUser((current) => ({ ...current, role: roleValue || current.role }));
      setEditForm((current: any) => ({ ...current, role: roleValue || current.role }));
      toast({ title: "Role created" });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const deleteUserMutation = useMutation({
    mutationFn: (id: string) => adminUsersApi.delete(id),
    onSuccess: async () => {
      await refreshUsers();
      toast({ title: "User deleted" });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const bulkDeleteUsersMutation = useMutation({
    mutationFn: async (ids: string[]) => Promise.all(ids.map((id) => adminUsersApi.delete(id))),
    onSuccess: async (_, ids) => {
      setSelectedCybaemUsers((current) => current.filter((id) => !ids.includes(id)));
      await refreshUsers();
      toast({ title: "Users deleted" });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const handleEditOpen = (record: any) => {
    const roleKey = String(record.role || "viewer").toLowerCase();
    setEditingUser(record);
    setEditForm({
      display_name: record.display_name || "",
      email: record.email || "",
      username: record.username || "",
      phone: record.phone || "",
      password: "",
      role: roleKey,
      is_active: record.is_active !== false,
      accessPermissions: Array.isArray(rolePermissionData?.permissions?.[roleKey]) ? [...rolePermissionData.permissions[roleKey]] : [],
    });
  };

  const allowedFeatureCatalog = rolePermissionData?.catalog || [];
  const tenantRoleOptions = (tenantRoles as any[]).map((role) => ({
    value: String(role.name || "").toLowerCase(),
    label: role.label || role.name,
  })).filter((role) => role.value);
  const getDefaultPermissionsForRole = (roleKey: string) => {
    const permissions = rolePermissionData?.permissions?.[String(roleKey || "").toLowerCase()];
    return Array.isArray(permissions) ? [...permissions] : [];
  };
  const renderAccessControlSection = (
    selectedPermissions: string[],
    setSelectedPermissions: (next: string[]) => void,
  ) => (
    allowedFeatureCatalog.length > 0 ? (
      <div className="rounded-xl border border-border p-4 space-y-3">
        <div>
          <h4 className="text-sm font-semibold text-foreground">Access Control</h4>
          <p className="text-xs text-muted-foreground mt-0.5">Select which sections this user can access.</p>
        </div>
        {Object.entries(
          allowedFeatureCatalog.reduce((acc: Record<string, any[]>, feature: any) => {
            const mod = feature.module || "General";
            if (!acc[mod]) acc[mod] = [];
            acc[mod].push(feature);
            return acc;
          }, {})
        ).map(([mod, features]) => (
          <div key={mod}>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5">{mod}</p>
            <div className="grid grid-cols-2 gap-1">
              {(features as any[]).map((f) => {
                const checked = selectedPermissions.includes(f.key);
                return (
                  <label key={f.key} className={`flex items-center gap-2 rounded-lg px-3 py-2 cursor-pointer text-sm transition-colors ${checked ? "bg-primary/10 text-primary" : "hover:bg-muted/40 text-muted-foreground"}`}>
                    <input
                      type="checkbox"
                      className="h-3.5 w-3.5 rounded accent-primary"
                      checked={checked}
                      onChange={(e) => {
                        const next = e.target.checked
                          ? [...selectedPermissions, f.key]
                          : selectedPermissions.filter((k: string) => k !== f.key);
                        setSelectedPermissions(next);
                      }}
                    />
                    {f.label}
                  </label>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    ) : null
  );

  const filteredRoles = (roles as any[]).filter((r: any) => {
    const matchesSearch = !userSearch ||
      (r.display_name || "").toLowerCase().includes(userSearch.toLowerCase()) ||
      (r.email || "").toLowerCase().includes(userSearch.toLowerCase());
    return matchesSearch;
  });

  const cybaemtechUsers = filteredRoles.filter((r: any) => {
    return Boolean(r.is_cybaemtech_team) && r.is_active !== false;
  });
  const platformAdmins = filteredRoles.filter((r: any) => (r.role || "").toLowerCase() === "admin" && r.is_active !== false);
  const cybaemtechSelectableIds = cybaemtechUsers
    .map((r: any) => String(r.user_id))
    .filter((id: string) => id && id !== String(user?.id || ""));
  const allCybaemtechSelected = cybaemtechSelectableIds.length > 0 && cybaemtechSelectableIds.every((id) => selectedCybaemUsers.includes(id));
  const selectedCybaemtechCount = selectedCybaemUsers.filter((id) => cybaemtechSelectableIds.includes(id)).length;

  const toggleCybaemtechSelection = (userId: string, checked: boolean) => {
    setSelectedCybaemUsers((current) => {
      const next = new Set(current);
      if (checked) {
        next.add(userId);
      } else {
        next.delete(userId);
      }
      return Array.from(next);
    });
  };

  const toggleSelectAllCybaemtech = (checked: boolean) => {
    setSelectedCybaemUsers((current) => {
      const next = new Set(current);
      if (checked) {
        cybaemtechSelectableIds.forEach((id) => next.add(id));
      } else {
        cybaemtechSelectableIds.forEach((id) => next.delete(id));
      }
      return Array.from(next);
    });
  };

  useEffect(() => {
    setSelectedCybaemUsers((current) => current.filter((id) => cybaemtechSelectableIds.includes(id)));
  }, [cybaemtechSelectableIds.join(",")]);

  return (
    <div>
      <div className="flex items-center justify-between mb-4 gap-3">
        <div>
          <h2 className="text-lg font-semibold text-foreground font-display">Users &amp; Roles</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {isSuperAdmin
              ? "Super Admin can create companies, company admins, and manage team members."
              : isAdmin
              ? "Company admins can add users, but cannot create another admin."
              : "Only admins can add, edit, and delete users."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isSuperAdmin && <Button size="sm" variant="outline" onClick={() => setAddUserOpen(true)}>Add User</Button>}
          {isSuperAdmin && <Button size="sm" onClick={() => setAddOpen(true)}>Add Admin</Button>}
          {!isSuperAdmin && isAdmin && <Button size="sm" onClick={() => setAddUserOpen(true)}>Add User</Button>}
        </div>
      </div>

      {/* Super Admin Filters */}
      {isSuperAdmin && (
        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="Search users..."
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
            />
          </div>
          {userSearch && (
            <button className="text-xs text-muted-foreground hover:text-foreground" onClick={() => setUserSearch("")}>Clear</button>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Panel 1: CybaemTech Team (Only for Super Admin) */}
        {isSuperAdmin && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-primary" />
              CybaemTech Team
              <span className="text-xs font-normal text-muted-foreground ml-1">({cybaemtechUsers.length})</span>
            </h3>
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              {isLoading ? (
                <div className="p-8 text-center text-muted-foreground">Loading...</div>
              ) : cybaemtechUsers.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">No team members found.</div>
              ) : (
                <div className="overflow-x-auto">
                  <div className="flex items-center justify-between gap-3 border-b border-border bg-muted/20 px-4 py-2">
                    <label className="flex items-center gap-2 text-xs text-muted-foreground">
                      <input
                        type="checkbox"
                        checked={allCybaemtechSelected}
                        onChange={(e) => toggleSelectAllCybaemtech(e.target.checked)}
                        className="h-4 w-4 rounded border-border"
                      />
                      Select all
                    </label>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{selectedCybaemtechCount} selected</span>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 gap-2"
                        disabled={selectedCybaemUsers.length === 0 || bulkDeleteUsersMutation.isPending}
                        onClick={() => {
                          const ids = selectedCybaemUsers.filter((id) => cybaemtechSelectableIds.includes(id));
                          if (ids.length === 0) return;
                          if (confirm(`Delete ${ids.length} selected user(s)?`)) {
                            bulkDeleteUsersMutation.mutate(ids);
                          }
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        Delete Selected
                      </Button>
                    </div>
                  </div>
                  <table className="w-full text-sm">
                    <thead><tr className="border-b border-border bg-muted/40">
                      <th className="w-10 px-4 py-2.5 text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wider"></th>
                      <th className="text-left px-4 py-2.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">User</th>
                      <th className="text-left px-4 py-2.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Role</th>
                      <th className="text-left px-4 py-2.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                      <th className="text-right px-4 py-2.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
                    </tr></thead>
                    <tbody>
                      {cybaemtechUsers.map((r: any) => (
                        (() => {
                          const targetRole = String(r.role || "").toLowerCase();
                          const canManageRow = isSuperAdmin || targetRole !== "super_admin";
                          return (
                        <tr key={r.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                          <td className="px-4 py-2.5 align-top">
                            <input
                              type="checkbox"
                              checked={selectedCybaemUsers.includes(String(r.user_id))}
                              disabled={String(r.user_id) === String(user?.id)}
                              onChange={(e) => toggleCybaemtechSelection(String(r.user_id), e.target.checked)}
                              className="h-4 w-4 rounded border-border"
                            />
                          </td>
                          <td className="px-4 py-2.5">
                            <div className="font-medium text-card-foreground">{r.display_name || r.username}</div>
                            <div className="text-[10px] text-muted-foreground">{r.email}</div>
                          </td>
                          <td className="px-4 py-2.5 text-card-foreground capitalize">{r.role}</td>
                          <td className="px-4 py-2.5">
                            <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${r.is_active === false ? "bg-destructive/10 text-destructive" : "bg-emerald-500/10 text-emerald-600"}`}>
                              {r.is_active === false ? "Inactive" : "Active"}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" disabled={!canManageRow} onClick={() => canManageRow && handleEditOpen(r)}>
                                <Edit2 className="w-3.5 h-3.5" />
                              </Button>
                              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" disabled={!canManageRow || r.user_id === user?.id} onClick={() => { if (canManageRow && confirm("Delete user?")) deleteUserMutation.mutate(r.user_id); }}>
                                <Trash2 className="w-3.5 h-3.5 text-destructive" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                          );
                        })()
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Panel 2: Platform Admins / All Roles */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <UserCog className="w-4 h-4 text-primary" />
            {isSuperAdmin ? "Platform Admins" : "Company Users"}
            <span className="text-xs font-normal text-muted-foreground ml-1">({isSuperAdmin ? platformAdmins.length : filteredRoles.length})</span>
          </h3>
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            {isLoading ? (
              <div className="p-8 text-center text-muted-foreground">Loading...</div>
            ) : (isSuperAdmin ? platformAdmins.length === 0 : filteredRoles.length === 0) ? (
              <div className="p-8 text-center text-muted-foreground">No accounts found.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-border bg-muted/40">
                    <th className="text-left px-4 py-2.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">User</th>
                    {isSuperAdmin && <th className="text-left px-4 py-2.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Company</th>}
                    <th className="text-left px-4 py-2.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                    <th className="text-right px-4 py-2.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
                  </tr></thead>
                  <tbody>
                    {(isSuperAdmin ? platformAdmins : filteredRoles).map((r: any) => (
                      (() => {
                        const targetRole = String(r.role || "").toLowerCase();
                        const canManageRow = isSuperAdmin || targetRole !== "super_admin";
                        return (
                      <tr key={r.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                        <td className="px-4 py-2.5">
                          <div className="font-medium text-card-foreground">{r.display_name || r.username}</div>
                          <div className="text-[10px] text-muted-foreground">{r.email}</div>
                        </td>
                        {isSuperAdmin && <td className="px-4 py-2.5 text-muted-foreground max-w-[120px] truncate">{r.company_name || "—"}</td>}
                        <td className="px-4 py-2.5">
                          <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${r.is_active === false ? "bg-destructive/10 text-destructive" : "bg-emerald-500/10 text-emerald-600"}`}>
                            {r.is_active === false ? "Inactive" : "Active"}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" disabled={!canManageRow} onClick={() => canManageRow && handleEditOpen(r)}>
                              <Edit2 className="w-3.5 h-3.5" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" disabled={!canManageRow || r.user_id === user?.id} onClick={() => { if (canManageRow && confirm("Delete user?")) deleteUserMutation.mutate(r.user_id); }}>
                              <Trash2 className="w-3.5 h-3.5 text-destructive" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                        );
                      })()
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      <Dialog open={isSuperAdmin && addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Company + Admin</DialogTitle>
            <DialogDescription>
              Create the company, its first admin, and the subscription in one flow.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-5">
            <div className="rounded-xl border border-border p-4">
              <h3 className="text-sm font-semibold text-foreground">Company Details</h3>
              <div className="mt-3 grid gap-4 md:grid-cols-2">
                <div className="space-y-2"><Label>Company Name</Label><Input value={newCompanyAdmin.company_name} onChange={(e) => setNewCompanyAdmin({ ...newCompanyAdmin, company_name: e.target.value })} /></div>
                <div className="space-y-2"><Label>Company Email</Label><Input type="email" value={newCompanyAdmin.company_email} onChange={(e) => setNewCompanyAdmin({ ...newCompanyAdmin, company_email: e.target.value })} /></div>
                <div className="space-y-2"><Label>GST / Tax Info</Label><Input value={newCompanyAdmin.gstin} onChange={(e) => setNewCompanyAdmin({ ...newCompanyAdmin, gstin: e.target.value })} /></div>
                <div className="space-y-2 md:col-span-2"><Label>Address</Label><Input value={newCompanyAdmin.address} onChange={(e) => setNewCompanyAdmin({ ...newCompanyAdmin, address: e.target.value })} /></div>
              </div>
            </div>

            <div className="rounded-xl border border-border p-4">
              <h3 className="text-sm font-semibold text-foreground">Admin User Details</h3>
              <div className="mt-3 grid gap-4 md:grid-cols-2">
                <div className="space-y-2"><Label>Name</Label><Input value={newCompanyAdmin.admin_name} onChange={(e) => setNewCompanyAdmin({ ...newCompanyAdmin, admin_name: e.target.value })} /></div>
                <div className="space-y-2"><Label>Email</Label><Input type="email" value={newCompanyAdmin.admin_email} onChange={(e) => setNewCompanyAdmin({ ...newCompanyAdmin, admin_email: e.target.value })} /></div>
                <div className="space-y-2"><Label>Phone</Label><Input value={newCompanyAdmin.admin_phone} onChange={(e) => setNewCompanyAdmin({ ...newCompanyAdmin, admin_phone: e.target.value })} /></div>
                <div className="space-y-2"><Label>Password</Label><Input type="password" value={newCompanyAdmin.admin_password} onChange={(e) => setNewCompanyAdmin({ ...newCompanyAdmin, admin_password: e.target.value })} /></div>
                <div className="space-y-2">
                  <Label>Role</Label>
                  <Input value="ADMIN" disabled />
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-border p-4">
              <h3 className="text-sm font-semibold text-foreground">Subscription Details</h3>
              <div className="mt-3 grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Plan</Label>
                  <Select value={newCompanyAdmin.plan_name} onValueChange={(value) => setNewCompanyAdmin({ ...newCompanyAdmin, plan_name: value })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {subscriptionApi.plans && Array.isArray(subscriptionApi.plans) ? (
                        subscriptionApi.plans.map((p: any) => <SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>)
                      ) : (
                        <>
                          <SelectItem value="Free">Free</SelectItem>
                          <SelectItem value="Basic">Basic</SelectItem>
                          <SelectItem value="Pro">Premium</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label>Invoice Limit</Label><Input value={newCompanyAdmin.invoice_limit} onChange={(e) => setNewCompanyAdmin({ ...newCompanyAdmin, invoice_limit: e.target.value })} placeholder="Optional override" /></div>
                <div className="space-y-2"><Label>User Limit</Label><Input value={newCompanyAdmin.user_limit} onChange={(e) => setNewCompanyAdmin({ ...newCompanyAdmin, user_limit: e.target.value })} placeholder="Optional override" /></div>
                <div className="space-y-2">
                  <Label>Auto Renew</Label>
                  <Select value={newCompanyAdmin.auto_renew ? "true" : "false"} onValueChange={(value) => setNewCompanyAdmin({ ...newCompanyAdmin, auto_renew: value === "true" })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Enabled</SelectItem>
                      <SelectItem value="false">Disabled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label>Start Date</Label><Input type="date" value={newCompanyAdmin.start_date} onChange={(e) => setNewCompanyAdmin({ ...newCompanyAdmin, start_date: e.target.value })} /></div>
                <div className="space-y-2"><Label>End Date</Label><Input type="date" value={newCompanyAdmin.end_date} onChange={(e) => setNewCompanyAdmin({ ...newCompanyAdmin, end_date: e.target.value })} /></div>
              </div>
            </div>

            <Button
              className="w-full"
              onClick={() => createCompanyAdminMutation.mutate()}
              disabled={!newCompanyAdmin.company_name || !newCompanyAdmin.admin_email || !newCompanyAdmin.admin_password || createCompanyAdminMutation.isPending}
            >
              {createCompanyAdminMutation.isPending ? "Creating company..." : "Create Company + Admin"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add User Dialog (Used by both Company Admin and Super Admin team management) */}
      <Dialog open={addUserOpen} onOpenChange={setAddUserOpen}>
          <DialogContent className="w-[min(92vw,56rem)] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
            <DialogDescription>
              Create a new user account and assign a role.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Display Name</Label><Input value={newUser.display_name} onChange={(e) => setNewUser({ ...newUser, display_name: e.target.value })} /></div>
            <div className="space-y-2"><Label>Email</Label><Input type="email" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} /></div>
            <div className="space-y-2"><Label>Username</Label><Input value={newUser.username} onChange={(e) => setNewUser({ ...newUser, username: e.target.value })} /></div>
            <div className="space-y-2"><Label>Phone</Label><Input value={newUser.phone} onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })} /></div>
            <div className="space-y-2"><Label>Password</Label><Input type="password" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <Label>Role</Label>
                  <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => setShowRoleCreator((v) => !v)}>
                    <Plus className="mr-1 h-3.5 w-3.5" />
                    Add role
                  </Button>
                </div>
                <Select
                  value={newUser.role}
                  onValueChange={(value) => setNewUser((current) => ({
                    ...current,
                    role: value,
                    accessPermissions: getDefaultPermissionsForRole(value),
                  }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(tenantRoleOptions.length > 0 ? tenantRoleOptions : companyRoleOptions).map((option) => (
                      <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {showRoleCreator && (
                  <div className="flex items-center gap-2">
                    <Input value={newRoleName} onChange={(e) => setNewRoleName(e.target.value)} placeholder="Type new role" />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => createRoleMutation.mutate()}
                      disabled={!newRoleName.trim() || createRoleMutation.isPending}
                    >
                      Add
                    </Button>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={newUser.is_active ? "true" : "false"} onValueChange={(value) => setNewUser({ ...newUser, is_active: value === "true" })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Active</SelectItem>
                    <SelectItem value="false">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {renderAccessControlSection(newUser.accessPermissions, (next) => setNewUser((current) => ({ ...current, accessPermissions: next })))}

            <Button className="w-full" onClick={() => createUserMutation.mutate()} disabled={!newUser.email || !newUser.password || createUserMutation.isPending}>
              {createUserMutation.isPending ? "Creating..." : "Create User"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingUser} onOpenChange={(open) => { if (!open) setEditingUser(null); }}>
        <DialogContent className="w-[min(92vw,56rem)] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>Update user details, role, and account status.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Display Name</Label><Input value={editForm.display_name || ""} onChange={(e) => setEditForm({ ...editForm, display_name: e.target.value })} /></div>
            <div className="space-y-2"><Label>Email</Label><Input type="email" value={editForm.email || ""} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} /></div>
            <div className="space-y-2"><Label>Username</Label><Input value={editForm.username || ""} onChange={(e) => setEditForm({ ...editForm, username: e.target.value })} /></div>
            <div className="space-y-2"><Label>Phone</Label><Input value={editForm.phone || ""} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} /></div>
            <div className="space-y-2"><Label>New Password</Label><Input type="password" value={editForm.password || ""} onChange={(e) => setEditForm({ ...editForm, password: e.target.value })} placeholder="Leave blank to keep current password" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Role</Label>
                <Select
                  value={editForm.role || "viewer"}
                  onValueChange={(value) => setEditForm((current: any) => ({
                    ...current,
                    role: value,
                    accessPermissions: getDefaultPermissionsForRole(value),
                  }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(isSuperAdmin ? superAdminRoleOptions : (tenantRoleOptions.length > 0 ? tenantRoleOptions : companyRoleOptions)).map((option) => (
                      <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={editForm.is_active ? "true" : "false"} onValueChange={(value) => setEditForm({ ...editForm, is_active: value === "true" })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Active</SelectItem>
                    <SelectItem value="false">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {renderAccessControlSection(editForm.accessPermissions || [], (next) => setEditForm((current: any) => ({ ...current, accessPermissions: next })))}
            <Button className="w-full" onClick={() => updateUserMutation.mutate({ id: editingUser.user_id, payload: editForm })} disabled={!editForm.email || updateUserMutation.isPending}>
              {updateUserMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ===== Taxes (Full GST Slab Management) =====
function TaxesSection() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { userRole } = useAuth();
  const isAdmin = userRole === "admin";
  const { data: taxes = [], isLoading } = useQuery({ queryKey: ["tax_rates"], queryFn: taxRatesApi.list });
  const [name, setName] = useState("");
  const [rate, setRate] = useState("");
  const [showAdd, setShowAdd] = useState(false);

  const cgst = Number(rate) / 2;
  const sgst = Number(rate) / 2;
  const igst = Number(rate);

  const createMutation = useMutation({
    mutationFn: () => taxRatesApi.create({
      name: name || `GST ${rate}%`,
      rate: Number(rate),
      tax_type: "GST",
      cgst,
      sgst,
      igst,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tax_rates"] });
      setName("");
      setRate("");
      setShowAdd(false);
      toast({ title: "Tax slab added" });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: taxRatesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tax_rates"] });
      toast({ title: "Tax slab deleted" });
    },
  });

  const setDefaultMutation = useMutation({
    mutationFn: async (id: string) => {
      for (const t of taxes) {
        if ((t as any).is_default) {
          await taxRatesApi.update((t as any).id, { is_default: false });
        }
      }
      await taxRatesApi.update(id, { is_default: true });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tax_rates"] });
      toast({ title: "Default tax slab updated" });
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) => taxRatesApi.update(id, { is_active }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tax_rates"] }),
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-foreground font-display">Tax Rates (GST Slabs)</h2>
        <Button size="sm" onClick={() => setShowAdd(!showAdd)} disabled={!isAdmin}>
          {showAdd ? "Cancel" : "+ Add Tax Slab"}
        </Button>
      </div>

      {!isAdmin && <ReadOnlyNote />}

      {showAdd && (
        <div className="bg-card border border-border rounded-xl p-5 mb-4 max-w-lg">
          <h3 className="text-sm font-semibold text-card-foreground mb-3">New GST Slab</h3>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Slab Name</Label>
              <Input placeholder="e.g. GST 18%" value={name} onChange={e => setName(e.target.value)} disabled={!isAdmin} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Rate (%)</Label>
              <Input placeholder="18" type="number" value={rate} onChange={e => setRate(e.target.value)} disabled={!isAdmin} />
            </div>
          </div>
          {rate && Number(rate) > 0 && (
            <div className="bg-muted/50 rounded-lg p-3 mb-3 text-xs space-y-1">
              <p className="font-medium text-card-foreground">Auto-calculated split:</p>
              <div className="flex gap-4 text-muted-foreground">
                <span>CGST: {cgst}%</span>
                <span>SGST: {sgst}%</span>
                <span>IGST: {igst}%</span>
              </div>
            </div>
          )}
          <Button size="sm" onClick={() => createMutation.mutate()} disabled={!rate || createMutation.isPending || !isAdmin}>
            {createMutation.isPending ? "Adding..." : "Add Slab"}
          </Button>
        </div>
      )}

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center">
            <div className="inline-block h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-muted-foreground mt-2">Loading...</p>
          </div>
        ) : taxes.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">No tax slabs configured. Add your first GST slab.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="text-left px-5 py-2.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Tax Name</th>
                <th className="text-right px-5 py-2.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Rate</th>
                <th className="text-right px-5 py-2.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">CGST</th>
                <th className="text-right px-5 py-2.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">SGST</th>
                <th className="text-right px-5 py-2.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">IGST</th>
                <th className="text-center px-5 py-2.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Default</th>
                <th className="text-center px-5 py-2.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Active</th>
                <th className="text-right px-5 py-2.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider"></th>
              </tr>
            </thead>
            <tbody>
              {taxes.map((t: any) => (
                <TaxSlabRow
                  key={t.id}
                  tax={t}
                  canEdit={isAdmin}
                  onSetDefault={() => setDefaultMutation.mutate(t.id)}
                  onToggleActive={(active: boolean) => toggleActiveMutation.mutate({ id: t.id, is_active: active })}
                  onDelete={() => { if (confirm("Delete this tax slab?")) deleteMutation.mutate(t.id); }}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function TaxSlabRow({ tax, onSetDefault, onToggleActive, onDelete, canEdit }: {
  tax: any;
  onSetDefault: () => void;
  onToggleActive: (active: boolean) => void;
  onDelete: () => void;
  canEdit: boolean;
}) {
  return (
    <tr className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
      <td className="px-5 py-2.5">
        <div className="flex items-center gap-2">
          <span className="font-medium text-card-foreground">{tax.name}</span>
          {tax.is_default && (
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-primary/10 text-primary">
              <Star className="w-2.5 h-2.5" /> Default
            </span>
          )}
        </div>
      </td>
      <td className="px-5 py-2.5 text-right font-medium text-card-foreground">{tax.rate}%</td>
      <td className="px-5 py-2.5 text-right text-muted-foreground">{tax.cgst ?? (tax.rate / 2)}%</td>
      <td className="px-5 py-2.5 text-right text-muted-foreground">{tax.sgst ?? (tax.rate / 2)}%</td>
      <td className="px-5 py-2.5 text-right text-muted-foreground">{tax.igst ?? tax.rate}%</td>
      <td className="px-5 py-2.5 text-center">
        {canEdit && !tax.is_default && (
          <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground hover:text-primary" onClick={onSetDefault}>
            Set Default
          </Button>
        )}
      </td>
      <td className="px-5 py-2.5 text-center">
        <Switch checked={tax.is_active} onCheckedChange={onToggleActive} disabled={!canEdit} />
      </td>
      <td className="px-5 py-2.5 text-right">
        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={onDelete} disabled={!canEdit}>
          <Trash2 className="w-3.5 h-3.5 text-destructive" />
        </Button>
      </td>
    </tr>
  );
}

// ===== Invoice Settings =====
function InvoiceSettingsSection() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { userRole } = useAuth();
  const isAdmin = userRole === "admin";
  const { data: sequences = [], isLoading } = useQuery({ queryKey: ["document_sequences"], queryFn: documentSequencesApi.list });

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: any) => documentSequencesApi.update(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["document_sequences"] });
      toast({ title: "Sequence updated" });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  return (
    <div>
      <h2 className="text-lg font-semibold text-foreground mb-4 font-display">Document Number Series</h2>
      {!isAdmin && <ReadOnlyNote />}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {isLoading ? <div className="p-8 text-center text-muted-foreground">Loading...</div> : sequences.length === 0 ? <div className="p-8 text-center text-muted-foreground">No sequences configured.</div> : (
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border bg-muted/40">
              <th className="text-left px-5 py-2.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Document Type</th>
              <th className="text-left px-5 py-2.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Prefix</th>
              <th className="text-left px-5 py-2.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Next #</th>
              <th className="text-left px-5 py-2.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Padding</th>
              <th className="text-right px-5 py-2.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider"></th>
            </tr></thead>
            <tbody>{sequences.map((s: any) => (
              <SequenceRow key={s.id} seq={s} canEdit={isAdmin} onSave={(id: string, updates: any) => updateMutation.mutate({ id, updates })} />
            ))}</tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function SequenceRow({ seq, onSave, canEdit }: { seq: any; onSave: (id: string, updates: any) => void; canEdit: boolean }) {
  const [prefix, setPrefix] = useState(seq.prefix);
  const [nextNum, setNextNum] = useState(seq.next_number);
  const [padding, setPadding] = useState(seq.padding);
  const changed = prefix !== seq.prefix || nextNum !== seq.next_number || padding !== seq.padding;

  return (
    <tr className="border-b border-border last:border-0">
      <td className="px-5 py-2.5 text-card-foreground capitalize">{seq.document_type.replace(/_/g, " ")}</td>
      <td className="px-5 py-2"><Input className="h-8 w-24" value={prefix} onChange={e => setPrefix(e.target.value)} disabled={!canEdit} /></td>
      <td className="px-5 py-2"><Input className="h-8 w-20" type="number" value={nextNum} onChange={e => setNextNum(Number(e.target.value))} disabled={!canEdit} /></td>
      <td className="px-5 py-2"><Input className="h-8 w-16" type="number" value={padding} onChange={e => setPadding(Number(e.target.value))} disabled={!canEdit} /></td>
      <td className="px-5 py-2 text-right">
        {canEdit && changed && <Button size="sm" className="h-7 text-xs" onClick={() => onSave(seq.id, { prefix, next_number: nextNum, padding })}>Save</Button>}
      </td>
    </tr>
  );
}
