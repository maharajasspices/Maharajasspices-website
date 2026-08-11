import Header from "@/components/Header";
import Footer from "@/components/Footer";
import RevealOnScroll from "@/components/RevealOnScroll";
import { useSEO } from "@/hooks/useSEO";

const PrivacyPolicy = () => {
  useSEO({
    title: "Privacy Policy | Maharaja's Spices - How We Protect Your Data",
    description: "Maharaja's Spices privacy policy explains how we collect, use, and protect your personal information in compliance with POPIA. Shop with confidence.",
    keywords: "privacy policy, POPIA compliant, data protection, Maharaja's Spices privacy, South Africa",
    url: "https://maharajasspices.co.za/privacy-policy",
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <RevealOnScroll direction="up">
          <h1 className="text-4xl font-bold mb-6">Privacy Policy</h1>
          <div className="prose prose-lg max-w-none dark:prose-invert">
            <p className="text-muted-foreground mb-6"><strong>Effective Date: 2025</strong></p>
            
            <p className="mb-6">
              Maharajas Spices is committed to protecting your privacy in accordance with the Protection of Personal Information Act (POPIA) of South Africa. This Privacy Policy outlines how we collect, use, and safeguard your personal information when you use our website or services.
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-4">1. Information We Collect</h2>
            <p className="mb-4">We may collect the following personal information when you interact with our website:</p>
            <ul className="list-disc pl-6 mb-6 space-y-2">
              <li>Name and surname</li>
              <li>Email address</li>
              <li>Shipping and billing addresses</li>
              <li>Phone number</li>
              <li>Payment details (processed securely via third-party providers)</li>
              <li>Browsing behaviour (via cookies and analytics tools)</li>
            </ul>

            <h2 className="text-2xl font-bold mt-8 mb-4">2. Legal Basis for Processing (POPIA Compliance)</h2>
            <p className="mb-4">Under POPIA, we process your personal information based on the following lawful grounds:</p>
            <ul className="list-disc pl-6 mb-6 space-y-2">
              <li><strong>Consent:</strong> When you submit forms on our website (contact forms, newsletter subscriptions, stockist applications, account registration, checkout), you provide explicit consent by agreeing to our Privacy Policy and Terms & Conditions.</li>
              <li><strong>Contractual Necessity:</strong> We process your information to fulfil orders, deliver products, and provide requested services.</li>
              <li><strong>Legitimate Interest:</strong> We may use your information for fraud prevention, security, and improving our services.</li>
              <li><strong>Legal Obligation:</strong> We may process data to comply with tax, consumer protection, or other legal requirements.</li>
            </ul>

            <h2 className="text-2xl font-bold mt-8 mb-4">3. How We Use Your Information</h2>
            <p className="mb-4">Your information is used to:</p>
            <ul className="list-disc pl-6 mb-6 space-y-2">
              <li>Process and deliver orders</li>
              <li>Respond to enquiries submitted via contact forms</li>
              <li>Send marketing communications (only with your explicit consent)</li>
              <li>Process stockist and business partnership applications</li>
              <li>Improve our website and service offering</li>
              <li>Comply with legal obligations</li>
            </ul>

            <h2 className="text-2xl font-bold mt-8 mb-4">4. Data Collection Through Forms</h2>
            <p className="mb-4">We collect personal information through various forms on our website:</p>
            <ul className="list-disc pl-6 mb-6 space-y-2">
              <li><strong>Contact Form:</strong> Name, email, phone, and message content to respond to your enquiries.</li>
              <li><strong>Newsletter Subscription:</strong> Email address to send promotional content (with your explicit consent).</li>
              <li><strong>Account Registration:</strong> Name, email, phone, and optional birthday to create and manage your account.</li>
              <li><strong>Checkout Form:</strong> Billing and shipping details to process and deliver your orders.</li>
              <li><strong>Stockist Application:</strong> Business and contact details to assess partnership opportunities.</li>
            </ul>
            <p className="mb-6">
              By submitting any form on our website, you acknowledge that you have read and agree to this Privacy Policy and our Terms & Conditions. This constitutes valid consent under POPIA Section 11.
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-4">5. Data Protection and Compliance</h2>
            <p className="mb-6">
              We take appropriate technical and organisational measures to protect your personal information in accordance with the Protection of Personal Information Act (POPIA). All payment data is encrypted and handled by secure third-party processors who are PCI-Compliant. For detailed information about our data protection practices, please review our <a href="/popia-compliance" className="text-primary hover:underline">POPIA Compliance Statement</a>.
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-4">6. Sharing Your Information</h2>
            <p className="mb-4">We do not sell your data. We may share it only with:</p>
            <ul className="list-disc pl-6 mb-6 space-y-2">
              <li>Trusted third-party service providers (e.g., couriers, payment gateways, email service providers)</li>
              <li>Legal authorities if required by law</li>
            </ul>

            <h2 className="text-2xl font-bold mt-8 mb-4">7. Your Rights Under POPIA</h2>
            <p className="mb-4">You have the right to:</p>
            <ul className="list-disc pl-6 mb-6 space-y-2">
              <li>Access your personal information we hold</li>
              <li>Request correction of inaccurate information</li>
              <li>Request deletion of your personal information</li>
              <li>Object to processing of your information</li>
              <li>Withdraw consent at any time</li>
              <li>Lodge a complaint with the Information Regulator</li>
              <li>Opt-out of marketing communications at any time</li>
            </ul>

            <h2 className="text-2xl font-bold mt-8 mb-4">8. Data Retention</h2>
            <p className="mb-6">
              We retain your personal information only for as long as necessary to fulfil the purposes for which it was collected, or as required by law. Order records are retained for tax and legal compliance purposes.
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-4">9. Cookies</h2>
            <p className="mb-6">
              Our site uses cookies to enhance your experience. You can disable cookies via your browser settings.
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-4">10. Contact</h2>
            <p className="mb-2">For privacy-related inquiries or to exercise your POPIA rights, please email:</p>
            <p><a href="mailto:e-commerce@maharajasspices.co.za" className="text-primary hover:underline">e-commerce@maharajasspices.co.za</a></p>
          </div>
        </RevealOnScroll>
      </main>
      <Footer />
    </div>
  );
};

export default PrivacyPolicy;