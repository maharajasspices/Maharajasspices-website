import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const BulkProductImport = () => {
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const rows = Array.isArray(parsed) ? parsed : [parsed];
      const { error } = await supabase.from("products").insert(rows);
      if (error) throw error;
      toast({ title: "Imported", description: `${rows.length} product(s) imported.` });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Import failed", description: err.message || "Invalid JSON file" });
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bulk Import</CardTitle>
        <CardDescription>Upload a JSON file to import products.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-3">
          <Input type="file" accept="application/json,.json" onChange={handleFile} disabled={uploading} />
          {uploading && <Loader2 className="h-4 w-4 animate-spin" />}
        </div>
      </CardContent>
    </Card>
  );
};

export default BulkProductImport;
