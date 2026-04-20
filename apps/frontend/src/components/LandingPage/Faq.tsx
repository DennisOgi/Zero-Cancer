import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/shared/ui/accordion'

export default function Faq() {
  return (
    <div className="wrapper py-20 grid md:grid-cols-2 gap-10">
      <div className="space-y-4">
        <h2 className="text-4xl lg:text-5xl font-bold">
          Got Questions? We Have Got Answers!
        </h2>
        <p className="text-muted-foreground">
          We've compiled the most common questions to help you understand our
          services better. If you have more questions, feel free to contact us
        </p>
      </div>
      <div>
        <Accordion type="single" collapsible className="w-full space-y-4">
          <AccordionItem value="item-1" className="bg-blue-50 rounded-lg px-4">
            <AccordionTrigger>Is Zerocancer really free?</AccordionTrigger>
            <AccordionContent>
              Yes — if you qualify for a sponsored screening or refer 10 people
              using your link, you can get screened at no cost. You can also
              choose to pay directly if you prefer.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-2" className="bg-blue-50 rounded-lg px-4">
            <AccordionTrigger>
              How do I know if I'm eligible for screening?
            </AccordionTrigger>
            <AccordionContent>
              Eligibility for sponsored screening is based on various factors,
              including age, family history, and risk factors. You can complete
              our online assessment to see if you qualify.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-3" className="bg-blue-50 rounded-lg px-4">
            <AccordionTrigger>Where can I go for a screening?</AccordionTrigger>
            <AccordionContent>
              We have a network of partner screening centers across the country.
              You can use our "Find a Screening Center" tool to locate the one
              nearest to you.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-4" className="bg-blue-50 rounded-lg px-4">
            <AccordionTrigger>
              How do I know my information and results are safe?
            </AccordionTrigger>
            <AccordionContent>
              We take data privacy and security very seriously. All your
              information is encrypted and stored securely in compliance with
              healthcare regulations. Your results are confidential and will
              only be shared with you and your designated healthcare provider.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-5" className="bg-blue-50 rounded-lg px-4">
            <AccordionTrigger>
              I can't afford the test. What can I do?
            </AccordionTrigger>
            <AccordionContent>
              We are committed to making cancer screening accessible to
              everyone. If you don't qualify for a sponsored screening, we offer
              flexible payment plans and can connect you with financial
              assistance programs.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  )
}
