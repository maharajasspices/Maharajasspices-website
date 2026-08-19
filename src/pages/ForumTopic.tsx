import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, MessageSquare, Loader2, Trash2, AlertTriangle } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { format } from "date-fns";
import ForumImageUpload from "@/components/ForumImageUpload";
import DOMPurify from 'dompurify';
import { useSEO } from "@/hooks/useSEO";
import { verifyHuman } from "@/utils/passwordValidator";
import { fullContentCheck } from "@/utils/contentModeration";

interface Post {
  id: string;
  content: string;
  created_at: string;
  user_id: string | null;
  is_solution: boolean;
  profiles?: {
    full_name: string | null;
    email: string | null;
  } | null;
}

interface Topic {
  id: string;
  title: string;
  content: string;
  created_at: string;
  category_id: string;
  user_id: string | null;
  views_count: number;
  profiles?: {
    full_name: string | null;
    email: string | null;
  } | null;
}

const ForumTopic = () => {
  const { topicId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [topic, setTopic] = useState<Topic | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPost, setNewPost] = useState("");
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [isEmployee, setIsEmployee] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  useSEO({
    title: topic ? `${topic.title} - Forum | Maharaja's Spices` : 'Forum Topic | Maharaja\'s Spices',
    description: topic ? topic.content.slice(0, 160) : 'Forum discussion',
    keywords: "spice forum, cooking community, recipe sharing"
  });

  useEffect(() => {
    checkAuth();
    if (topicId) {
      fetchTopic();
      fetchPosts();
      incrementViewCount();
    }
  }, [topicId]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setUser(session?.user || null);
    
    // Check if user has employee or admin role
    if (session?.user) {
      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id);
      
      const hasEmployeeRole = roles?.some(r => r.role === 'employee' || r.role === 'admin');
      const userEmail = (session.user.email || "").toLowerCase();
      const isAdminEmail = ["bradley@maharajasspices.co.za", "zulaigah.benjamin@maharajasspices.co.za"].includes(userEmail);
      setIsEmployee(hasEmployeeRole || isAdminEmail || false);
    }
  };

  const incrementViewCount = async () => {
    if (!topicId) return;
    
    // Increment view count
    const { data: currentTopic } = await supabase
      .from('forum_topics')
      .select('views_count')
      .eq('id', topicId)
      .single();
    
    if (currentTopic) {
      await supabase
        .from('forum_topics')
        .update({ views_count: (currentTopic.views_count || 0) + 1 })
        .eq('id', topicId);
    }
  };

  const fetchTopic = async () => {
    if (!topicId) return;
    
    const { data, error } = await supabase
      .from("forum_topics")
      .select("id, title, slug, content, category_id, user_id, views_count, is_pinned, is_locked, created_at")
      .eq("id", topicId)
      .single();

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load topic",
      });
      navigate("/forum");
      return;
    }

    // Fetch user profile separately
    if (data.user_id) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, email")
        .eq("id", data.user_id)
        .single();

      setTopic({ ...data, profiles: profile });
    } else {
      setTopic(data);
    }
    setLoading(false);
  };

  const fetchPosts = async () => {
    if (!topicId) return;

    const { data, error } = await supabase
      .from("forum_posts")
      .select("id, content, topic_id, user_id, is_solution, created_at")
      .eq("topic_id", topicId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching posts:", error);
      return;
    }

    if (data && data.length > 0) {
      // Fetch user profiles for each post
      const userIds = [...new Set(data.map(p => p.user_id).filter(Boolean))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", userIds);

      const postsWithProfiles = data.map(post => ({
        ...post,
        profiles: profiles?.find(p => p.id === post.user_id) || null
      }));

      setPosts(postsWithProfiles as Post[]);
    } else {
      setPosts([]);
    }
  };

  const handleSubmitPost = async () => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Login required",
        description: "Please login to post",
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

    if (!newPost.trim()) {
      toast({
        variant: "destructive",
        title: "Empty post",
        description: "Please enter a message",
      });
      return;
    }

    // Content moderation check
    const contentCheck = fullContentCheck(newPost);
    if (!contentCheck.passed) {
      toast({
        variant: "destructive",
        title: "Content Not Allowed",
        description: contentCheck.issues.join('. '),
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

    setPosting(true);

    try {
      let finalContent = newPost;
      if (uploadedImages.length > 0) {
        const imageMarkup = uploadedImages.map(url => `\n![image](${url})`).join('');
        finalContent = newPost + imageMarkup;
      }

      const { error } = await supabase
        .from("forum_posts")
        .insert({
          topic_id: topicId,
          user_id: user.id,
          content: finalContent,
        });

      if (error) throw error;

      setNewPost("");
      setUploadedImages([]);
      fetchPosts();
      toast({
        title: "Success",
        description: "Post added successfully",
      });
    } catch (error) {
      console.error("Error posting:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to post message",
      });
    } finally {
      setPosting(false);
    }
  };

  const handleDeletePost = async (postId: string, postUserId: string | null) => {
    // Only allow deletion if user is post owner or employee
    if (!user || (user.id !== postUserId && !isEmployee)) {
      toast({
        variant: "destructive",
        title: "Unauthorized",
        description: "You cannot delete this post",
      });
      return;
    }

    if (!confirm("Are you sure you want to delete this post?")) {
      return;
    }

    try {
      const { error } = await supabase
        .from("forum_posts")
        .delete()
        .eq("id", postId);

      if (error) throw error;

      fetchPosts();
      toast({
        title: "Success",
        description: "Post deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting post:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete post",
      });
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

        {topic && (
          <>
            <Card className="mb-6">
              <CardContent className="p-6">
                <h1 className="text-3xl font-bold mb-4">{topic.title}</h1>
                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                  <span>
                    by {topic.profiles?.full_name || topic.profiles?.email?.split('@')[0] || 'User'}
                  </span>
                  <span>•</span>
                  <span>{format(new Date(topic.created_at), "PPP")}</span>
                  <span>•</span>
                  <span>{topic.views_count} views</span>
                </div>
                <div 
                  className="text-lg whitespace-pre-wrap prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ 
                    __html: DOMPurify.sanitize(
                      topic.content.replace(
                        /!\[.*?\]\((https?:\/\/[^\)]+)\)/g, 
                        '<img src="$1" alt="Forum image" class="max-w-full md:max-w-2xl h-auto rounded-lg my-4 border border-border" />'
                      )
                    )
                  }}
                />
              </CardContent>
            </Card>

            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <MessageSquare className="h-6 w-6" />
              Replies ({posts.length})
            </h2>

            <div className="space-y-4 mb-6">
              {posts.map((post) => (
                <Card key={post.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                        <MessageSquare className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-sm text-muted-foreground">
                            <span className="font-semibold text-foreground mr-2">
                              {post.profiles?.full_name || post.profiles?.email?.split('@')[0] || 'User'}
                            </span>
                            {format(new Date(post.created_at), "PPP p")}
                          </div>
                          {user && (user.id === post.user_id || isEmployee) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeletePost(post.id, post.user_id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                        <div 
                          className="whitespace-pre-wrap prose prose-sm max-w-none"
                          dangerouslySetInnerHTML={{ 
                            __html: DOMPurify.sanitize(
                              post.content.replace(
                                /!\[.*?\]\((https?:\/\/[^\)]+)\)/g, 
                                '<img src="$1" alt="Forum image" class="max-w-full md:max-w-xl h-auto rounded-lg my-4 border border-border" />'
                              )
                            )
                          }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {user ? (
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold mb-4">Post a Reply</h3>
                  <Textarea
                    placeholder="Write your reply..."
                    value={newPost}
                    onChange={(e) => setNewPost(e.target.value)}
                    className="mb-4 min-h-[120px]"
                  />
                  <div className="mb-4">
                    <ForumImageUpload
                      onImageUploaded={(url) => setUploadedImages([...uploadedImages, url])}
                    />
                    {uploadedImages.length > 0 && (
                      <div className="mt-2 text-sm text-muted-foreground">
                        {uploadedImages.length} image(s) attached
                      </div>
                    )}
                  </div>
                  <div className="flex items-start space-x-2 p-3 bg-muted/50 rounded-md border mb-4">
                    <Checkbox
                      id="agree-terms-reply"
                      checked={agreedToTerms}
                      onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
                    />
                    <label htmlFor="agree-terms-reply" className="text-xs text-muted-foreground leading-relaxed cursor-pointer">
                      <AlertTriangle className="h-3 w-3 inline mr-1 text-amber-500" />
                      I agree to the <Link to="/terms" className="text-primary underline" target="_blank">Terms & Conditions</Link> and <Link to="/privacy-policy" className="text-primary underline" target="_blank">Privacy Policy</Link>. 
                      I understand that inappropriate content may result in account termination and potential legal action.
                    </label>
                  </div>
                  <Button onClick={handleSubmitPost} disabled={posting || !agreedToTerms}>
                    {posting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Posting...
                      </>
                    ) : (
                      "Post Reply"
                    )}
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-6 text-center">
                  <p className="mb-4">Please login to post replies</p>
                  <Button onClick={() => navigate("/auth")}>Login</Button>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default ForumTopic;
