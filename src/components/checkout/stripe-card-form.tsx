"use client";

import { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null;

function CardForm({ amount, onSuccess, onError }: { amount: number; onSuccess: (paymentIntentId: string) => void; onError: (msg: string) => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setProcessing(true);
    try {
      // Create payment intent on server
      const res = await fetch("/api/payments/stripe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
      });
      const { clientSecret, error: serverError } = await res.json();
      if (serverError) { onError(serverError); setProcessing(false); return; }

      // Confirm payment
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: { card: elements.getElement(CardElement)! },
      });

      if (error) {
        onError(error.message || "Payment failed");
      } else if (paymentIntent?.status === "succeeded") {
        onSuccess(paymentIntent.id);
      }
    } catch (err: any) {
      onError(err.message || "Payment failed");
    }
    setProcessing(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="border rounded-md p-3">
        <CardElement options={{
          style: {
            base: { fontSize: "16px", color: "#1a1a1a", "::placeholder": { color: "#a0a0a0" } },
          },
        }} />
      </div>
      <Button type="submit" disabled={!stripe || processing} className="w-full">
        {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {processing ? "Processing..." : `Pay €${amount.toFixed(2)}`}
      </Button>
    </form>
  );
}

export default function StripeCardForm({ amount, onSuccess, onError }: { amount: number; onSuccess: (paymentIntentId: string) => void; onError: (msg: string) => void }) {
  if (!stripePromise) {
    return <p className="text-sm text-muted-foreground p-3 bg-muted rounded">Stripe is not configured. Please set NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY.</p>;
  }

  return (
    <Elements stripe={stripePromise} options={{ locale: "el" }}>
      <CardForm amount={amount} onSuccess={onSuccess} onError={onError} />
    </Elements>
  );
}
