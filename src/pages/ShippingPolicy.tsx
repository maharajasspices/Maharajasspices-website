import Header from "@/components/Header";
import Footer from "@/components/Footer";
import RevealOnScroll from "@/components/RevealOnScroll";
import { useSEO } from "@/hooks/useSEO";
import courierGuyLogo from "@/assets/courier-guy-logo.webp";

const ShippingPolicy = () => {
  useSEO({
    title: "Shipping & Delivery Policy | Maharaja's Spices",
    description:
      "Shipping & delivery policy for Maharaja's Spices. Choose economy, standard, same-day, or urgent same-day delivery at checkout.",
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <RevealOnScroll direction="up">
          <header className="flex items-center justify-between mb-6">
            <h1 className="text-4xl font-bold">Shipping & Delivery Policy</h1>
            <img src={courierGuyLogo} alt="The Courier Guy" className="h-12 object-contain" />
          </header>

          <section className="prose prose-lg max-w-none dark:prose-invert">
            <p className="text-muted-foreground mb-6">
              <strong>Effective Date: 2025</strong>
            </p>

            <p className="mb-6">
              We offer delivery across South Africa with live courier quotes shown at checkout.
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-4">1. Delivery Options</h2>

            <div className="space-y-6 mb-8">
              <article className="bg-muted/30 p-4 rounded-lg border">
                <h3 className="text-lg font-semibold flex items-center gap-2">📦 Economy Delivery (Local)</h3>
                <ul className="list-none pl-0 mt-2 space-y-1">
                  <li>
                    <strong className="text-foreground">Price:</strong>{" "}
                    <span className="text-foreground font-semibold">Cheapest</span>
                  </li>
                  <li>
                    <strong className="text-foreground">Timeframe:</strong>{" "}
                    <span className="text-foreground font-semibold">2–5 business days</span>
                  </li>
                  <li>
                    <strong className="text-foreground">Notes:</strong>
                    <ul className="mt-2 space-y-1">
                      <li>No SLA</li>
                      <li>Best-effort routing</li>
                    </ul>
                  </li>
                </ul>
              </article>

              <article className="bg-muted/30 p-4 rounded-lg border">
                <h3 className="text-lg font-semibold flex items-center gap-2">🚚 Standard Delivery (Local)</h3>
                <ul className="list-none pl-0 mt-2 space-y-1">
                  <li>
                    <strong className="text-foreground">Timeframe:</strong>{" "}
                    <span className="text-foreground font-semibold">2–5 business days</span>
                  </li>
                  <li>
                    <strong className="text-foreground">Notes:</strong>
                    <ul className="mt-2 space-y-1">
                      <li>Normal routing</li>
                      <li>Slightly higher reliability than Economy</li>
                    </ul>
                  </li>
                </ul>
              </article>

              <article className="bg-muted/30 p-4 rounded-lg border">
                <h3 className="text-lg font-semibold flex items-center gap-2">🚗 Same Day Delivery (Local)</h3>
                <ul className="list-none pl-0 mt-2 space-y-1">
                  <li>
                    <strong className="text-foreground">Timeframe:</strong>{" "}
                    <span className="text-foreground font-semibold">Same business day (before cut-off)</span>
                  </li>
                </ul>
              </article>

              <article className="bg-muted/30 p-4 rounded-lg border">
                <h3 className="text-lg font-semibold flex items-center gap-2">🚀 Urgent Same Day Delivery</h3>
                <ul className="list-none pl-0 mt-2 space-y-1">
                  <li>
                    <strong className="text-foreground">Timeframe:</strong>{" "}
                    <span className="text-foreground font-semibold">Same business day (priority / dedicated)</span>
                  </li>
                </ul>
              </article>
            </div>

            <p className="text-sm text-muted-foreground">
              Delivery options and exact timeframes may vary based on the delivery address and the courier’s live quote at checkout.
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-4">2. Shipping Fees</h2>
            <p className="mb-6">
              Shipping costs are calculated at checkout based on your location, order weight, and selected delivery speed. Our prices include a small handling fee to ensure your order is carefully packed and protected.
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-4">3. Free Pickup Option</h2>
            <p className="mb-6">
              Prefer to collect your order? Choose our <strong>free pickup option</strong> at checkout and collect from our Pinetown location. We’ll notify you when your order is ready for collection.
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-4">4. Order Tracking</h2>
            <p className="mb-6">
              Once your order is dispatched, you will receive a tracking link via email. You can also track your order anytime on our{" "}
              <a href="/track-order" className="text-primary hover:underline">
                Track Order
              </a>{" "}
              page using your order reference and email address.
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-4">5. Address Accuracy</h2>
            <p className="mb-6">
              Please ensure your shipping address is correct and complete. We are not liable for delays, returns, or losses due to incorrect or incomplete address information. Failed deliveries due to incorrect addresses may incur additional delivery charges.
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-4">6. Delivery Attempts</h2>
            <p className="mb-6">
              The courier will attempt delivery during business hours. If nobody is available to receive the package, a contact card may be left with instructions for redelivery or collection from the nearest depot.
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-4">7. Contact for Shipping Inquiries</h2>
            <p className="mb-1">
              <a href="mailto:e-commerce@maharajasspices.co.za" className="text-primary hover:underline">
                e-commerce@maharajasspices.co.za
              </a>
            </p>
            <p>
              <a href="tel:+27684051374" className="text-primary hover:underline">
                +27 68 405 1374
              </a>
            </p>
          </section>
        </RevealOnScroll>
      </main>
      <Footer />
    </div>
  );
};

export default ShippingPolicy;
