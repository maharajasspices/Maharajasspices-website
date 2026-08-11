import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function useInvoiceDownload() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const downloadInvoice = async (orderId: string) => {
    setIsLoading(true);

    toast({
      title: "📸 Screenshot Tip",
      description: "Take a screenshot of your invoice in case the download doesn't save properly.",
    });
    
    try {
      // Check if user is authenticated
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Authentication Required",
          description: "Please log in to download your invoice.",
          variant: "destructive",
        });
        return;
      }

      // Call edge function to generate invoice HTML
      const { data, error } = await supabase.functions.invoke('generate-invoice-pdf', {
        body: { orderId },
      });

      if (error) {
        console.error('Invoice generation error:', error);
        
        // Handle specific error cases
        if (error.message?.includes('not found')) {
          toast({
            title: "Invoice Not Ready",
            description: "Your invoice is being prepared. Please try again in a moment.",
            variant: "destructive",
          });
        } else if (error.message?.includes('Unauthorized')) {
          toast({
            title: "Access Denied",
            description: "You don't have permission to view this invoice.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Download Failed",
            description: "Could not download invoice. Please try again.",
            variant: "destructive",
          });
        }
        return;
      }

      // The response is HTML content - open in new tab for print/save
      const blob = new Blob([data], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      
      // Open in new window for printing
      const printWindow = window.open(url, '_blank');
      
      if (printWindow) {
        // Wait for content to load then trigger print
        printWindow.onload = () => {
          // Small delay to ensure styles are applied
          setTimeout(() => {
            printWindow.print();
          }, 500);
        };
      } else {
        // Fallback: download the HTML file
        const a = document.createElement('a');
        a.href = url;
        a.download = `invoice-${orderId.substring(0, 8)}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        toast({
          title: "Invoice Downloaded",
          description: "Open the downloaded file and use your browser's print function to save as PDF.",
        });
      }

      // Clean up URL after a delay
      setTimeout(() => URL.revokeObjectURL(url), 10000);

    } catch (error) {
      console.error('Invoice download error:', error);
      toast({
        title: "Download Failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return { downloadInvoice, isLoading };
}
