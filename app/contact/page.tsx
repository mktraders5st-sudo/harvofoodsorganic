import type { Metadata } from "next";
import { ContactForm } from "@/components/ContactForm";
import { MailIcon, PhoneIcon, PinIcon, WhatsAppIcon } from "@/components/icons";
import { ImagePlaceholder, PageHero, Section } from "@/components/ui";
import { contactInfo } from "@/lib/data";

export const metadata: Metadata = { title: "Contact" };

const details = [
  { icon: PhoneIcon, label: "Call us", value: contactInfo.phone },
  { icon: WhatsAppIcon, label: "WhatsApp", value: contactInfo.whatsapp },
  { icon: MailIcon, label: "Email", value: contactInfo.email },
  { icon: PinIcon, label: "Visit", value: contactInfo.address },
];

export default function ContactPage() {
  return (
    <>
      <PageHero
        eyebrow="Contact"
        title="We'd love to hear from you"
        text="Questions about an order, wholesale, or partnering with us? Send a message."
      />

      <Section>
        <div className="grid gap-8 lg:grid-cols-[1fr_1.4fr]">
          <div className="space-y-4">
            {details.map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-start gap-4 rounded-2xl border border-cream-200 bg-white p-5">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-tomato-50 text-tomato-600">
                  <Icon className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted">{label}</p>
                  <p className="mt-0.5 font-medium text-forest-900">{value}</p>
                </div>
              </div>
            ))}
            <ImagePlaceholder label="Map embed" className="h-48" />
          </div>

          <div className="rounded-3xl border border-cream-200 bg-white p-6 sm:p-9">
            <h2 className="mb-6 text-2xl font-bold sm:text-3xl">Send us a message</h2>
            <ContactForm />
          </div>
        </div>
      </Section>
    </>
  );
}
