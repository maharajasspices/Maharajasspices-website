import Header from "@/components/Header";
import Footer from "@/components/Footer";
import RevealOnScroll from "@/components/RevealOnScroll";
import { useSEO } from "@/hooks/useSEO";

const POPIACompliance = () => {
  useSEO({
    title: "POPIA Compliance | Maharaja's Spices - Data Protection",
    description: "Maharaja's Spices is fully compliant with the Protection of Personal Information Act (POPIA). Learn how we safeguard your personal data.",
    keywords: "POPIA compliance, data protection South Africa, personal information act, Maharaja's Spices",
    url: "https://maharajasspices.co.za/popia-compliance",
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <RevealOnScroll direction="up">
          <h1 className="text-4xl font-bold mb-6">POPIA Compliance</h1>
          <div className="prose prose-lg max-w-none dark:prose-invert">
            <p className="text-muted-foreground mb-6"><strong>Protection of Personal Information Act (POPIA) Compliance Statement</strong></p>
            
            <p className="mb-6">
              Maharaja's Spices (Pty) Ltd is committed to protecting your personal information in accordance with the Protection of Personal Information Act 4 of 2013 (POPIA). This statement outlines how we process, protect, and respect your personal information.
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-4">1. Information Regulator Registration</h2>
            <p className="mb-6">
              Maharaja's Spices is registered as a Responsible Party with the Information Regulator of South Africa and complies with all POPIA requirements for lawful processing of personal information.
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-4">2. Lawful Processing</h2>
            <p className="mb-4">We process personal information lawfully and reasonably, with transparency about our processing activities. Personal information is collected for specific, explicitly defined, and lawful purposes related to:</p>
            <ul className="list-disc pl-6 mb-6 space-y-2">
              <li>Order processing and delivery</li>
              <li>Customer service and support</li>
              <li>Marketing communications (with consent)</li>
              <li>Legal and regulatory compliance</li>
              <li>Fraud prevention and security</li>
            </ul>

            <h2 className="text-2xl font-bold mt-8 mb-4">3. Consent and Purpose</h2>
            <p className="mb-6">
              We only collect personal information with your knowledge and consent. You have the right to withdraw consent at any time. Information is only used for the specific purposes for which it was collected, unless you consent to additional uses.
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-4">4. Data Minimisation</h2>
            <p className="mb-6">
              We only collect personal information that is adequate, relevant, and not excessive for the purposes for which it is processed. We do not collect unnecessary information.
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-4">5. Data Accuracy and Retention</h2>
            <p className="mb-6">
              We take reasonable steps to ensure that personal information is complete, accurate, not misleading, and updated where necessary. Personal information is not retained longer than necessary for the purposes for which it was collected, subject to legal retention requirements.
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-4">6. Security Safeguards</h2>
            <p className="mb-4">We implement appropriate technical and organizational measures to secure personal information against:</p>
            <ul className="list-disc pl-6 mb-6 space-y-2">
              <li>Loss, damage, or unauthorized destruction</li>
              <li>Unlawful access or processing</li>
              <li>Data breaches and cyber threats</li>
            </ul>
            <p className="mb-6">
              All payment information is encrypted and processed through PCI-DSS compliant third-party payment processors. We use SSL/TLS encryption for data transmission and secure database storage.
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-4">7. Your Rights as a Data Subject</h2>
            <p className="mb-4">Under POPIA, you have the right to:</p>
            <ul className="list-disc pl-6 mb-6 space-y-2">
              <li><strong>Access:</strong> Request confirmation of whether we hold your personal information and access to that information</li>
              <li><strong>Correction:</strong> Request correction or deletion of inaccurate, irrelevant, excessive, or outdated personal information</li>
              <li><strong>Objection:</strong> Object to processing of personal information on reasonable grounds</li>
              <li><strong>Deletion:</strong> Request deletion of personal information (subject to legal retention requirements)</li>
              <li><strong>Restrict Processing:</strong> Request restriction of processing in certain circumstances</li>
              <li><strong>Data Portability:</strong> Request your personal information in a structured, commonly used format</li>
              <li><strong>Withdraw Consent:</strong> Withdraw consent for processing at any time</li>
            </ul>

            <h2 className="text-2xl font-bold mt-8 mb-4">8. Third-Party Processing</h2>
            <p className="mb-4">We may share personal information with third-party service providers who assist us with:</p>
            <ul className="list-disc pl-6 mb-6 space-y-2">
              <li>Payment processing (PayFast, PayGate)</li>
              <li>Delivery and logistics services</li>
              <li>Email communications</li>
              <li>Website hosting and maintenance</li>
            </ul>
            <p className="mb-6">
              All third parties are required to process personal information in accordance with POPIA and maintain appropriate security measures.
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-4">9. Cross-Border Information Transfers</h2>
            <p className="mb-6">
              Where personal information is transferred outside South Africa, we ensure that adequate safeguards are in place to protect your information in accordance with POPIA requirements.
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-4">10. Data Breach Notification</h2>
            <p className="mb-6">
              In the event of a data breach that is likely to cause serious harm to you, we will notify you and the Information Regulator within the timeframes specified in POPIA.
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-4">11. Children's Information</h2>
            <p className="mb-6">
              We do not knowingly collect personal information from children under 18 years without parental consent. Our services are intended for adults.
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-4">12. Direct Marketing</h2>
            <p className="mb-6">
              We will only use your personal information for direct marketing purposes if you have given consent. You can opt-out of marketing communications at any time by clicking the unsubscribe link in our emails or contacting us directly.
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-4">13. Information Officer</h2>
            <p className="mb-4">Our designated Information Officer can be contacted at:</p>
            <ul className="list-none mb-6 space-y-1">
              <li><strong>Email:</strong> <a href="mailto:e-commerce@maharajasspices.co.za" className="text-primary hover:underline">e-commerce@maharajasspices.co.za</a></li>
              <li><strong>Phone:</strong> +27 (0)68 405 1374</li>
              <li><strong>Address:</strong> Maharaja's Spices, Durban, South Africa</li>
            </ul>

            <h2 className="text-2xl font-bold mt-8 mb-4">14. Complaints</h2>
            <p className="mb-4">If you believe we have not complied with POPIA, you may:</p>
            <ul className="list-disc pl-6 mb-6 space-y-2">
              <li>Lodge a complaint with our Information Officer</li>
              <li>Lodge a complaint with the Information Regulator at <a href="https://www.justice.gov.za/inforeg/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">www.justice.gov.za/inforeg</a></li>
            </ul>

            <h2 className="text-2xl font-bold mt-8 mb-4">15. Updates to This Statement</h2>
            <p className="mb-6">
              We may update this POPIA Compliance Statement from time to time. Material changes will be communicated via email or prominent notice on our website.
            </p>

            <p className="text-muted-foreground mt-8">
              <strong>Last Updated:</strong> January 2025
            </p>
          </div>
        </RevealOnScroll>
      </main>
      <Footer />
    </div>
  );
};

export default POPIACompliance;
