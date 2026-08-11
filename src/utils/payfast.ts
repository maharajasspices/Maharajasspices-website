// PayFast integration utilities - credentials are now stored securely in Supabase secrets

import { supabase } from "@/integrations/supabase/client";

export interface PayFastPaymentData {
  orderId: string;
  amount: number;
  itemName: string;
  itemDescription?: string;
  customerEmail: string;
  customerFirstName?: string;
  customerLastName?: string;
}

export async function redirectToPayFast(data: PayFastPaymentData): Promise<void> {
  try {
    // Call the edge function to generate secure payment form
    const { data: formData, error } = await supabase.functions.invoke('generate-payfast-form', {
      body: data,
    });

    if (error) {
      console.error('Error generating PayFast form:', error);
      throw new Error('Failed to initialize payment. Please try again.');
    }

    if (!formData?.formAction || !formData?.fields) {
      console.error('Invalid response from payment service');
      throw new Error('Payment service unavailable. Please try again.');
    }

    // Create and submit the form
    const form = document.createElement("form");
    form.method = "POST";
    form.action = formData.formAction;

    // Create hidden input fields from the secure response
    Object.entries(formData.fields).forEach(([name, value]) => {
      const input = document.createElement("input");
      input.type = "hidden";
      input.name = name;
      input.value = value as string;
      form.appendChild(input);
    });

    document.body.appendChild(form);
    form.submit();
  } catch (error) {
    console.error('PayFast redirect error:', error);
    throw error;
  }
}
