"use client";

import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";

interface PayPalButtonProps {
  amount: number;
  onSuccess: (orderId: string) => void;
  onError: (msg: string) => void;
}

export default function PayPalButton({ amount, onSuccess, onError }: PayPalButtonProps) {
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;

  if (!clientId) {
    return <p className="text-sm text-muted-foreground p-3 bg-muted rounded">PayPal is not configured. Please set NEXT_PUBLIC_PAYPAL_CLIENT_ID.</p>;
  }

  return (
    <PayPalScriptProvider options={{ clientId, currency: "EUR" }}>
      <PayPalButtons
        style={{ layout: "vertical", shape: "rect" }}
        createOrder={(data, actions) => {
          return actions.order.create({
            intent: "CAPTURE",
            purchase_units: [{ amount: { value: amount.toFixed(2), currency_code: "EUR" } }],
          });
        }}
        onApprove={async (data, actions) => {
          const order = await actions.order?.capture();
          if (order?.id) {
            onSuccess(order.id);
          }
        }}
        onError={(err) => {
          onError(typeof err === "string" ? err : "PayPal payment failed");
        }}
      />
    </PayPalScriptProvider>
  );
}
