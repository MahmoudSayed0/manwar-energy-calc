"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Globe } from "lucide-react";

interface Props { currentLocale: "ar" | "en" }

export function LangToggle({ currentLocale }: Props) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const target = currentLocale === "ar" ? "en" : "ar";
  const newPath = pathname.replace(/^\/(ar|en)/, `/${target}`);
  const search = searchParams.toString();
  const fullHref = search ? `${newPath}?${search}` : newPath;
  const label = target === "ar" ? "العربية" : "English";

  return (
    <Link
      href={fullHref}
      className="inline-flex items-center gap-2 rounded-full bg-white text-primary px-4 py-2 text-sm font-semibold shadow-sm hover:bg-white/95 transition-colors"
    >
      <Globe className="h-4 w-4" />
      {label}
    </Link>
  );
}
