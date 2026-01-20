import { Button } from "../../components/ui/button";

export default function Pagination({ currentPage = 1, onNextPage = () => {}, onPrevPage = () => {} }) {
  return (
    <div className="w-full flex flex-row justify-center items-center gap-5 mt-3">
      <Button onClick={onPrevPage}>Trang trước</Button>
      <p>{currentPage}</p>
      <Button onClick={onNextPage}>Trang tiếp</Button>
    </div>
  );
}
