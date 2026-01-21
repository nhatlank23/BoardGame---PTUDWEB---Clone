import { useState, useEffect } from "react";
import { Star, Trash2, Edit2 } from "lucide-react";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Card } from "./ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";
import { useToast } from "../hooks/use-toast";
import reviewService from "../services/reviewService";

export function GameReviews({ gameId, currentUserId }) {
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState(null);
  const [myReview, setMyReview] = useState(null);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(false);

  // Form state
  const [isEditing, setIsEditing] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { toast } = useToast();

  // Load reviews
  const loadReviews = async (pageNum = 1) => {
    try {
      setLoading(true);
      const response = await reviewService.getGameReviews(gameId, pageNum, 10);
      console.log(response.data);
      setReviews(response.data.reviews);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error("Error loading reviews:", error);
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Không thể tải reviews",
      });
    } finally {
      setLoading(false);
    }
  };

  // Load stats
  const loadStats = async () => {
    try {
      const response = await reviewService.getGameRatingStats(gameId);
      setStats(response.data);
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  };

  // Load my review
  const loadMyReview = async () => {
    if (!currentUserId) return;

    try {
      const response = await reviewService.getMyReview(gameId);
      setMyReview(response.data);
      setRating(response.data.rating);
      setComment(response.data.comment || "");
    } catch (error) {
      // User hasn't reviewed yet
      setMyReview(null);
    }
  };

  useEffect(() => {
    loadReviews(page);
    loadStats();
    loadMyReview();
  }, [gameId, currentUserId, page]);

  // Submit review
  const handleSubmitReview = async () => {
    if (rating === 0) {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Vui lòng chọn số sao đánh giá",
      });
      return;
    }

    try {
      setSubmitting(true);
      await reviewService.createOrUpdateReview(gameId, rating, comment);

      toast({
        title: "Thành công",
        description: myReview ? "Đã cập nhật đánh giá" : "Đã thêm đánh giá",
      });

      setIsEditing(false);
      await loadReviews(1);
      await loadStats();
      await loadMyReview();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: error.response?.data?.message || "Không thể gửi đánh giá",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Delete review
  const handleDeleteReview = async () => {
    if (!myReview) return;

    try {
      await reviewService.deleteReview(myReview.id);

      toast({
        title: "Thành công",
        description: "Đã xóa đánh giá",
      });

      setMyReview(null);
      setRating(0);
      setComment("");
      await loadReviews(1);
      await loadStats();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Không thể xóa đánh giá",
      });
    }
  };

  // Star component
  const StarRating = ({ value, onChange, readonly = false }) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={readonly}
            onClick={() => !readonly && onChange && onChange(star)}
            onMouseEnter={() => !readonly && setHoverRating(star)}
            onMouseLeave={() => !readonly && setHoverRating(0)}
            className={readonly ? "cursor-default" : "cursor-pointer"}
          >
            <Star className={`w-6 h-6 ${star <= (readonly ? value : hoverRating || value) ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`} />
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      {stats && (
        <Card className="p-6">
          <div className="flex items-center gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold">{stats.averageRating}</div>
              <StarRating value={Math.round(stats.averageRating)} readonly />
              <div className="text-sm text-muted-foreground mt-2">{stats.totalReviews} đánh giá</div>
            </div>

            <div className="flex-1 space-y-2">
              {[5, 4, 3, 2, 1].map((star) => (
                <div key={star} className="flex items-center gap-2">
                  <div className="w-12 text-sm">{star} sao</div>
                  <div className="flex-1 bg-secondary rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-yellow-400 h-full transition-all"
                      style={{
                        width: `${stats.totalReviews > 0 ? (stats.distribution[star] / stats.totalReviews) * 100 : 0}%`,
                      }}
                    />
                  </div>
                  <div className="w-12 text-sm text-right text-muted-foreground">{stats.distribution[star]}</div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* My Review Form */}
      {currentUserId && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">{myReview ? "Đánh giá của bạn" : "Viết đánh giá"}</h3>

          {!isEditing && myReview ? (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <StarRating value={myReview.rating} readonly />
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>
                    <Edit2 className="w-4 h-4 mr-2" />
                    Chỉnh sửa
                  </Button>
                  <Button size="sm" variant="destructive" onClick={handleDeleteReview}>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Xóa
                  </Button>
                </div>
              </div>
              {myReview.comment && <p className="text-muted-foreground">{myReview.comment}</p>}
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Đánh giá của bạn</label>
                <StarRating value={rating} onChange={setRating} />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Nhận xét (không bắt buộc)</label>
                <Textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Chia sẻ trải nghiệm của bạn..." rows={4} />
              </div>

              <div className="flex gap-2">
                <Button onClick={handleSubmitReview} disabled={submitting || rating === 0}>
                  {submitting ? "Đang gửi..." : myReview ? "Cập nhật" : "Gửi đánh giá"}
                </Button>
                {myReview && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsEditing(false);
                      setRating(myReview.rating);
                      setComment(myReview.comment || "");
                    }}
                  >
                    Hủy
                  </Button>
                )}
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Reviews List */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Tất cả đánh giá ({pagination?.totalReviews || 0})</h3>

        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Đang tải...</div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">Chưa có đánh giá nào</div>
        ) : (
          <>
            {reviews.map((review) => (
              <Card key={review.id} className="p-4">
                <div className="flex gap-4">
                  <Avatar>
                    <AvatarImage src={review.avatar_url} />
                    <AvatarFallback>{review.username?.[0]?.toUpperCase()}</AvatarFallback>
                  </Avatar>

                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <div className="font-semibold">{review.username}</div>
                        <div className="text-xs text-muted-foreground">{new Date(review.created_at).toLocaleDateString("vi-VN")}</div>
                      </div>
                      <StarRating value={review.rating} readonly />
                    </div>

                    {review.comment && <p className="text-muted-foreground">{review.comment}</p>}
                  </div>
                </div>
              </Card>
            ))}

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-6">
                <Button variant="outline" disabled={!pagination.hasPrevPage} onClick={() => setPage(page - 1)}>
                  Trang trước
                </Button>

                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    Trang {pagination.page} / {pagination.totalPages}
                  </span>
                </div>

                <Button variant="outline" disabled={!pagination.hasNextPage} onClick={() => setPage(page + 1)}>
                  Trang sau
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
