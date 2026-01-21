import { Button } from "../../components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function GamePagination({
  currentPage = 1,
  onNextPage = () => { },
  onPrevPage = () => { },
  hasMore = true, // true nếu còn trang tiếp theo
  totalPages = null // null = không biết tổng số trang
}) {
  return (
    <div className="flex items-center justify-center space-x-4 mt-8 py-4">
      {/* Nút trang trước */}
      <Button
        variant="outline"
        size="sm"
        onClick={onPrevPage}
        disabled={currentPage <= 1}
        className="flex items-center gap-1 transition-all active:scale-95"
      >
        <ChevronLeft className="w-4 h-4" />
        <span>Trang trước</span>
      </Button>

      {/* Hiển thị số trang */}
      <div className="flex items-center gap-2">
        <span className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground font-bold shadow-sm">
          {currentPage}
        </span>
        {totalPages && (
          <span className="text-muted-foreground text-sm">/ {totalPages}</span>
        )}
      </div>

      {/* Nút trang tiếp */}
      <Button
        variant="outline"
        size="sm"
        onClick={onNextPage}
        disabled={!hasMore}
        className="flex items-center gap-1 transition-all active:scale-95"
      >
        <span>Trang tiếp</span>
        <ChevronRight className="w-4 h-4" />
      </Button>
    </div>
  );
}