import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "How do I get started with SEWMR SMS?",
    answer: "Simply sign up for an account, choose your pricing plan, and you can start sending SMS messages immediately. Our onboarding process takes less than 5 minutes."
  },
  {
    question: "What are your SMS delivery rates?",
    answer: "We maintain a 99.9% delivery rate with an average delivery time of under 2 seconds. Our platform is built for reliability and speed across all Tanzanian networks."
  },
  {
    question: "Do you offer API integration?",
    answer: "Yes! We provide comprehensive REST APIs and webhooks for seamless integration. Our EasyTextAPI is specifically designed for developers and students with simple documentation and examples."
  },
  {
    question: "What support do you provide?",
    answer: "We offer 24/7 technical support via email, phone, and WhatsApp. Enterprise customers also get dedicated account management and priority support."
  },
  {
    question: "Can I send messages in Swahili?",
    answer: "Absolutely! Our platform fully supports Swahili and other local languages. We understand the importance of communicating in your preferred language."
  },
  {
    question: "What are your pricing options?",
    answer: "We offer flexible pricing starting from our Tembo package. Each package includes different SMS volumes and features. Contact us for custom enterprise pricing for high-volume needs."
  },
  {
    question: "Is there a free trial available?",
    answer: "Yes, we offer 10 free SMS messages for new accounts to test our service. No credit card required to get started."
  },
  {
    question: "How secure is your platform?",
    answer: "Security is our priority. We use encryption for all data transmission, secure token-based authentication, and comply with international data protection standards."
  },
  {
    question: "Can I track message delivery?",
    answer: "Yes, our platform provides real-time delivery reports and analytics. You can track message status, delivery times, and engagement metrics through our dashboard or API."
  },
  {
    question: "Do you support bulk messaging?",
    answer: "Absolutely! Our platform is designed for high-volume messaging. You can upload contact lists, segment audiences, and send thousands of messages with a single API call."
  }
];

export const FAQ = () => {
  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto max-w-4xl">
        <div className="text-center mb-12 space-y-4">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
            Frequently Asked Questions
          </h2>
          <p className="text-xl text-muted-foreground">
            Everything you need to know about SEWMR SMS
          </p>
        </div>

        <Accordion type="single" collapsible className="space-y-2">
          {faqs.map((faq, index) => (
            <AccordionItem 
              key={index} 
              value={`item-${index}`}
              className="bg-card border border-border rounded-lg px-6"
            >
              <AccordionTrigger className="text-left hover:no-underline">
                <span className="font-semibold text-foreground">
                  {faq.question}
                </span>
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed pb-4">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        <div className="mt-12 text-center">
          <p className="text-muted-foreground mb-4">
            Still have questions? We're here to help.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="mailto:info@sewmr-sms.sewmr.com"
              className="inline-flex items-center justify-center px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary-hover transition-colors font-medium"
            >
              Email Support
            </a>
            <a
              href="https://wa.me/+255653750805"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-6 py-3 border border-border rounded-lg hover:bg-muted transition-colors font-medium"
            >
              WhatsApp Chat
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};