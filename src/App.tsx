import { Suspense, lazy, useEffect, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import logoOfficial from "@/assets/logo-official.webp";
import MobileBottomNav from "@/components/MobileBottomNav";
import { trackPageView } from "@/utils/analytics";
import { GoogleAnalytics } from "@/components/GoogleAnalytics";
import { NewsletterProvider, useNewsletter } from "@/contexts/NewsletterContext";
import { useCartDrawer } from "@/contexts/CartDrawerContext";
import LegacyRedirectHandler from "@/components/LegacyRedirectHandler";
import OfflineDetector from "@/components/OfflineDetector";

// Lazy load ChatbotWidget as it's not needed immediately
const ChatbotWidget = lazy(() => import("@/components/ChatbotWidget"));
const NewsletterPopup = lazy(() => import("@/components/NewsletterPopup"));
const CartDrawer = lazy(() => import("@/components/CartDrawer"));

const Index = lazy(() => import("./pages/Index"));
const Shop = lazy(() => import("./pages/Shop"));
const About = lazy(() => import("./pages/About"));
const Contact = lazy(() => import("./pages/Contact"));
const Auth = lazy(() => import("./pages/Auth"));
const Recipes = lazy(() => import("./pages/Recipes"));
const Forum = lazy(() => import("./pages/Forum"));
const ForumCategory = lazy(() => import("./pages/ForumCategory"));
const ForumTopic = lazy(() => import("./pages/ForumTopic"));
const Cart = lazy(() => import("./pages/Cart"));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const Checkout = lazy(() => import("./pages/Checkout"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const RecipeManagement = lazy(() => import("./pages/RecipeManagement"));
const RoleManagement = lazy(() => import("./pages/RoleManagement"));
const BecomeStockist = lazy(() => import("./pages/BecomeStockist"));
const TrackOrder = lazy(() => import("./pages/TrackOrder"));
const TrackParcel = lazy(() => import("./pages/TrackParcel"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const StoreLocator = lazy(() => import("./pages/StoreLocator"));
const RefundPolicy = lazy(() => import("./pages/RefundPolicy"));
const ShippingPolicy = lazy(() => import("./pages/ShippingPolicy"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const POPIACompliance = lazy(() => import("./pages/POPIACompliance"));
const Terms = lazy(() => import("./pages/Terms"));

const LikedItems = lazy(() => import("./pages/LikedItems"));
const RecentlyViewed = lazy(() => import("./pages/RecentlyViewed"));
const NotFound = lazy(() => import("./pages/NotFound"));

const Careers = lazy(() => import("./pages/Careers"));
const OurTeam = lazy(() => import("./pages/OurTeam"));
const Account = lazy(() => import("./pages/Account"));
const NewsletterUnsubscribe = lazy(() => import("./pages/NewsletterUnsubscribe"));
const PaymentSuccess = lazy(() => import("./pages/PaymentSuccess"));
const PaymentCancelled = lazy(() => import("./pages/PaymentCancelled"));
const EmployeeDashboard = lazy(() => import("./pages/EmployeeDashboard"));
const queryClient = new QueryClient();

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // Use requestAnimationFrame to batch with browser's paint cycle and avoid forced reflow
    requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0 });
    });
    // Track page views for analytics
    trackPageView(pathname);
  }, [pathname]);

  return null;
};

const AppContent = () => {
  const { isOpen, closeNewsletter } = useNewsletter();
  const { isOpen: isCartOpen, closeDrawer } = useCartDrawer();
  const [showWidgets, setShowWidgets] = useState(false);

  // Defer non-critical widgets to improve TTI - use requestIdleCallback for better performance
  useEffect(() => {
    const showWidgetsWhenIdle = () => setShowWidgets(true);
    
    if ('requestIdleCallback' in window) {
      const id = (window as any).requestIdleCallback(showWidgetsWhenIdle, { timeout: 4000 });
      return () => (window as any).cancelIdleCallback(id);
    } else {
      const timer = setTimeout(showWidgetsWhenIdle, 4000);
      return () => clearTimeout(timer);
    }
  }, []);
  
  return (
    <>
      <OfflineDetector />
      <GoogleAnalytics />
      <LegacyRedirectHandler />
      <ScrollToTop />
      <div className="pb-16 md:pb-0">
        <Suspense fallback={
          <div className="min-h-screen flex flex-col items-center justify-center gap-4">
            <img src={logoOfficial} alt="Maharaja's Spices loading" className="h-16 w-16 animate-pulse" />
            <div className="h-1.5 w-48 bg-muted rounded overflow-hidden">
              <div className="h-full w-1/3 bg-primary animate-[pulse_1.2s_ease-in-out_infinite]"></div>
            </div>
          </div>
        }>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/product/:id" element={<ProductDetail />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/recipes" element={<Recipes />} />
            <Route path="/forum" element={<Forum />} />
            <Route path="/forum/category/:categoryId" element={<ForumCategory />} />
            <Route path="/forum/topic/:topicId" element={<ForumTopic />} />
            <Route path="/admin-dashboard" element={<AdminDashboard />} />
            <Route path="/recipe-management" element={<RecipeManagement />} />
            <Route path="/role-management" element={<RoleManagement />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/become-stockist" element={<BecomeStockist />} />
            <Route path="/track-order" element={<TrackOrder />} />
            <Route path="/track-parcel" element={<TrackParcel />} />
            <Route path="/store-locator" element={<StoreLocator />} />
            <Route path="/refund-policy" element={<RefundPolicy />} />
            <Route path="/shipping-policy" element={<ShippingPolicy />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/popia-compliance" element={<POPIACompliance />} />
            <Route path="/terms" element={<Terms />} />
            
            <Route path="/liked-items" element={<LikedItems />} />
            <Route path="/recently-viewed" element={<RecentlyViewed />} />
            <Route path="/careers" element={<Careers />} />
            {/* OurTeam route removed - page code preserved */}
            <Route path="/account" element={<Account />} />
            <Route path="/newsletter/unsubscribe" element={<NewsletterUnsubscribe />} />
            <Route path="/payment-success" element={<PaymentSuccess />} />
            <Route path="/payment-cancelled" element={<PaymentCancelled />} />
            <Route path="/employee-dashboard" element={<EmployeeDashboard />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <CartDrawer open={isCartOpen} onOpenChange={closeDrawer} />
          {showWidgets && <ChatbotWidget />}
          {showWidgets && <NewsletterPopup isOpen={isOpen} onClose={closeNewsletter} />}
        </Suspense>
      </div>
      <MobileBottomNav />
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <NewsletterProvider>
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </NewsletterProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
