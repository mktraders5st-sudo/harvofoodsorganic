"use client";

import { useState } from "react";
import { buttonClasses } from "./ui";

const inputClass =
  "w-full rounded-xl border border-cream-200 bg-cream-50 px-4 py-3 text-sm outline-none focus:border-forest-500 focus:bg-white";

function Field({ label, id, children }: { label: string; id: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-forest-900">
        {label}
      </label>
      {children}
    </div>
  );
}

export function ContactForm() {
  const [sent, setSent] = useState(false);

  if (sent) {
    return (
      <div className="grid min-h-80 place-items-center rounded-2xl bg-forest-50 p-8 text-center">
        <div>
          <h3 className="text-2xl font-bold">Message sent!</h3>
          <p className="mt-2 text-muted">Thank you for reaching out. We will reply within one working day.</p>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        // TODO: connect to an email service or API route
        setSent(true);
      }}
      className="grid gap-5 sm:grid-cols-2"
    >
      <Field label="Full name" id="name">
        <input id="name" name="name" required className={inputClass} />
      </Field>
      <Field label="Phone" id="phone">
        <input id="phone" name="phone" type="tel" className={inputClass} />
      </Field>
      <div className="sm:col-span-2">
        <Field label="Email" id="email">
          <input id="email" name="email" type="email" required className={inputClass} />
        </Field>
      </div>
      <div className="sm:col-span-2">
        <Field label="Subject" id="subject">
          <select id="subject" name="subject" className={inputClass}>
            <option>General question</option>
            <option>Order support</option>
            <option>Wholesale / bulk orders</option>
            <option>Become a partner farm</option>
          </select>
        </Field>
      </div>
      <div className="sm:col-span-2">
        <Field label="Message" id="message">
          <textarea id="message" name="message" rows={5} required className={inputClass} />
        </Field>
      </div>
      <div className="sm:col-span-2">
        <button type="submit" className={buttonClasses("accent", "w-full sm:w-auto")}>
          Send Message
        </button>
      </div>
    </form>
  );
}
