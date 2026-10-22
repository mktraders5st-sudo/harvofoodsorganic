"use client";

import { useState } from "react";
import { buttonClasses, Container } from "./ui";

export function Newsletter() {
  const [done, setDone] = useState(false);

  return (
    <section className="pb-16 sm:pb-20">
      <Container>
        <div className="rounded-3xl bg-forest-100 px-6 py-12 text-center sm:px-12 sm:py-14">
          <h2 className="text-3xl font-bold sm:text-4xl">Join the Harvo family</h2>
          <p className="mx-auto mt-3 max-w-md text-muted">
            Get healthy recipes, new arrivals and exclusive offers in your inbox.
          </p>
          {done ? (
            <p className="mt-6 font-semibold text-forest-700">Thank you for subscribing!</p>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setDone(true);
              }}
              className="mx-auto mt-7 flex max-w-md flex-col gap-3 sm:flex-row"
            >
              <label htmlFor="newsletter-email" className="sr-only">
                Email address
              </label>
              <input
                id="newsletter-email"
                type="email"
                required
                placeholder="Enter your email"
                className="min-w-0 flex-1 rounded-full border border-cream-200 bg-white px-5 py-3 text-sm outline-none focus:border-forest-500"
              />
              <button type="submit" className={buttonClasses("accent")}>
                Subscribe
              </button>
            </form>
          )}
        </div>
      </Container>
    </section>
  );
}
