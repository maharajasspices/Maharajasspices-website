import Header from "@/components/Header";
import Footer from "@/components/Footer";
import RevealOnScroll from "@/components/RevealOnScroll";
import { useSEO } from "@/hooks/useSEO";

const RefundPolicy = () => {
  useSEO({
    title: "Refund & Returns Policy | Maharaja's Spices - Easy Returns",
    description: "View Maharaja's Spices refund and returns policy. We offer hassle-free returns on qualifying spice and seasoning purchases within South Africa.",
    keywords: "refund policy, returns policy, Maharaja's Spices refund, spice returns South Africa",
    url: "https://maharajasspices.co.za/refund-policy",
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <RevealOnScroll direction="up">
          <h1 className="text-4xl font-bold mb-6">Refund & Return Policy</h1>
          <div className="prose prose-lg max-w-none dark:prose-invert">
            <p className="text-muted-foreground mb-6"><strong>Effective Date: 2025</strong></p>
            
            <p className="mb-6">
              We want you to be 100% satisfied with your Maharajas Spices purchase. If there's an issue, we're here to help.
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-4">1. Returns</h2>
            <p className="mb-6">
              Due to the perishable nature of our products, we do not accept returns of opened items unless they are faulty or incorrect. If you received the wrong item or your order was damaged, please contact us within 7 days of delivery.
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-4">2. Refunds</h2>
            <p className="mb-4">
              Eligible refunds will be processed to your original payment method within 7–10 working days once approved. Refunds may be issued for:
            </p>
            <ul className="list-disc pl-6 mb-6 space-y-2">
              <li>Damaged goods</li>
              <li>Incorrect items</li>
              <li>Undelivered orders due to our fault</li>
            </ul>
            <p className="mb-6">
              We reserve the right to decline refund requests that do not meet these conditions.
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-4">3. How to Request a Refund</h2>
            <p className="mb-4">Please email <a href="mailto:e-commerce@maharajasspices.co.za" className="text-primary hover:underline">e-commerce@maharajasspices.co.za</a> with:</p>
            <ul className="list-disc pl-6 mb-6 space-y-2">
              <li>Your order number</li>
              <li>Description and photos of the issue</li>
              <li>Your preferred resolution (refund or replacement)</li>
            </ul>

            <p className="mb-2">
              Email us at <a href="mailto:e-commerce@maharajasspices.co.za" className="text-primary hover:underline">e-commerce@maharajasspices.co.za</a> if you need help with any other query related to refunds and returns.
            </p>
          </div>
        </RevealOnScroll>
      </main>
      <Footer />
    </div>
  );
};

export default RefundPolicy;
