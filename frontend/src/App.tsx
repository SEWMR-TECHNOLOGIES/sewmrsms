import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import FeaturesPage from "./pages/Features";
import PricingPage from "./pages/Pricing";
import DevelopersPage from "./pages/Developers";
import ContactPage from "./pages/Contact";
import SignInPage from "./pages/SignIn";
import SignUpPage from "./pages/SignUp";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import CookiePolicy from "./pages/CookiePolicy";
import ScrollToTop from "./components/ScrollToTop";
import NotFound from "./pages/NotFound";
import { DashboardLayout } from "./components/dashboard/DashboardLayout";
import Dashboard from "./pages/dashboard/Dashboard";
import Contacts from "./pages/dashboard/contacts/Contacts";
import QuickSend from "./pages/dashboard/messages/QuickSend";
import RequestSenderID from "./pages/dashboard/sender-ids/RequestSenderID";
import RequestPasswordResetPage from "./pages/ResetPasswordRequest";
import ResetPasswordPage from "./pages/ResetPassword";
import UploadAgreement from "./pages/dashboard/sender-ids/UploadSignedAgreement";
import SenderIdPropagationStatus from "./pages/dashboard/sender-ids/PropagationStatus";
import ContactGroups from "./pages/dashboard/contacts/ContactGroups";
import AddContacts from "./pages/dashboard/contacts/AddContact";
import CreateTemplate from "./pages/dashboard/message-templates/CreateTemplate";
import TemplatesPage from "./pages/dashboard/message-templates/Templates";
import SendFromTemplate from "./pages/dashboard/messages/SendFromFile";
import BillingPurchase from "./pages/dashboard/billing/BillingPurchase";
import PaymentHistory from "./pages/dashboard/billing/PaymentHistory";
import CreateOrder from "./pages/dashboard/billing/CreateOrder";
import OrderPayment from "./pages/dashboard/billing/OrderPayment";
import MobilePaymentWaiting from "./pages/dashboard/billing/MobilePaymentConfirmation";
import Billing from "./pages/dashboard/billing/Billing";
import CreateAPIToken from "./pages/dashboard/settings/CreateAPIToken";
import APITokens from "./pages/dashboard/settings/APITokens";
import MessageHistory from "./pages/dashboard/messages/MessageHistory";
import UserSenderIds from "./pages/dashboard/sender-ids/SenderIds";
import UserSenderRequests from "./pages/dashboard/sender-ids/SenderIdRequests";
import OutageNotificationSettings from "./pages/dashboard/settings/OutageNotification";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/features" element={<FeaturesPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/developers" element={<DevelopersPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/signin" element={<SignInPage />} />
          <Route path="/signup" element={<SignUpPage />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms-of-service" element={<TermsOfService />} />
          <Route path="/cookie-policy" element={<CookiePolicy />} />
          <Route path="/forgot-password" element={<RequestPasswordResetPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          
          {/* Dashboard Routes */}
          <Route path="/console" element={<DashboardLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="contacts" element={<Contacts />} />
            <Route path="contacts/groups" element={<ContactGroups />} />
            <Route path="contacts/new" element={<AddContacts />} />
            <Route path="contacts/import" element={<div>Import Contacts</div>} />
            <Route path="messages/quick-send" element={<QuickSend />} />
            <Route path="messages/from-template" element={<SendFromTemplate />} />
            <Route path="messages/history" element={<MessageHistory />} />
            <Route path="templates" element={<TemplatesPage />} />
            <Route path="templates/new" element={<CreateTemplate />} />
            <Route path="reports/delivery" element={<div>Delivery Reports</div>} />
            <Route path="reports/analytics" element={<div>Analytics</div>} />

            {/* Billing routes */}
            <Route path="billing" element={<Billing />} />
            <Route path="billing/purchase" element={<BillingPurchase />} />
            <Route path="billing/history" element={<PaymentHistory />} />
            <Route path="billing/invoices" element={<div>Invoices</div>} />
            <Route path="billing/:packageUuid" element={<CreateOrder />} />
            <Route path="billing/:orderUuid/pay" element={<OrderPayment />} />
            <Route path="billing/mobile-payment-waiting/:orderUuid/:checkoutRequestId" element={<MobilePaymentWaiting />} />

            {/* Sender ID routes */}
            <Route path="sender-ids" element={<UserSenderIds />} />
            <Route path="sender-ids/requests" element={<UserSenderRequests />} />
            <Route path="sender-ids/request" element={<RequestSenderID />} />
            <Route path="sender-ids/networks" element={<div>Network Status</div>} />
            <Route path="sender-ids/:uuid/upload-agreement" element={<UploadAgreement />} />
            <Route path="sender-ids/:uuid/propagation" element={<SenderIdPropagationStatus />} />

            {/* Settings routes */}
            <Route path="settings/profile" element={<div>Profile Settings</div>} />
            <Route path="settings/api" element={<div>API Settings</div>} />
            <Route path="settings/create-token" element={<CreateAPIToken />} />
            <Route path="settings/api-tokens" element={<APITokens />} />
            <Route path="settings/outage-notifications" element={<OutageNotificationSettings />} />
            <Route path="settings/notifications" element={<div>Notification Settings</div>} />
          </Route>

          
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
