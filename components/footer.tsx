import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FooterProps {
  logo: React.ReactNode;
  brandName?: string;
  homeHref?: string;
  socialLinks: Array<{
    icon: React.ReactNode;
    href: string;
    label: string;
  }>;
  mainLinks: Array<{
    href: string;
    label: string;
  }>;
  legalLinks: Array<{
    href: string;
    label: string;
  }>;
  copyright: {
    text: string;
    license?: string;
  };
  notes?: string[];
}

export function Footer({
  logo,
  brandName,
  homeHref = "/",
  socialLinks,
  mainLinks,
  legalLinks,
  copyright,
  notes,
}: FooterProps) {
  return (
    <footer className="pb-6 pt-16 lg:pb-8 lg:pt-24 border-t border-border bg-card">
      <div className="container px-4 lg:px-8">
        {notes && notes.length > 0 && (
          <ul className="mb-10 space-y-2 text-xs md:text-sm text-muted-foreground leading-relaxed max-w-3xl mx-auto text-center">
            {notes.map((n, i) => (
              <li key={i}>{n}</li>
            ))}
          </ul>
        )}

        <div className="md:flex md:items-start md:justify-between">
          <a
            href={homeHref}
            className="inline-flex items-center"
            aria-label={brandName ?? "Manwar"}
          >
            {logo}
          </a>
          <ul className="flex list-none mt-6 md:mt-0 gap-3">
            {socialLinks.map((link, i) => (
              <li key={i}>
                <a
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={link.label}
                  className={cn(
                    buttonVariants({ variant: "secondary", size: "icon" }),
                    "h-10 w-10 rounded-full"
                  )}
                >
                  {link.icon}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className="border-t mt-6 pt-6 md:mt-4 md:pt-8 lg:grid lg:grid-cols-10">
          <nav className="lg:mt-0 lg:col-[4/11]">
            <ul className="list-none flex flex-wrap -my-1 -mx-2 lg:justify-end">
              {mainLinks.map((link, i) => (
                <li key={i} className="my-1 mx-2 shrink-0">
                  <a
                    href={link.href}
                    className="text-sm text-primary underline-offset-4 hover:underline"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <div className="mt-6 lg:mt-0 lg:col-[4/11]">
            <ul className="list-none flex flex-wrap -my-1 -mx-3 lg:justify-end">
              {legalLinks.map((link, i) => (
                <li key={i} className="my-1 mx-3 shrink-0">
                  <a
                    href={link.href}
                    className="text-sm text-muted-foreground underline-offset-4 hover:underline"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div className="mt-6 text-sm leading-6 text-muted-foreground lg:mt-0 lg:row-[1/3] lg:col-[1/4]">
            <div>{copyright.text}</div>
            {copyright.license && <div>{copyright.license}</div>}
          </div>
        </div>
      </div>
    </footer>
  );
}
