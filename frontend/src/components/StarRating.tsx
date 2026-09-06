export function StarRating({ rating, score }: { rating: number; score?: number }) {
  return (
    <span
      className="inline-flex items-center gap-1 text-amber-500"
      title={score != null ? `ATS match score: ${score}/100` : undefined}
    >
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} aria-hidden="true">
          {i < rating ? "★" : "☆"}
        </span>
      ))}
      <span className="sr-only">{rating} out of 5 stars</span>
    </span>
  );
}
