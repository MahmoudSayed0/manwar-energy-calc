import { cn } from "@/lib/utils";

interface AnkhLogoProps {
  className?: string;
  size?: number;
  variant?: "default" | "white" | "black";
}

const SOURCES: Record<NonNullable<AnkhLogoProps["variant"]>, string> = {
  default: "/MANWAR-logo.svg",
  white:   "/MANWAR-logo-white.svg",
  black:   "/MANWAR-logo-black.svg",
};

export function AnkhLogo({ className, size = 40, variant = "default" }: AnkhLogoProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={SOURCES[variant]}
      alt="Manwar"
      width={size}
      height={Math.round(size * (171 / 251))}
      className={cn("inline-block", className)}
    />
  );
}
