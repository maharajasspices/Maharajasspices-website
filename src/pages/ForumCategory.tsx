import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, MessageSquare, Eye, Loader2, AlertTriangle } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { format } from "date-fns";
import { useSEO } from "@/hooks/useSEO";
import { verifyHuman } from "@/utils/passwordValidator";
import { fullContentCheck } from "@/utils/contentModeration";
import ForumImageUpload from "@/components/ForumImageUpload";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface Topic {
  id: string;
  title: string;
  content: string;
  created_at: string;
  views_count: number;
  user_id: string | null;
  profiles?: {
    full_name: string | null;
    email: string | null;
  } | null;
}

interface Category {
  id: string;
  name: string;
  description: string | null;
}

const ForumCategory = () => {
  const { categoryId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [category, setCategory] = useState<Category | null>(null);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [newTopicTitle, setNewTopicTitle] = useState("");
  const [newTopicContent, setNewTopicContent] = useState("");
  const [creating, setCreating] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  useSEO({
    title: category ? `${category.name} - Community Forum | Maharaja's Spices` : 'Forum Category | Maharaja\'s Spices',
    description: category?.description || 'Browse forum topics and discussions',
    keywords: "spice forum, cooking community, recipe sharing"
  });

  useEffect(() => {
    checkAuth();
    if (categoryId) {
      fetchCategory();
      fetchTopics();
    }
  }, [categoryId]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setUser(session?.user || null);
  };

  const fetchCategory = async () => {
    if (!categoryId) return;

    const { data, error } = await supabase
      .from("forum_categories")
      .select("id, name, slug, description")
      .eq("id", categoryId)
      .single();

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load category",
      });
      navigate("/forum");
      return;
    }

    setCategory(data);
    setLoading(false);
  };

  const fetchTopics = async () => {
    if (!categoryId) return;

    const { data, error } = await supabase
      .from("forum_topics")
      .select("id, title, slug, content, category_id, user_id, views_count, is_pinned, is_locked, created_at")
      .eq("category_id", categoryId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching topics:", error);
      return;
    }

    if (data && data.length > 0) {
      // Fetch user profiles for each topic
      const userIds = [...new Set(data.map(t => t.user_id).filter(Boolean))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", userIds);

      const topicsWithProfiles = data.map(topic => ({
        ...topic,
        profiles: profiles?.find(p => p.id === topic.user_id) || null
      }));

      setTopics(topicsWithProfiles as Topic[]);
    } else {
      setTopics([]);
    }
  };

  const handleCreateTopic = async () => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Login required",
        description: "Please login to create topics",
      });
      navigate("/auth");
      return;
    }

    // Anti-spam: Check if user is human
    if (!verifyHuman()) {
      toast({
        variant: "destructive",
        title: "Verification Failed",
        description: "Please interact with the page before posting",
      });
      return;
    }

    if (!newTopicTitle.trim() || !newTopicContent.trim()) {
      toast({
        variant: "destructive",
        title: "Missing information",
        description: "Please fill in all fields",
      });
      return;
    }

    // Content moderation check for title and content
    const titleCheck = fullContentCheck(newTopicTitle);
    const contentCheck = fullContentCheck(newTopicContent);
    if (!titleCheck.passed || !contentCheck.passed) {
      const issues = [...titleCheck.issues, ...contentCheck.issues];
      toast({
        variant: "destructive",
        title: "Content Not Allowed",
        description: issues.join('. '),
      });
      return;
    }

    // Check terms agreement
    if (!agreedToTerms) {
      toast({
        variant: "destructive",
        title: "Agreement Required",
        description: "You must agree to the forum guidelines before posting",
      });
      return;
    }

    setCreating(true);

    try {
      const slug = newTopicTitle
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

      let finalContent = newTopicContent;
      if (uploadedImages.length > 0) {
        const imageMarkup = uploadedImages.map(url => `\n![image](${url})`).join('');
        finalContent = newTopicContent + imageMarkup;
      }

      const { error } = await supabase.from("forum_topics").insert({
        category_id: categoryId,
        user_id: user.id,
        title: newTopicTitle,
        slug: `${slug}-${Date.now()}`,
        content: finalContent,
      });

      if (error) throw error;

      setNewTopicTitle("");
      setNewTopicContent("");
      setUploadedImages([]);
      setDialogOpen(false);
      fetchTopics();
      toast({
        title: "Success",
        description: "Topic created successfully",
      });
    } catch (error) {
      console.error("Error creating topic:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create topic",
      });
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-12 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <Button variant="ghost" onClick={() => navigate("/forum")} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Forum
        </Button>

        {category && (
          <>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold mb-2">{category.name}</h1>
                {category.description && (
                  <p className="text-muted-foreground">{category.description}</p>
                )}
              </div>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    New Topic
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Topic</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Input
                        placeholder="Topic title"
                        value={newTopicTitle}
                        onChange={(e) => setNewTopicTitle(e.target.value)}
                      />
                    </div>
                    <div>
                      <Textarea
                        placeholder="Topic content..."
                        value={newTopicContent}
                        onChange={(e) => setNewTopicContent(e.target.value)}
                        className="min-h-[200px]"
                      />
                    </div>
                    <div>
                      <ForumImageUpload
                        onImageUploaded={(url) => setUploadedImages([...uploadedImages, url])}
                      />
                      {uploadedImages.length > 0 && (
                        <div className="mt-2 text-sm text-muted-foreground">
                          {uploadedImages.length} image(s) attached
                        </div>
                      )}
                    </div>
                    <div className="flex items-start space-x-2 p-3 bg-muted/50 rounded-md border">
                      <Checkbox
                        id="agree-terms"
                        checked={agreedToTerms}
                        onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
                      />
                      <label htmlFor="agree-terms" className="text-xs text-muted-foreground leading-relaxed cursor-pointer">
                        <AlertTriangle className="h-3 w-3 inline mr-1 text-amber-500" />
                        I agree to the <Link to="/terms" className="text-primary underline" target="_blank">Terms & Conditions</Link> and <Link to="/privacy-policy" className="text-primary underline" target="_blank">Privacy Policy</Link>. 
                        I understand that inappropriate content (spam, explicit material, harassment) may result in account termination and potential legal action.
                      </label>
                    </div>
                    <Button
                      onClick={handleCreateTopic}
                      disabled={creating || !agreedToTerms}
                      className="w-full"
                    >
                      {creating ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        "Create Topic"
                      )}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="space-y-3">
              {topics.length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4">
                      No topics yet. Be the first to start a discussion!
                    </p>
                    {user && (
                      <Button onClick={() => setDialogOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Create First Topic
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ) : (
                topics.map((topic) => (
                  <Link key={topic.id} to={`/forum/topic/${topic.id}`}>
                    <Card className="hover:shadow-md transition-shadow cursor-pointer">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg mb-2 hover:text-primary transition-colors">
                              {topic.title}
                            </h3>
                            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                              {topic.content}
                            </p>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span>
                                by {topic.profiles?.full_name || topic.profiles?.email?.split('@')[0] || 'User'}
                              </span>
                              <span>•</span>
                              <span>{format(new Date(topic.created_at), "PPP")}</span>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <Eye className="h-3 w-3" />
                                {topic.views_count}
                              </span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))
              )}
            </div>
          </>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default ForumCategory;
