// Placeholder social-proof content for the boilerplate — swap for real
// reviews once you have them. Star ratings are constrained to 3-5.
const REVIEWS: { name: string; quote: string; stars: 3 | 4 | 5 }[] = [
  {
    name: "J. Alvarez",
    quote: "Set up in an afternoon. Exactly what I needed to get moving.",
    stars: 5,
  },
  {
    name: "M. Chen",
    quote: "Clean codebase, easy to extend. A couple rough edges but solid.",
    stars: 4,
  },
  {
    name: "S. Okafor",
    quote: "Saved me a week of boilerplate work. Would use again.",
    stars: 5,
  },
  {
    name: "R. Novak",
    quote: "Does what it says. Documentation could be better.",
    stars: 3,
  },
  {
    name: "P. Dubois",
    quote: "Great starting point for a new product. Recommended.",
    stars: 5,
  },
];

function Stars({ count }: { count: number }) {
  return (
    <div aria-label={`${count} out of 5 stars`} className="flex gap-1">
      {Array.from({ length: 5 }, (_, i) => (
        <span
          key={i}
          className={i < count ? "text-[#00FF87]" : "text-white/20"}
        >
          ★
        </span>
      ))}
    </div>
  );
}

export function ReviewsSection({ title }: { title: string }) {
  return (
    <section className="w-full max-w-4xl">
      <h2 className="mb-6 text-center text-lg font-medium text-white">
        {title}
      </h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {REVIEWS.map((r) => (
          <div
            key={r.name}
            className="flex flex-col gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4"
          >
            <Stars count={r.stars} />
            <p className="text-sm text-white/80">&ldquo;{r.quote}&rdquo;</p>
            <p className="text-xs text-white/40">{r.name}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
