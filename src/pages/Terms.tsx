import Header from "@/components/Header";
import Footer from "@/components/Footer";
import RevealOnScroll from "@/components/RevealOnScroll";
import { useSEO } from "@/hooks/useSEO";

const Terms = () => {
  useSEO({
    title: "Terms & Conditions | Maharaja's Spices - Online Spice Store",
    description: "Read the Terms & Conditions for shopping at Maharaja's Spices. Covers ordering, payment, delivery, returns and usage of our online spice store in South Africa.",
    keywords: "terms and conditions, Maharaja's Spices terms, online spice store terms, South Africa",
    url: "https://maharajasspices.co.za/terms",
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <RevealOnScroll direction="up">
          <h1 className="text-4xl font-bold mb-6">Terms and Conditions</h1>
          <div className="prose prose-lg max-w-none dark:prose-invert">
            <p className="text-muted-foreground mb-6"><strong>Effective Date: 2025</strong></p>
            
            <p className="mb-6">
              Welcome to Maharajas Spices. By accessing and using our website (the "Site"), purchasing our products, or interacting with us online, you agree to be bound by the following Terms and Conditions. Please read them carefully. These Terms and Conditions are subject to change at management discretion, should this be the case, a revised copy shall be available on our website for user review. These Terms and Conditions ("Terms") govern your use of the products, services, and website provided by Maharaja's Group of Companies (hereinafter referred to as "Maharaja's Spices"). By accessing or using any part of our services, you agree to be bound by these Terms.
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-4">1. Use of the Site</h2>
            <p className="mb-6">
              You agree to use the Site for lawful purposes only. You must not use the Site in any way that violates applicable laws or infringes on the rights of others.
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-4">2. Intellectual Property</h2>
            <p className="mb-6">
              All content on this Site, including logos, product names, images, graphics, text, and recipes, is the property of Maharaja's Spices and is protected by copyright, trademark, and other intellectual property laws. You may not reproduce, distribute, or use our content without written permission. Maharajas Group of companies is defined as herein referred to as Maharajas Spices.
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-4">3. Products and Orders</h2>
            <p className="mb-4">
              We make every effort to display our products as accurately as possible. However, colours, textures, and packaging may vary slightly from what is shown online.
            </p>
            <ul className="list-disc pl-6 mb-6 space-y-2">
              <li>All orders are subject to availability and confirmation.</li>
              <li>We reserve the right to limit quantities, cancel orders, or modify product offerings at any time.</li>
              <li>Prices are subject to change without prior notice.</li>
            </ul>

            <h2 className="text-2xl font-bold mt-8 mb-4">4. Payments</h2>
            <p className="mb-6">
              All payments made through the Site must be authorised. We use secure third-party payment gateways to process your transactions. Maharajas Spices does not store your credit/debit card information.
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-4">5. Shipping & Delivery</h2>
            <p className="mb-6">
              We aim to dispatch all orders within the indicated timelines. Shipping times may vary depending on your location and chosen delivery method. Maharajas Spices is not responsible for delays caused by couriers, customs, or unforeseen circumstances. Whilst every effort is made to ensure the correctness of product delivery, Maharajas Spices accepts no responsibility for and/or liability for defective and/or incorrect product; however, we will do everything within our means to rectify the matter should the need arise.
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-4">6. Returns & Refunds</h2>
            <p className="mb-6">
              If you receive a damaged or incorrect product, please contact us at <a href="mailto:e-commerce@maharajasspices.co.za" className="text-primary hover:underline">e-commerce@maharajasspices.co.za</a> within 7 days of delivery. Due to the nature of our products, we do not accept returns for opened items unless faulty. All refund requests will be handled in accordance with our Refund Policy.
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-4">7. User-Generated Content</h2>
            <p className="mb-6">
              If you tag or submit photos, testimonials, or reviews on any of our social media accounts or our Site, you grant Maharajas Spices the right to use this content for marketing and promotional purposes, including online and print platforms.
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-4">8. Data Collection and Consent</h2>
            <p className="mb-4">
              By using our website and submitting information through our forms, you consent to the collection and processing of your personal data in accordance with our Privacy Policy and the Protection of Personal Information Act (POPIA).
            </p>
            <p className="mb-4">This includes information collected through:</p>
            <ul className="list-disc pl-6 mb-6 space-y-2">
              <li>Contact forms and enquiries</li>
              <li>Newsletter subscriptions</li>
              <li>Account registration</li>
              <li>Checkout and order processing</li>
              <li>Stockist and partnership applications</li>
            </ul>
            <p className="mb-6">
              We are legally entitled to collect this information to provide our services, process transactions, respond to enquiries, and fulfil our contractual obligations. By agreeing to these Terms, you confirm your consent under POPIA Section 11.
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-4">9. Privacy</h2>
            <p className="mb-6">
              Your personal information is handled in accordance with our <a href="/privacy-policy" className="text-primary hover:underline">Privacy Policy</a>, which outlines how we collect, use, and protect your data in compliance with POPIA.
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-4">10. Limitation of Liability</h2>
            <p className="mb-6">
              To the fullest extent permitted by law, Maharaja's Spices is not liable for any indirect, incidental, or consequential damages arising from your use of the Site or products. All products are consumed at your own risk; please check ingredient lists for potential allergens. Without detracting from any of the other provisions of this Agreement, Maharaja's Spices shall not be liable to the customer for any loss or damage suffered by the customer, whether such loss is direct, indirect, incidental, or consequential.
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-4">11. Indemnification</h2>
            <p className="mb-6">
              You agree to indemnify and hold harmless Maharajas Spices, its directors, employees, and partners from any claim or demand made by any third party due to your breach of these Terms.
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-4">12. Governing Law</h2>
            <p className="mb-6">
              These Terms and Conditions are governed by the laws of South Africa, and any disputes shall be resolved in the applicable courts of that jurisdiction.
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-4">13. Modifications</h2>
            <p className="mb-6">
              Maharajas Spices reserves the right to update these Terms at any time without notice. It is your responsibility to review the Terms periodically for any changes.
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-4">14. Contact Us</h2>
            <p className="mb-2">If you have any questions or concerns, please contact our customer service team at:</p>
            <p className="mb-1"><a href="mailto:e-commerce@maharajasspices.co.za" className="text-primary hover:underline">e-commerce@maharajasspices.co.za</a></p>
            <p><a href="tel:+27684051374" className="text-primary hover:underline">+27 68 405 1374</a></p>
          </div>
        </RevealOnScroll>
      </main>
      <Footer />
    </div>
  );
};

export default Terms;