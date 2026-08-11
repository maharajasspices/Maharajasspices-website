import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useSEO } from "@/hooks/useSEO";
import { ClipboardCopy, ExternalLink, Truck } from "lucide-react";
import { toast } from "sonner";

const TrackParcel = () => {
  const [searchParams] = useSearchParams();
  const [waybill, setWaybill] = useState((searchParams.get("waybill") || "").toUpperCase());

  useSEO({
    title: "Track Parcel | Maharaja's Spices",
    description: "Track your Courier Guy parcel using your waybill number from your order portal.",
    url: "https://www.maharajasspices.co.za/track-parcel",
  });

  const directLink = useMemo(() => {
    const trimmed = waybill.trim();
    return trimmed ? `https://thecourierguy.co.za/tracking/?waybill=${encodeURIComponent(trimmed)}` : "";
  }, [waybill]);

  const handleCopyWaybill = async () => {
    const trimmed = waybill.trim();
    if (!trimmed) {
      toast.error("Enter or select a waybill first.");
      return;
    }
    await navigator.clipboard.writeText(trimmed);
    toast.success("Waybill copied.");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8 mt-16">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">Parcel Tracking Helper</h1>
          <p className="text-muted-foreground mb-6">Copy your waybill, then paste it on The Courier Guy tracking page.</p>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Truck className="h-5 w-5" /> Track with Waybill</CardTitle>
              <CardDescription>The Courier Guy page may still ask you to paste the waybill manually.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="waybill">Waybill Number</Label>
                <Input
                  id="waybill"
                  value={waybill}
                  onChange={(e) => setWaybill(e.target.value.toUpperCase())}
                  placeholder="e.g. FFSBCW"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" onClick={handleCopyWaybill}>
                  <ClipboardCopy className="h-4 w-4 mr-2" />
                  Copy Waybill
                </Button>

                <Button asChild>
                  <a href="https://thecourierguy.co.za/tracking/" target="_blank" rel="noopener noreferrer">
                    Open Courier Guy Site <ExternalLink className="h-4 w-4 ml-2" />
                  </a>
                </Button>

                {directLink && (
                  <Button asChild variant="secondary">
                    <a href={directLink} target="_blank" rel="noopener noreferrer">
                      Open Direct Link <ExternalLink className="h-4 w-4 ml-2" />
                    </a>
                  </Button>
                )}
              </div>

              <p className="text-xs text-muted-foreground">
                Steps: 1) Copy waybill, 2) open Courier Guy site, 3) paste waybill, 4) click Track.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default TrackParcel;
