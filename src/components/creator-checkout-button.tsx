"use client";

import type { ReactNode } from "react";

type CreatorCheckoutButtonProps = {
  children: ReactNode;
};

export function CreatorCheckoutButton({ children }: CreatorCheckoutButtonProps) {
  const handleClick = () => {
    const checkoutUrl = process.env.NEXT_PUBLIC_CREEM_CHECKOUT_URL;

    if (!checkoutUrl) {
      window.alert("Payment link is not available yet.");
      return;
    }

    window.location.href = checkoutUrl;
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="relative mt-6 inline-flex rounded-full bg-zinc-950 px-5 py-3 text-sm font-black text-white transition hover:-translate-y-0.5 hover:shadow-lg"
    >
      {children}
    </button>
  );
}
