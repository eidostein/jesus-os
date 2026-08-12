import { cn } from "@/lib/utils";

/** Four-pointed star mark from the Hey Jesus brand. */
export function StarLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn("size-7", className)} aria-hidden="true">
      <path
        d="M16 2 L18.2 13.8 L30 16 L18.2 18.2 L16 30 L13.8 18.2 L2 16 L13.8 13.8 Z"
        fill="currentColor"
      />
      <path
        d="M16 9 L17 15 L23 16 L17 17 L16 23 L15 17 L9 16 L15 15 Z"
        fill="currentColor"
        opacity="0.5"
      />
    </svg>
  );
}
