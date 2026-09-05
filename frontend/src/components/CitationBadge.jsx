export default function CitationBadge({ index, source, onHover }) {
  return (
    <span
      onMouseEnter={() => onHover?.(source)}
      onMouseLeave={() => onHover?.(null)}
      title={source?.preview || ""}
      className="mx-0.5 inline-flex h-5 min-w-5 cursor-help items-center justify-center rounded bg-vault-accent/20 px-1 text-xs font-medium text-vault-accent"
    >
      {index}
    </span>
  );
}
