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
import BillingPurchase from "./pages/dashboard/billing/BillingPurchase";
import PaymentHistory from "./pages/dashboard/billing/PaymentHistory";
import SenderIds from "./pages/dashboard/sender-ids/SenderIds";
import RequestSenderID from "./pages/dashboard/sender-ids/RequestSenderID";
import RequestPasswordResetPage from "./pages/ResetPasswordRequest";
import ResetPasswordPage from "./pages/ResetPassword";
import UploadAgreement from "./pages/dashboard/sender-ids/UploadSignedAgreement";
import SenderIdPropagationStatus from "./pages/dashboard/sender-ids/PropagationStatus";
import ContactGroups from "./pages/dashboard/contacts/ContactGroups";

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
            <Route path="contacts/new" element={<div>New Contact Form</div>} />
            <Route path="contacts/import" element={<div>Import Contacts</div>} />
            <Route path="messages/quick-send" element={<QuickSend />} />
            <Route path="messages/template" element={<div>Template Send</div>} />
            <Route path="messages/history" element={<div>Message History</div>} />
            <Route path="messages/templates" element={<div>Templates</div>} />
            <Route path="reports/delivery" element={<div>Delivery Reports</div>} />
            <Route path="reports/analytics" element={<div>Analytics</div>} />
            <Route path="billing/purchase" element={<BillingPurchase />} />
            <Route path="billing/history" element={<PaymentHistory />} />
            <Route path="billing/invoices" element={<div>Invoices</div>} />
            <Route path="sender-ids" element={<SenderIds />} />
            <Route path="sender-ids/request" element={<RequestSenderID />} />
            <Route path="sender-ids/networks" element={<div>Network Status</div>} />
            <Route path="settings/profile" element={<div>Profile Settings</div>} />
            <Route path="settings/api" element={<div>API Settings</div>} />
            <Route path="settings/notifications" element={<div>Notification Settings</div>} />
            <Route path="sender-ids/:uuid/upload-agreement" element={<UploadAgreement />}/>
            <Route path="sender-ids/:uuid/propagation" element={<SenderIdPropagationStatus />}/>
          </Route>
          
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
