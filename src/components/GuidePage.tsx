import type { ReactNode } from "react";
import { track } from "@/lib/analytics";
import { ThemeToggle } from "@/components/ThemeToggle";

export type Faq = { q: string; a: string };

export function faqSchema(faq: Faq[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}

export function GuidePage({ title, description, updated, faq, related, children }: {
  title: string;
  description: string;
  updated: string;
  faq: Faq[];
  related: { href: string; label: string }[];
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-3xl items-center justify-between px-6 py-6">
        <a href="/" className="flex items-baseline gap-2">
          <span className="font-serif text-2xl italic">CitationLX</span>
          <span className="eyebrow">dataset citation repair</span>
        </a>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <a href="/" className="btn-ghost">Open the tool</a>
        </div>
      </header>

      <article className="mx-auto max-w-3xl px-6 pb-10 pt-8">
        <p className="eyebrow">Guide · Updated {updated}</p>
        <h1 className="mt-3 text-4xl leading-[1.1] md:text-5xl">{title}</h1>
        <p className="mt-4 text-lg leading-relaxed text-muted-foreground">{description}</p>

        <div className="mt-8 rounded-xl border border-border bg-card p-6 shadow-sm">
          <p className="eyebrow mb-2">Fastest way</p>
          <p className="text-sm leading-relaxed">
            Paste the DOI or your broken reference-manager export into{" "}
            <a className="font-medium underline underline-offset-2" href="/" onClick={() => track("guide_cta", { guide: title })}>CitationLX</a>.
            It checks the record against the official registry, repairs the item type, version and creators, and gives you a
            copy-ready citation in seven styles. Free, no account, runs entirely in your browser.
          </p>
        </div>

        <div className="mt-10 space-y-10 text-[15px] leading-relaxed">{children}</div>

        <section className="mt-12">
          <h2 className="text-2xl">FAQ</h2>
          <div className="mt-4 space-y-3">
            {faq.map((f) => (
              <details key={f.q} className="panel group p-5">
                <summary className="cursor-pointer list-none font-medium leading-snug marker:hidden">
                  <span className="mr-2 inline-block transition group-open:rotate-90">▸</span>{f.q}
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        {related.length > 0 && (
          <section className="mt-12">
            <h2 className="text-2xl">More guides</h2>
            <ul className="mt-4 space-y-2 text-sm">
              {related.map((r) => (
                <li key={r.href}>
                  <a className="underline underline-offset-2" href={r.href} onClick={() => track("guide_cta", { guide: r.label })}>{r.label}</a>
                </li>
              ))}
            </ul>
          </section>
        )}
      </article>

      <footer className="border-t py-8 text-center text-xs text-muted-foreground">
        <p>Metadata from DataCite & Crossref public APIs. CitationLX runs entirely in your browser — nothing is stored.</p>
      </footer>
    </div>
  );
}

export function Example({ style, children }: { style: string; children: string }) {
  return (
    <div>
      <p className="eyebrow mb-1">{style}</p>
      <p className="rounded-lg bg-muted p-4 font-serif text-[15px] leading-relaxed">{children}</p>
    </div>
  );
}
