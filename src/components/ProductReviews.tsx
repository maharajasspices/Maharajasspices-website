import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getSecureErrorMessage } from "@/utils/errorHandling";

interface Review {
  id: string;
  user_id: string;
  rating: number;
  review_text: string;
  created_at: string;
}

interface ProductReviewsProps {
  productId: string;
}

const ProductReviews = ({ productId }: ProductReviewsProps) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);
  const [userRating, setUserRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [canReview, setCanReview] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchReviews();
    checkAuth();
  }, [productId]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      setUserId(session.user.id);
      await checkIfCanReview(session.user.id);
      await checkIfHasReviewed(session.user.id);
    }
  };

  const checkIfCanReview = async (userId: string) => {
    const { data } = await supabase
      .from("order_items")
      .select("id, order_id(user_id)")
      .eq("product_id", productId);
    
    const hasPurchased = data?.some((item: any) => item.order_id?.user_id === userId);
    setCanReview(!!hasPurchased);
  };

  const checkIfHasReviewed = async (userId: string) => {
    const { data } = await supabase
      .from("product_reviews")
      .select("id")
      .eq("product_id", productId)
      .eq("user_id", userId)
      .single();
    
    setHasReviewed(!!data);
  };

  const fetchReviews = async () => {
    const { data: reviewsData } = await supabase
      .from("product_reviews")
      .select("id, user_id, rating, review_text, created_at")
      .eq("product_id", productId)
      .order("created_at", { ascending: false })
      .limit(20);

    if (reviewsData) {
      setReviews(reviewsData);
      
      const { data: ratingsData } = await supabase
        .from("product_ratings")
        .select("average_rating, review_count")
        .eq("product_id", productId)
        .maybeSingle();

      if (ratingsData) {
        setAverageRating(ratingsData.average_rating || 0);
        setReviewCount(ratingsData.review_count || 0);
      }
    }
  };

  const handleSubmitReview = async () => {
    if (!userId) {
      toast({
        variant: "destructive",
        title: "Please log in",
        description: "You need to be logged in to leave a review.",
      });
      return;
    }

    if (userRating === 0) {
      toast({
        variant: "destructive",
        title: "Select a rating",
        description: "Please select a star rating.",
      });
      return;
    }

    const { error } = await supabase
      .from("product_reviews")
      .insert({
        product_id: productId,
        user_id: userId,
        rating: userRating,
        review_text: reviewText,
      });

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: getSecureErrorMessage(error),
      });
    } else {
      toast({
        title: "Review submitted!",
        description: "Thank you for your feedback.",
      });
      setUserRating(0);
      setReviewText("");
      setHasReviewed(true);
      fetchReviews();
    }
  };

  const renderStars = (rating: number, interactive: boolean = false, onRate?: (rating: number) => void) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-5 w-5 ${
              star <= rating
                ? "fill-primary text-primary"
                : "text-muted-foreground"
            } ${interactive ? "cursor-pointer hover:scale-110 transition-transform" : ""}`}
            onClick={() => interactive && onRate && onRate(star)}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Customer Reviews</CardTitle>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              {renderStars(Math.round(averageRating))}
              <span className="text-2xl font-bold">{averageRating.toFixed(1)}</span>
            </div>
            <span className="text-muted-foreground">({reviewCount} reviews)</span>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {userId && canReview && !hasReviewed && (
            <div className="border-t pt-6">
              <h3 className="font-semibold mb-4">Write a Review</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Your Rating</label>
                  {renderStars(userRating, true, setUserRating)}
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Your Review</label>
                  <Textarea
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    placeholder="Share your experience with this product..."
                    rows={4}
                  />
                </div>
                <Button onClick={handleSubmitReview}>Submit Review</Button>
              </div>
            </div>
          )}

          {userId && !canReview && !hasReviewed && (
            <p className="text-sm text-muted-foreground border-t pt-4">
              Purchase this product to leave a review.
            </p>
          )}

          {hasReviewed && (
            <p className="text-sm text-muted-foreground border-t pt-4">
              You have already reviewed this product. Thank you for your feedback!
            </p>
          )}

          <div className="border-t pt-6 space-y-4">
            {reviews.length === 0 ? (
              <p className="text-muted-foreground">No reviews yet. Be the first to review!</p>
            ) : (
              reviews.map((review) => (
                <div key={review.id} className="border-b pb-4 last:border-0">
                  <div className="flex items-center gap-2 mb-2">
                    {renderStars(review.rating)}
                    <span className="text-sm text-muted-foreground">
                      {new Date(review.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  {review.review_text && (
                    <p className="text-sm">{review.review_text}</p>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProductReviews;