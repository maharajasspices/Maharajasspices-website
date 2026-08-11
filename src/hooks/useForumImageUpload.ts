import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const useForumImageUpload = () => {
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const uploadImage = async (file: File) => {
    setUploading(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("You must be logged in to upload images");
      }

      // Check file size (max 200KB)
      if (file.size > 200 * 1024) {
        throw new Error("Forum images must be under 200KB");
      }

      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${session.user.id}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      // Upload to Supabase Storage forum bucket
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('forum')
        .upload(filePath, file, {
          cacheControl: '2592000', // 30 days in seconds
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('forum')
        .getPublicUrl(filePath);

      // Store metadata in image_metadata table
      await supabase
        .from('image_metadata')
        .insert({
          bucket: 'forum/',
          object_key: filePath,
          created_by: session.user.id,
          description: "Forum post image",
          alt_text: "Forum image",
          mime_type: file.type,
          file_size: file.size
        });

      return { url: publicUrl };
    } catch (error: any) {
      console.error("Upload error:", error);
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: error.message || "Failed to upload image",
      });
      throw error;
    } finally {
      setUploading(false);
    }
  };

  const deleteImage = async (filePath: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("You must be logged in to delete images");
      }

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('forum')
        .remove([filePath]);

      if (storageError) throw storageError;

      // Delete metadata
      await supabase
        .from('image_metadata')
        .delete()
        .eq('object_key', filePath)
        .eq('bucket', 'forum/');

      return true;
    } catch (error: any) {
      console.error("Delete error:", error);
      toast({
        variant: "destructive",
        title: "Delete failed",
        description: error.message || "Failed to delete image",
      });
      throw error;
    }
  };

  return {
    uploadImage,
    deleteImage,
    uploading,
  };
};
