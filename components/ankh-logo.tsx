import { cn } from "@/lib/utils";

interface AnkhLogoProps {
  className?: string;
  size?: number;
}

export function AnkhLogo({ className, size = 32 }: AnkhLogoProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 96"
      width={size}
      height={size * 1.5}
      fill="none"
      stroke="currentColor"
      strokeWidth="4"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("inline-block", className)}
      aria-label="Ankh"
    >
      <ellipse cx="32" cy="22" rx="14" ry="18" />
      <line x1="32" y1="40" x2="32" y2="92" />
      <line x1="14" y1="52" x2="50" y2="52" />
    </svg>
  );
}
