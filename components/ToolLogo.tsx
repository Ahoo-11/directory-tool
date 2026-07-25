export function ToolLogo({
  value,
  title,
  className = "h-full w-full object-contain",
}: {
  value: string;
  title: string;
  className?: string;
}) {
  if (/^https?:\/\//i.test(value)) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={value} alt={`${title} logo`} className={className} />;
  }
  return <>{value || title.slice(0, 1).toUpperCase()}</>;
}
