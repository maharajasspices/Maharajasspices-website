import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { useForumImageUpload } from "@/hooks/useForumImageUpload";

interface ForumImageUploadProps {
  onImageUploaded: (url: string) => void;
  postId?: string;
}

const ForumImageUpload = ({ onImageUploaded, postId }: ForumImageUploadProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const { uploadImage, uploading } = useForumImageUpload();
  const { toast } = useToast();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (max 200KB for forum images)
      if (file.size > 200 * 1024) {
        toast({
          variant: "destructive",
          title: "File too large",
          description: "Forum images must be under 200KB",
        });
        return;
      }

      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      const result = await uploadImage(selectedFile);

      if (result?.url) {
        onImageUploaded(result.url);
        toast({
          title: "Image uploaded",
          description: "Your image has been uploaded successfully",
        });
        clearSelection();
      }
    } catch (error: any) {
      // Error already handled in hook
      console.error(error);
    }
  };

  const clearSelection = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="forum-image" className="flex items-center gap-2">
          <ImageIcon className="h-4 w-4" />
          Attach Image (Optional)
        </Label>
        <Input
          id="forum-image"
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          disabled={uploading}
        />
        <p className="text-xs text-muted-foreground">
          Maximum file size: 200KB. Images are automatically deleted after 30 days. Supported formats: JPG, PNG, GIF, WEBP
        </p>
      </div>

      {previewUrl && (
        <div className="relative w-full max-w-xs">
          <img
            src={previewUrl}
            alt="Preview"
            className="w-full h-auto rounded-lg border"
          />
          <Button
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2"
            onClick={clearSelection}
            disabled={uploading}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {selectedFile && !uploading && (
        <Button onClick={handleUpload} className="flex items-center gap-2">
          <Upload className="h-4 w-4" />
          Upload Image
        </Button>
      )}

      {uploading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
          Uploading image...
        </div>
      )}
    </div>
  );
};

export default ForumImageUpload;
