import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";
import AppLayout from "@/components/AppLayout";
import AuthPage from "@/pages/AuthPage";
import Dashboard from "@/pages/Dashboard";
import CustomersPage from "@/pages/sales/CustomersPage";
import CustomerDetailPage from "@/pages/sales/CustomerDetailPage";
import InvoicesPage from "@/pages/sales/InvoicesPage";
import InvoiceDetailPage from "@/pages/sales/InvoiceDetailPage";
import InvoiceEditorPage from "@/pages/sales/InvoiceEditorPage";
import QuotationsPage from "@/pages/sales/QuotationsPage";
import QuotationDetailPage from "@/pages/sales/QuotationDetailPage";
import QuotationEditorPage from "@/pages/sales/QuotationEditorPage";
import SalesOrdersPage from "@/pages/sales/SalesOrdersPage";
import SalesOrderDetailPage from "@/pages/sales/SalesOrderDetailPage";
import SalesOrderEditorPage from "@/pages/sales/SalesOrderEditorPage";
import DeliveryChallansPage from "@/pages/sales/DeliveryChallansPage";
import DeliveryChallanDetailPage from "@/pages/sales/DeliveryChallanDetailPage";
import DeliveryChallanEditorPage from "@/pages/sales/DeliveryChallanEditorPage";
import PaymentsReceivedPage from "@/pages/sales/PaymentsReceivedPage";
import PaymentReceivedDetailPage from "@/pages/sales/PaymentReceivedDetailPage";
import CreditNotesPage from "@/pages/sales/CreditNotesPage";
import CreditNoteDetailPage from "@/pages/sales/CreditNoteDetailPage";
import CreditNoteEditorPage from "@/pages/sales/CreditNoteEditorPage";
import RecurringInvoicesPage from "@/pages/sales/RecurringInvoicesPage";
import RecurringInvoiceDetailPage from "@/pages/sales/RecurringInvoiceDetailPage";
import SalesReturnsPage from "@/pages/sales/SalesReturnsPage";
import SalesReturnDetailPage from "@/pages/sales/SalesReturnDetailPage";
import SalesReturnEditorPage from "@/pages/sales/SalesReturnEditorPage";
import VendorsPage from "@/pages/purchase/VendorsPage";
import VendorDetailPage from "@/pages/purchase/VendorDetailPage";
import PurchaseOrdersPage from "@/pages/purchase/PurchaseOrdersPage";
import PurchaseOrderDetailPage from "@/pages/purchase/PurchaseOrderDetailPage";
import PurchaseOrderEditorPage from "@/pages/purchase/PurchaseOrderEditorPage";
import BillsPage from "@/pages/purchase/BillsPage";
import BillDetailPage from "@/pages/purchase/BillDetailPage";
import BillEditorPage from "@/pages/purchase/BillEditorPage";
import PaymentsMadePage from "@/pages/purchase/PaymentsMadePage";
import PaymentMadeDetailPage from "@/pages/purchase/PaymentMadeDetailPage";
import VendorCreditsPage from "@/pages/purchase/VendorCreditsPage";
import VendorCreditDetailPage from "@/pages/purchase/VendorCreditDetailPage";
import VendorCreditEditorPage from "@/pages/purchase/VendorCreditEditorPage";
import RecurringBillsPage from "@/pages/purchase/RecurringBillsPage";
import RecurringBillDetailPage from "@/pages/purchase/RecurringBillDetailPage";
import PurchaseReturnsPage from "@/pages/purchase/PurchaseReturnsPage";
import PurchaseReturnDetailPage from "@/pages/purchase/PurchaseReturnDetailPage";
import ItemsPage from "@/pages/inventory/ItemsPage";
import ItemDetailPage from "@/pages/inventory/ItemDetailPage";
import CategoriesPage from "@/pages/inventory/CategoriesPage";
import CategoryDetailPage from "@/pages/inventory/CategoryDetailPage";
import PriceListsPage from "@/pages/inventory/PriceListsPage";
import PriceListDetailPage from "@/pages/inventory/PriceListDetailPage";
import WarehousesPage from "@/pages/inventory/WarehousesPage";
import WarehouseDetailPage from "@/pages/inventory/WarehouseDetailPage";
import StockTransfersPage from "@/pages/inventory/StockTransfersPage";
import StockTransferDetailPage from "@/pages/inventory/StockTransferDetailPage";
import AdjustmentsPage from "@/pages/inventory/AdjustmentsPage";
import AdjustmentDetailPage from "@/pages/inventory/AdjustmentDetailPage";
import StockLedgerPage from "@/pages/inventory/StockLedgerPage";
import StockMovementDetailPage from "@/pages/inventory/StockMovementDetailPage";
import ChartOfAccountsPage from "@/pages/accounting/ChartOfAccountsPage";
import JournalEntriesPage from "@/pages/accounting/JournalEntriesPage";
import LedgerPage from "@/pages/accounting/LedgerPage";
import TrialBalancePage from "@/pages/accounting/TrialBalancePage";
import ProfitLossPage from "@/pages/accounting/ProfitLossPage";
import BalanceSheetPage from "@/pages/accounting/BalanceSheetPage";
import CashFlowPage from "@/pages/accounting/CashFlowPage";
import DayBookPage from "@/pages/accounting/DayBookPage";
import GSTSettingsPage from "@/pages/gst/GSTSettingsPage";
import GSTR1Page from "@/pages/gst/GSTR1Page";
import GSTR3BPage from "@/pages/gst/GSTR3BPage";
import HSNSummaryPage from "@/pages/gst/HSNSummaryPage";
import EInvoicePage from "@/pages/gst/EInvoicePage";
import EWayBillPage from "@/pages/gst/EWayBillPage";
import ExpensesPage from "@/pages/ExpensesPage";
import POSPage from "@/pages/POSPage";
import POSSessionsPage from "@/pages/pos/POSSessionsPage";
import POSOrdersPage from "@/pages/pos/POSOrdersPage";
import POSSessionDetailPage from "@/pages/pos/POSSessionDetailPage";
import POSOrderDetailPage from "@/pages/pos/POSOrderDetailPage";
import ReportsPage from "@/pages/ReportsPage";
import WorkflowsPage from "@/pages/automation/WorkflowsPage";
import RemindersPage from "@/pages/automation/RemindersPage";
import SettingsPage from "@/pages/SettingsPage";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<AuthPage />} />
            <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/sales/customers" element={<CustomersPage />} />
              <Route path="/sales/customers/:id" element={<CustomerDetailPage />} />
              <Route path="/sales/quotations" element={<QuotationsPage />} />
              <Route path="/sales/quotations/new" element={<QuotationEditorPage />} />
              <Route path="/sales/quotations/:id/edit" element={<QuotationEditorPage />} />
              <Route path="/sales/quotations/:id" element={<QuotationDetailPage />} />
              <Route path="/sales/orders" element={<SalesOrdersPage />} />
              <Route path="/sales/orders/new" element={<SalesOrderEditorPage />} />
              <Route path="/sales/orders/:id/edit" element={<SalesOrderEditorPage />} />
              <Route path="/sales/orders/:id" element={<SalesOrderDetailPage />} />
              <Route path="/sales/delivery-challans" element={<DeliveryChallansPage />} />
              <Route path="/sales/delivery-challans/new" element={<DeliveryChallanEditorPage />} />
              <Route path="/sales/delivery-challans/:id/edit" element={<DeliveryChallanEditorPage />} />
              <Route path="/sales/delivery-challans/:id" element={<DeliveryChallanDetailPage />} />
              <Route path="/sales/invoices" element={<InvoicesPage />} />
              <Route path="/sales/invoices/new" element={<InvoiceEditorPage />} />
              <Route path="/sales/invoices/:id/edit" element={<InvoiceEditorPage />} />
              <Route path="/sales/invoices/:id" element={<InvoiceDetailPage />} />
              <Route path="/sales/recurring-invoices" element={<RecurringInvoicesPage />} />
              <Route path="/sales/recurring-invoices/new" element={<RecurringInvoicesPage />} />
              <Route path="/sales/recurring-invoices/:id" element={<RecurringInvoiceDetailPage />} />
              <Route path="/sales/payments" element={<PaymentsReceivedPage />} />
              <Route path="/sales/payments/new" element={<PaymentsReceivedPage />} />
              <Route path="/sales/payments/:id" element={<PaymentReceivedDetailPage />} />
              <Route path="/sales/credit-notes" element={<CreditNotesPage />} />
              <Route path="/sales/credit-notes/new" element={<CreditNoteEditorPage />} />
              <Route path="/sales/credit-notes/:id/edit" element={<CreditNoteEditorPage />} />
              <Route path="/sales/credit-notes/:id" element={<CreditNoteDetailPage />} />
              <Route path="/sales/returns" element={<SalesReturnsPage />} />
              <Route path="/sales/returns/new" element={<SalesReturnEditorPage />} />
              <Route path="/sales/returns/:id/edit" element={<SalesReturnEditorPage />} />
              <Route path="/sales/returns/:id" element={<SalesReturnDetailPage />} />
              <Route path="/purchase/vendors" element={<VendorsPage />} />
              <Route path="/purchase/vendors/:id" element={<VendorDetailPage />} />
              <Route path="/purchase/orders" element={<PurchaseOrdersPage />} />
              <Route path="/purchase/orders/new" element={<PurchaseOrderEditorPage />} />
              <Route path="/purchase/orders/:id/edit" element={<PurchaseOrderEditorPage />} />
              <Route path="/purchase/orders/:id" element={<PurchaseOrderDetailPage />} />
              <Route path="/purchase/bills" element={<BillsPage />} />
              <Route path="/purchase/bills/new" element={<BillEditorPage />} />
              <Route path="/purchase/bills/:id/edit" element={<BillEditorPage />} />
              <Route path="/purchase/bills/:id" element={<BillDetailPage />} />
              <Route path="/purchase/recurring-bills" element={<RecurringBillsPage />} />
              <Route path="/purchase/recurring-bills/new" element={<RecurringBillsPage />} />
              <Route path="/purchase/recurring-bills/:id" element={<RecurringBillDetailPage />} />
              <Route path="/purchase/payments" element={<PaymentsMadePage />} />
              <Route path="/purchase/payments/new" element={<PaymentsMadePage />} />
              <Route path="/purchase/payments/:id" element={<PaymentMadeDetailPage />} />
              <Route path="/purchase/vendor-credits" element={<VendorCreditsPage />} />
              <Route path="/purchase/vendor-credits/new" element={<VendorCreditsPage />} />
              <Route path="/purchase/vendor-credits/:id" element={<VendorCreditDetailPage />} />
              <Route path="/purchase/vendor-credits/:id/edit" element={<VendorCreditEditorPage />} />
              <Route path="/purchase/returns" element={<PurchaseReturnsPage />} />
              <Route path="/purchase/returns/new" element={<PurchaseReturnsPage />} />
              <Route path="/purchase/returns/:id" element={<PurchaseReturnDetailPage />} />
              <Route path="/inventory/items" element={<ItemsPage />} />
              <Route path="/inventory/items/:id" element={<ItemDetailPage />} />
              <Route path="/inventory/categories" element={<CategoriesPage />} />
              <Route path="/inventory/categories/:id" element={<CategoryDetailPage />} />
              <Route path="/inventory/price-lists" element={<PriceListsPage />} />
              <Route path="/inventory/price-lists/:id" element={<PriceListDetailPage />} />
              <Route path="/inventory/warehouses" element={<WarehousesPage />} />
              <Route path="/inventory/warehouses/:id" element={<WarehouseDetailPage />} />
              <Route path="/inventory/stock-transfers" element={<StockTransfersPage />} />
              <Route path="/inventory/stock-transfers/:id" element={<StockTransferDetailPage />} />
              <Route path="/inventory/adjustments" element={<AdjustmentsPage />} />
              <Route path="/inventory/adjustments/:id" element={<AdjustmentDetailPage />} />
              <Route path="/inventory/stock-ledger" element={<StockLedgerPage />} />
              <Route path="/inventory/stock-ledger/:id" element={<StockMovementDetailPage />} />
              <Route path="/expenses" element={<ExpensesPage />} />
              <Route path="/accounting/chart" element={<ChartOfAccountsPage />} />
              <Route path="/accounting/journals" element={<JournalEntriesPage />} />
              <Route path="/accounting/ledger" element={<LedgerPage />} />
              <Route path="/accounting/trial-balance" element={<TrialBalancePage />} />
              <Route path="/accounting/pnl" element={<ProfitLossPage />} />
              <Route path="/accounting/balance-sheet" element={<BalanceSheetPage />} />
              <Route path="/accounting/cash-flow" element={<CashFlowPage />} />
              <Route path="/accounting/day-book" element={<DayBookPage />} />
              <Route path="/gst/settings" element={<GSTSettingsPage />} />
              <Route path="/gst/gstr1" element={<GSTR1Page />} />
              <Route path="/gst/gstr3b" element={<GSTR3BPage />} />
              <Route path="/gst/hsn" element={<HSNSummaryPage />} />
              <Route path="/gst/einvoice" element={<EInvoicePage />} />
              <Route path="/gst/eway" element={<EWayBillPage />} />
              <Route path="/pos" element={<POSPage />} />
              <Route path="/pos/sessions" element={<POSSessionsPage />} />
              <Route path="/pos/sessions/:id" element={<POSSessionDetailPage />} />
              <Route path="/pos/orders" element={<POSOrdersPage />} />
              <Route path="/pos/orders/:id" element={<POSOrderDetailPage />} />
              <Route path="/automation/workflows" element={<WorkflowsPage />} />
              <Route path="/automation/reminders" element={<RemindersPage />} />
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
