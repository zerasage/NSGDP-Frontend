import DOMPurify from "isomorphic-dompurify";
import { cn } from "@/lib/utils";

interface RichHtmlContentProps {
  html: string;
  className?: string;
}

export function RichHtmlContent({ html, className }: RichHtmlContentProps) {
  const sanitized = DOMPurify.sanitize(html, {
    USE_PROFILES: { html: true },
  });

  if (!sanitized.trim()) return null;

  return (
    <div
      className={cn(
        "text-sm leading-relaxed [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5 [&_li>p]:my-0 [&_p+p]:mt-2 [&_strong]:font-semibold",
        className,
      )}
      dangerouslySetInnerHTML={{ __html: sanitized }}
    />
  );
}
