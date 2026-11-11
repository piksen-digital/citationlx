import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  type DatasetRecord, type Style, EXPORTS, STYLES, diff, download, emptyRecord, extractDoi,
  fetchByDoi, fetchStyledCitation, formatCitation, parseRecord, score, validate, toBiblatex, toRis, toCsl,
  type VersionInfo, decodeShare, encodeShare,
  checkStatus, DAS_PRESETS, fetchOrcidAuthor, fetchSoftware, type StatusInfo,
} from "@/lib/citation";
import { track } from "@/lib/analytics";
import { ThemeToggle } from "@/components/ThemeToggle";

const FAQS: { q: string; a: string }[] = [
  {
    q: "Why do reference managers get dataset citations wrong?",
    a: "Most reference managers were built for journal articles and books. When you import a dataset, they often record it as a journal article, drop the version, or lose the publisher (the repository), which produces citations that don't follow DataCite or FORCE11 data citation principles. CitationLX detects those errors and repairs them against the official registry record.",
  },
  {
    q: "Which citation styles does CitationLX support?",
    a: "Seven styles: APA 7, DataCite, Chicago, MLA 9, Harvard, IEEE, and Vancouver. You can switch between them instantly and copy or download the result.",
  },
  {
    q: "What if my dataset has no DOI?",
    a: "Use the “No DOI” tab. You can build a citation manually with authors, title, year, version, publisher and any identifier you have (URL, Handle, ARK, accession number), including an accessed date for informally shared data.",
  },
  {
    q: "Can CitationLX warn me if the record was retracted or corrected?",
    a: "Yes. When you fetch a DOI, CitationLX checks Crossref's update metadata in the background. If the record has been retracted or corrected, you'll see a warning with a link to the update notice before you cite it.",
  },
  {
    q: "Does it work for software and code?",
    a: "Yes. The Software tab reads a GitHub repository's CITATION.cff (the FORCE11 software citation standard), falls back to the GitHub API for basic metadata, and handles software DOIs such as Zenodo releases. Exports come out as @software BibLaTeX, RIS type COMP and CSL software.",
  },
  {
    q: "Is there a browser button?",
    a: "Yes. Drag the “Fix this citation” button in the Browser button section to your bookmarks bar. On any repository or journal page, one click finds the DOI and opens it in CitationLX. No extension or install needed. On mobile, where bookmarklets don't work: install CitationLX to your home screen and share pages to it from the browser's Share menu (Android), or copy the link and tap “Paste & fix” in the DOI tab.",
  },
  {
    q: "Can I install CitationLX as an app?",
    a: "Yes. CitationLX is a Progressive Web App: install it from your browser menu to run it as a standalone window, and it keeps working when your connection drops. A dark mode toggle sits in the header for late-night writing sessions.",
  },
  {
    q: "How do I get verified author names?",
    a: "Paste an ORCID iD in the workbench (or the No-DOI tab) and CitationLX pulls the verified name from the ORCID public API, fixing organisational authors and scrambled names at the source.",
  },
  {
    q: "What export formats are available?",
    a: "Clean BibLaTeX, RIS and CSL JSON, plus a Zotero “Extra” field snippet that forces the dataset type and version even in stubborn libraries. Batch mode exports a whole cleaned reference list at once.",
  },
  {
    q: "Does CitationLX store my data?",
    a: "No. Everything runs in your browser. Metadata is fetched from the public DataCite, Crossref and ORCID APIs, and nothing you paste is ever uploaded or saved.",
  },
  {
    q: "Is CitationLX free?",
    a: "Yes. CitationLX is a free microtool for academic researchers — no account, no sign-in, no limits.",
  },
];

function I({ children }: { children: ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden="true">
      {children}
    </svg>
  );
}

const FEATURES: { icon: ReactNode; title: string; body: string }[] = [
  { icon: (<I><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" /><path d="m9 12 2 2 4-4" /></I>), title: "Version-DOI guard", body: "Zenodo, Dryad and figshare records are checked for concept vs version DOIs, with one-click switching to the exact snapshot your results depend on." },
  { icon: (<I><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" /><path d="M12 9v4" /><path d="M12 17h.01" /></I>), title: "Retraction & update warnings", body: "Every DOI fetch checks Crossref's update metadata, so retracted or corrected records are flagged — with a link to the notice — before you cite them." },
  { icon: (<I><polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" /></I>), title: "Software & code mode", body: "Paste a GitHub repo or CITATION.cff (or a Zenodo release DOI) and get proper software citations: @software BibLaTeX, RIS type COMP and CSL software." },
  { icon: (<I><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><polyline points="16 11 18 13 22 9" /></I>), title: "ORCID author pickup", body: "Paste an ORCID iD and the verified name is pulled from the ORCID public API, fixing scrambled and organisational names at the source." },
  { icon: (<I><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" /></I>), title: "“Fix this citation” bookmarklet", body: "Drag one button to your bookmarks bar. On any repository or journal page, a single click finds the DOI and opens it in CitationLX — no extension needed." },
  { icon: (<I><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" /></I>), title: "Installable app with dark mode", body: "CitationLX is a Progressive Web App: install it from your browser menu, keep working offline, and flip to dark mode for late-night writing sessions." },
  { icon: (<I><polyline points="4 7 4 4 20 4 20 7" /><line x1="9" x2="15" y1="20" y2="20" /><line x1="12" x2="12" y1="4" y2="20" /></I>), title: "Seven citation styles", body: "APA 7, DataCite, Chicago, MLA 9, Harvard, IEEE and Vancouver — rendered by the DataCite registry where possible, not approximated." },
  { icon: (<I><polygon points="12 2 2 7 12 12 22 7 12 2" /><polyline points="2 17 12 22 22 17" /><polyline points="2 12 12 17 22 12" /></I>), title: "Batch & dedupe", body: "Paste a whole reference list or .bib file: duplicates are dropped, every DOI re-fetched, and one clean .bib, .ris or CSL JSON file comes out." },
  { icon: (<I><rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></I>), title: "Private by design", body: "Everything runs in your browser. Nothing you paste is ever uploaded or stored — the public registries are queried directly from your device." },
];

const FAQ_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQS.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
};

const APP_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "CitationLX",
  applicationCategory: "ReferenceApplication",
  operatingSystem: "Web",
  url: "/",
  description:
    "Free in-browser dataset citation repair tool. Fixes broken dataset records from reference managers and exports correct citations in APA, Chicago, MLA and more, plus BibTeX, RIS and CSL JSON.",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
};

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CitationLX — Dataset citation repair for researchers" },
      { name: "description", content: "Paste a DOI or a broken reference-manager export. Get a validated dataset citation in APA, Chicago, MLA and more, plus clean BibTeX, RIS and CSL JSON. Free, private, runs in your browser." },
      { property: "og:title", content: "CitationLX — Dataset citation repair" },
      { property: "og:description", content: "Fix dataset records your reference manager imports badly. Validate, repair, export." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://citationlx.online/" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "CitationLX — Dataset citation repair" },
      { name: "twitter:description", content: "Fix dataset records your reference manager imports badly. Validate, repair, export." },
    ],
    links: [{ rel: "canonical", href: "https://citationlx.online/" }],
    scripts: [
      { type: "application/ld+json", children: JSON.stringify(APP_SCHEMA) },
      { type: "application/ld+json", children: JSON.stringify(FAQ_SCHEMA) },
    ],
  }),
  component: Index,
});

type Tab = "doi" | "software" | "repair" | "nodoi" | "batch";
const TABS: [Tab, string, string][] = [
  ["doi", "Cite by DOI", "Paste a DOI or repository link"],
  ["software", "Software / code", "GitHub repo, CITATION.cff or software DOI"],
  ["repair", "Repair an import", "Paste a broken BibTeX / RIS / CSL record"],
  ["nodoi", "No DOI", "Build a citation for informally shared data"],
  ["batch", "Batch & dedupe", "Clean a whole reference list at once"],
];

function Index() {
  const [tab, setTab] = useState<Tab>("doi");
  const [record, setRecord] = useState<DatasetRecord | null>(null);
  const [origType, setOrigType] = useState<string | undefined>();
  const [changes, setChanges] = useState<ReturnType<typeof diff>>([]);
  const [source, setSource] = useState("");
  const [versions, setVersions] = useState<VersionInfo | undefined>();
  const [deepLink, setDeepLink] = useState<{ doi: string; busy: boolean; err: string } | null>(null);

  const load = (r: DatasetRecord, src: string, ot?: string, ch: ReturnType<typeof diff> = [], v?: VersionInfo) => {
    setRecord(r); setSource(src); setOrigType(ot); setChanges(ch); setVersions(v);
  };

  const switchDoi = async (doi: string) => {
    try {
      const { record, source, rawType, versions: v } = await fetchByDoi(doi);
      track("version_switch", { doi });
      load(record, source, rawType, [], v);
    } catch {}
  };

  // Shared repair links (#r=...) and guide deep links (?doi=...)
  useEffect(() => {
    document.getElementById("clx-boot")?.remove();
    const hash = window.location.hash;
    if (hash.startsWith("#r=")) {
      const shared = decodeShare(hash.slice(3));
      if (shared) {
        track("share_open");
        load(shared.record, shared.source, shared.origType, shared.changes as any);
      }
      return;
    }
    const sp = new URLSearchParams(window.location.search);
    const q = sp.get("doi") || [sp.get("url"), sp.get("text"), sp.get("title")].filter(Boolean).join(" ");
    const clean = q ? extractDoi(q) : null;
    if (clean) {
      track("doi_fetch", { doi: clean, via: sp.get("doi") ? "guide" : "pwa" });
      setDeepLink({ doi: clean, busy: true, err: "" });
      fetchByDoi(clean)
        .then(({ record, source, rawType, versions: v }) => { load(record, source, rawType, [], v); setDeepLink({ doi: clean, busy: false, err: "" }); })
        .catch((e: any) => { setDeepLink({ doi: clean, busy: false, err: (e?.message || "Couldn't fetch that DOI") + " — check your connection, then press Fetch metadata to retry." }); });
    } else if (q) {
      // PWA share target shared a page without an extractable DOI: prefill it so the user can retry or switch tabs.
      setDeepLink({ doi: sp.get("url") || q, busy: false, err: "" });
    }
  }, []);

  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-baseline gap-2">
          <span className="font-serif text-2xl italic">CitationLX</span>
          <span className="eyebrow">dataset citation repair</span>
        </div>
        <nav className="hidden items-center gap-5 text-sm md:flex">
          <a href="#bookmarklet" className="text-muted-foreground transition hover:text-foreground">Browser button</a>
          <a href="#features" className="text-muted-foreground transition hover:text-foreground">Features</a>
          <a href="#how-it-works" className="text-muted-foreground transition hover:text-foreground">How it works</a>
          <a href="#faq" className="text-muted-foreground transition hover:text-foreground">FAQ</a>
          <a href="/guides" className="text-muted-foreground transition hover:text-foreground">Guides</a>
          <a href="mailto:cantrell22@hotmail.com?subject=Feature%20suggestion%20for%20CitationLX" className="btn-ghost">Suggest a feature</a>
          <ThemeToggle />
        </nav>
        <span className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <span className="font-mono text-xs text-muted-foreground">DataCite · Crossref</span>
        </span>
      </header>

      <section className="mx-auto max-w-6xl px-6 pb-10 pt-8">
        <p className="eyebrow">For researchers who cite data</p>
        <h1 className="mt-3 max-w-3xl text-5xl leading-[1.05] md:text-6xl">
          Your reference manager mangled that dataset. <em className="text-accent">Let's fix it.</em>
        </h1>
        <p className="mt-5 max-w-2xl text-muted-foreground">
          Paste a DOI or a bad export. See exactly what's wrong, get a correct citation in seven styles, and export clean BibTeX, RIS or CSL JSON.
        </p>
      </section>

      <main className="mx-auto grid max-w-6xl gap-6 px-6 pb-24 lg:grid-cols-[380px_1fr]">
        <div className="space-y-4">
          <nav className="panel grid grid-cols-2 gap-1 p-1">
            {TABS.map(([id, label]) => (
              <button key={id} onClick={() => { setTab(id); track("tab_change", { tab: id }); }}
                className={`rounded-md px-3 py-2 text-left text-sm transition ${tab === id ? "bg-primary text-primary-foreground" : "hover:bg-muted"} ${id === "software" ? "col-span-2" : ""}`}>
                {label}
              </button>
            ))}
          </nav>
          <div className="panel p-5">
            <p className="eyebrow mb-3">{TABS.find((t) => t[0] === tab)![2]}</p>
            {tab === "doi" && <DoiInput onLoad={load} />}
            {tab === "software" && <SoftwareInput onLoad={load} />}
            {tab === "repair" && <RepairInput onLoad={load} />}
            {tab === "nodoi" && <NoDoi onLoad={load} />}
            {tab === "batch" && <Batch />}
          </div>
        </div>

        <div className="min-w-0">
          {tab === "batch" ? (
            <div className="panel p-8 text-sm text-muted-foreground">
              <h3 className="text-2xl text-foreground">Batch mode</h3>
              <p className="mt-2">Paste DOIs, URLs, or a whole .bib file on the left. We normalise DOIs, drop duplicates (the same dataset cited as doi:, dx.doi.org and a Zenodo link), re-fetch authoritative metadata and give you one clean file.</p>
            </div>
          ) : record ? (
            <Workbench record={record} setRecord={setRecord} origType={origType} changes={changes} source={source} versions={versions} onSwitchDoi={switchDoi} />
          ) : deepLink?.busy ? (
            <div className="panel flex h-full min-h-[420px] flex-col justify-center p-10">
              <p className="eyebrow">Fetching from the registry</p>
              <p className="mt-3 break-all font-mono text-sm">{deepLink.doi}</p>
              <p className="mt-4 text-sm text-muted-foreground">This usually takes a few seconds; on a slow connection a little longer. The repaired record will appear here.</p>
            </div>
          ) : (
            <Empty />
          )}
        </div>
      </main>

      <section id="bookmarklet" className="mx-auto max-w-6xl px-6 pb-16">
        <p className="eyebrow">Browser button</p>
        <h2 className="mt-2 text-3xl">“Fix this citation” bookmarklet</h2>
        <div className="panel mt-6 p-8">
          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
            A zero-install alternative to a full browser extension. On any repository or journal page, one click finds the
            DOI (from the page's citation metadata or your text selection) and opens it in CitationLX.
          </p>
          <Bookmarklet />
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            <b className="font-medium text-foreground">On your phone?</b> Mobile browsers don't run bookmarklets. Install CitationLX to your home screen and use the browser's Share menu → CitationLX (Android), or copy the page link and tap “Paste & fix” in the Cite by DOI tab.
          </p>
        </div>
      </section>

      <section id="features" className="mx-auto max-w-6xl px-6 pb-16">
        <p className="eyebrow">Features</p>
        <h2 className="mt-2 text-3xl">Everything you need to cite data right</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="panel group p-6 transition duration-200 hover:-translate-y-1 hover:border-accent/50">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/10 text-accent transition group-hover:scale-110">{f.icon}</div>
              <h3 className="mt-4 text-lg">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="how-it-works" className="mx-auto max-w-6xl px-6 pb-16">
        <p className="eyebrow">How it works</p>
        <h2 className="mt-2 text-3xl">Three steps to a correct dataset citation</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {[
            ["1", "Paste", "Drop in a DOI or repository link, a broken BibTeX / RIS / CSL export from your reference manager, or build a record manually for data shared without a DOI. The Software tab reads GitHub repos and CITATION.cff files."],
            ["2", "Diagnose & repair", "CitationLX checks the record against the DataCite or Crossref registry, fixes the resource type, version, authors and year, and shows you exactly which fields changed, with a citation health score. It also checks Crossref for retractions and updates before you cite."],
            ["3", "Export", "Copy a journal-ready citation in seven styles, download clean BibLaTeX, RIS or CSL JSON, and generate a funder-ready Data Availability Statement (NIH DMS, NSF, PLOS, Nature, Elsevier) or Zotero Extra snippet."],
          ].map(([n, title, body]) => (
              <div key={n} className="panel p-6">
                <div className="font-display text-4xl font-semibold text-accent">{n}</div>
                <h3 className="mt-2 text-xl">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
              </div>
            ))}
        </div>
      </section>

      <section id="faq" className="mx-auto max-w-6xl px-6 pb-16">
        <p className="eyebrow">FAQ</p>
        <h2 className="mt-2 text-3xl">Frequently asked questions</h2>
        <div className="mt-6 grid gap-3 md:grid-cols-2">
          {FAQS.map((f) => (
              <details key={f.q} className="panel group p-5">
                <summary className="cursor-pointer list-none font-medium leading-snug marker:hidden">
                  <span className="mr-2 inline-block transition group-open:rotate-90">▸</span>{f.q}
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{f.a}</p>
              </details>
            ))}
        </div>
      </section>

      <section id="suggest" className="mx-auto max-w-6xl px-6 pb-20">
        <div className="panel flex flex-col items-start justify-between gap-4 p-8 md:flex-row md:items-center">
          <div>
            <p className="eyebrow">Suggest a new useful feature</p>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
              CitationLX is a microtool on purpose — it does one job well. If there's a dataset citation problem it doesn't solve yet, tell us and we'll consider adding it.
            </p>
          </div>
          <a href="mailto:cantrell22@hotmail.com?subject=Feature%20suggestion%20for%20CitationLX" className="btn shrink-0">
            Suggest a feature
          </a>
        </div>
      </section>

      <footer className="border-t py-8 text-xs text-muted-foreground">
        <nav aria-label="Footer" className="mx-auto flex max-w-3xl flex-wrap items-center justify-center gap-x-6 gap-y-2">
          <a href="#features" className="transition hover:text-foreground">Features</a>
          <a href="#bookmarklet" className="transition hover:text-foreground">Browser button</a>
          <a href="#how-it-works" className="transition hover:text-foreground">How it works</a>
          <a href="#faq" className="transition hover:text-foreground">FAQ</a>
          <a href="/guides" className="transition hover:text-foreground">Guides</a>
          <a href="mailto:cantrell22@hotmail.com?subject=Feature%20suggestion%20for%20CitationLX" className="transition hover:text-foreground">Suggest a feature</a>
          <a href="https://www.paypal.com/donate/?business=georgec.ignite%40gmail.com&currency_code=USD&item_name=Buy%20the%20CitationLX%20maintainer%20a%20coffee&source=url" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 font-medium text-accent transition hover:opacity-80">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5" aria-hidden="true"><path d="M10 2v2" /><path d="M14 2v2" /><path d="M16 8a1 1 0 0 1 1 1v8a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V9a1 1 0 0 1 1-1h14a4 4 0 1 1 0 8h-1" /><path d="M6 2v2" /></svg>
            Buy the maintainer a coffee
          </a>
        </nav>
        <p className="mt-4 text-center">CitationLX is free. Metadata from DataCite & Crossref public APIs. Runs entirely in your browser — nothing is stored.</p>
      </footer>
    </div>
  );
}

function Empty() {
  return (
    <div className="panel flex h-full min-h-[420px] flex-col justify-center p-10">
      <p className="eyebrow">Try one</p>
      <div className="mt-3 space-y-1 font-mono text-sm">
        <p>10.5281/zenodo.3678171</p>
        <p>https://doi.org/10.5061/dryad.j6q573nb3</p>
        <p>https://github.com/pola-rs/polars</p>
      </div>
      <ul className="mt-8 grid gap-3 text-sm text-muted-foreground md:grid-cols-2">
        <li>✆ Detects datasets mis-typed as journal articles</li>
        <li>✆ Diffs your import against authoritative metadata</li>
        <li>✆ Generates a journal-ready Data Availability Statement</li>
        <li>✆ Zotero "Extra" field snippet for stubborn libraries</li>
        <li>✆ Software mode: GitHub repos & CITATION.cff</li>
        <li>✆ Warns if the record was retracted or updated</li>
      </ul>
    </div>
  );
}

function DoiInput({ onLoad, deepLink }: { onLoad: (r: DatasetRecord, s: string, ot?: string, ch?: any, v?: VersionInfo) => void; deepLink?: { doi: string; busy: boolean; err: string } | null }) {
  const [v, setV] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  useEffect(() => { if (deepLink?.doi) setV((prev) => prev || deepLink.doi); }, [deepLink?.doi]);
  const fetching = busy || !!deepLink?.busy;
  const go = async (raw?: string) => {
    const doi = extractDoi(raw ?? v);
    if (!doi) return setErr("No DOI found in that input. Repository pages (Zenodo, Dryad, figshare) usually show one — or use the “No DOI” tab to build the citation manually.");
    setErr(""); setBusy(true);
    try { const { record, source, rawType, versions } = await fetchByDoi(doi); track("doi_fetch", { doi }); onLoad(record, source, rawType, [], versions); }
    catch (e: any) { track("doi_fetch_error"); setErr(`${e.message} — you can also switch to the “No DOI” tab and enter the details manually.`); }
    finally { setBusy(false); }
  };
  const pasteAndGo = async () => {
    try {
      const t = await navigator.clipboard.readText();
      if (!t) return setErr("The clipboard is empty — copy the page link first, then tap Paste & fix.");
      setV(t);
      track("paste_fix");
      go(t);
    } catch {
      setErr("Couldn't read the clipboard. Copy the page link, paste it above, then press Fetch metadata.");
    }
  };
  return (
    <div className="space-y-3">
      <input className="field font-mono" placeholder="10.5281/zenodo.… or URL" value={v}
        onChange={(e) => setV(e.target.value)} onKeyDown={(e) => e.key === "Enter" && go()} />
      <div className="flex gap-2">
        <button className="btn flex-1 justify-center" disabled={fetching} onClick={() => go()}>{fetching ? "Fetching…" : "Fetch metadata"}</button>
        {typeof navigator !== "undefined" && !!navigator.clipboard?.readText && (
          <button className="btn-ghost" disabled={fetching} onClick={pasteAndGo}>Paste & fix</button>
        )}
      </div>
      {(err || deepLink?.err) && <p className="text-sm text-destructive">{err || deepLink?.err}</p>}
    </div>
  );
}

function SoftwareInput({ onLoad }: { onLoad: (r: DatasetRecord, s: string, ot?: string, ch?: any, v?: VersionInfo) => void }) {
  const [v, setV] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const go = async () => {
    setErr(""); setBusy(true);
    try {
      const { record, source } = await fetchSoftware(v);
      track("software_fetch", { via: /github\.com/i.test(v) ? "github" : /^cff-version:/m.test(v) ? "cff" : "doi" });
      onLoad(record, source);
    } catch (e: any) { setErr(e.message); }
    finally { setBusy(false); }
  };
  return (
    <div className="space-y-3">
      <input className="field font-mono" placeholder="github.com/org/repo or a software DOI" value={v}
        onChange={(e) => setV(e.target.value)} onKeyDown={(e) => e.key === "Enter" && go()} />
      <textarea className="field h-28 font-mono text-xs" placeholder={"… or paste a CITATION.cff:\ncff-version: 1.2.0\ntitle: My Software\nauthors:\n  - family-names: Doe"} value={v} onChange={(e) => setV(e.target.value)} />
      <button className="btn w-full justify-center" disabled={busy} onClick={go}>{busy ? "Fetching…" : "Fetch software metadata"}</button>
      {err && <p className="text-sm text-destructive">{err}</p>}
      <p className="text-xs text-muted-foreground">Reads the repo's CITATION.cff (FORCE11 software citation principles Guidelines), falls back to the GitHub API, and handles software DOIs such as Zenodo releases.</p>
    </div>
  );
}

const SAMPLE = `TY  - JOUR
AU  - SMITH, JANE
AU  - Lee Wong
TI  - Global soil moisture observations 2000-2020
JO  - Zenodo
PY  - 2021
UR  - http://dx.doi.org/10.5281/zenodo.3678171
ER  - `;

function RepairInput({ onLoad }: { onLoad: (r: DatasetRecord, s: string, ot?: string, ch?: any, v?: VersionInfo) => void }) {
  const [v, setV] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const go = async () => {
    const p = parseRecord(v);
    if (!p) return setErr("Couldn't read that. Paste a BibTeX entry, RIS record or CSL JSON.");
    setErr(""); setBusy(true);
    let fixed = { ...p.record, resourceType: "Dataset" };
    let src = `Your ${p.format} (repaired locally)`;
    let vInf: VersionInfo | undefined;
    if (p.record.doi) {
      try {
        const { record, versions } = await fetchByDoi(p.record.doi);
        fixed = { ...record, accessed: p.record.accessed };
        src = `${p.format} repaired against registry`;
        vInf = versions;
      } catch {}
    }
    track("repair_run", { format: p.format });
    onLoad(fixed, src, p.originalType, diff(p.record, fixed), vInf);
    setBusy(false);
  };
  return (
    <div className="space-y-3">
      <textarea className="field h-56 font-mono text-xs" placeholder="@article{…} or TY  - JOUR …" value={v} onChange={(e) => setV(e.target.value)} />
      <div className="flex gap-2">
        <button className="btn flex-1 justify-center" disabled={busy} onClick={go}>{busy ? "Repairing…" : "Diagnose & repair"}</button>
        <button className="btn-ghost" onClick={() => setV(SAMPLE)}>Sample</button>
      </div>
      {err && <p className="text-sm text-destructive">{err}</p>}
    </div>
  );
}

function NoDoi({ onLoad }: { onLoad: (r: DatasetRecord, s: string) => void }) {
  const [r, setR] = useState<DatasetRecord>({ ...emptyRecord(), identifierType: "URL" });
  const [authors, setAuthors] = useState("");
  const set = (k: keyof DatasetRecord) => (e: any) => setR({ ...r, [k]: e.target.value });
  const build = () => {
    const creators = authors.split(";").map((a) => a.trim()).filter(Boolean).map((a) =>
      a.includes(",") ? { family: a.split(",")[0].trim(), given: a.split(",")[1].trim() } : { literal: a });
    onLoad({ ...r, creators }, "Built manually (no DOI)");
  };
  return (
    <div className="space-y-2 text-sm">
      <input className="field" placeholder="Authors: Smith, Jane; Lab of Ecology" value={authors} onChange={(e) => setAuthors(e.target.value)} />
      <input className="field" placeholder="Dataset title" value={r.title} onChange={set("title")} />
      <div className="grid grid-cols-2 gap-2">
        <input className="field" placeholder="Year" value={r.year} onChange={set("year")} />
        <input className="field" placeholder="Version" value={r.version} onChange={set("version")} />
      </div>
      <input className="field" placeholder="Repository / host / lab" value={r.publisher} onChange={set("publisher")} />
      <div className="grid grid-cols-[110px_1fr] gap-2">
        <select className="field" value={r.identifierType} onChange={set("identifierType")}>
          {["URL", "Handle", "ARK", "Accession", "Other"].map((o) => <option key={o}>{o}</option>)}
        </select>
        <input className="field" placeholder="Link or identifier" value={r.url} onChange={set("url")} />
      </div>
      <label className="eyebrow block pt-1">Accessed</label>
      <input type="date" className="field" value={r.accessed} onChange={set("accessed")} />
      <button className="btn mt-2 w-full justify-center" onClick={build}>Build citation</button>
    </div>
  );
}

function Workbench({ record, setRecord, origType, changes, source, versions, onSwitchDoi }: {
  record: DatasetRecord; setRecord: (r: DatasetRecord) => void; origType?: string; changes: ReturnType<typeof diff>; source: string;
  versions?: VersionInfo; onSwitchDoi: (doi: string) => void;
}) {
  const issues = useMemo(() => validate(record, origType), [record, origType]);
  const s = score(issues);
  const [style, setStyle] = useState<Style>("APA 7");
  const [exp, setExp] = useState<keyof typeof EXPORTS>("BibLaTeX");
  const [copied, setCopied] = useState("");
  const copy = (t: string, id: string) => { navigator.clipboard.writeText(t.replace(/\*/g, "")); setCopied(id); setTimeout(() => setCopied(""), 1200); track("copy", { what: id }); };
  const [status, setStatus] = useState<StatusInfo>(null);
  useEffect(() => {
    let live = true;
    if (!record.doi) { setStatus(null); return; }
    checkStatus(record.doi)
      .then((st) => { if (live) { setStatus(st); if (st) track("status_warning", { doi: record.doi }); } })
      .catch(() => {});
    return () => { live = false; };
  }, [record.doi]);
  const [apiCite, setApiCite] = useState<string | null>(null);
  const [citeLoading, setCiteLoading] = useState(false);
  useEffect(() => {
    let live = true;
    if (!record.doi) { setApiCite(null); return; }
    setCiteLoading(true);
    fetchStyledCitation(record, style)
      .then((t) => { if (live) { setApiCite(t); setCiteLoading(false); } })
      .catch(() => { if (live) { setApiCite(null); setCiteLoading(false); } });
    return () => { live = false; };
  }, [record.doi, style, record]);
  const cite = apiCite ?? formatCitation(record, style);
  const out = EXPORTS[exp](record);
  const set = (k: keyof DatasetRecord) => (e: any) => setRecord({ ...record, [k]: e.target.value });
  const shareUrl = () => window.location.origin + "/#r=" + encodeShare({ record, origType, changes: changes as any, source });
  const shareText = `Fixed dataset citation: ${record.title}`;
  const nativeShare = async () => {
    const url = shareUrl();
    if (navigator.share) {
      try { await navigator.share({ title: record.title, text: shareText, url }); track("share_native"); return; } catch {}
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText + " " + url)}`, "_blank");
    track("share_link", { via: "whatsapp" });
  };

  return (
    <div className="space-y-6">
      <div className="panel p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="eyebrow">{source}</p>
            <h2 className="mt-1 text-2xl leading-snug">{record.title || "Untitled dataset"}</h2>
          </div>
          <div className="text-right">
            <div className={`font-display text-4xl font-semibold ${s >= 85 ? "text-success" : s >= 60 ? "text-warning" : "text-destructive"}`}>{s}</div>
            <p className="eyebrow">citation health</p>
            <button className="btn-ghost mt-2" onClick={() => shareCard(record, s)}>Score card</button>
          </div>
        </div>

        {versions && <VersionGuard versions={versions} onSwitchDoi={onSwitchDoi} />}

        {status && <StatusBanner status={status} />}

        {/software/i.test(record.resourceType ?? "") && !/CITATION\.cff|GitHub/i.test(source) && (
          <div className="mt-5 rounded-lg border border-warning/50 bg-warning/10 p-4 text-sm">
            <b className="font-medium">This DOI is registered as software.</b>{" "}
            <span className="text-muted-foreground">Switch to the Software / code tab for software-typed exports (@software BibLaTeX, RIS TY - COMP).</span>
          </div>
        )}

        {changes.length > 0 && (
          <div className="mt-5 rounded-lg bg-muted p-4">
            <p className="eyebrow mb-2">Repaired fields</p>
            <table className="w-full text-xs">
              <tbody>
                {changes.map((c) => (
                  <tr key={c.field} className="align-top">
                    <td className="py-1 pr-3 font-mono">{c.field}</td>
                    <td className="py-1 pr-3 text-destructive line-through">{c.before || "∅"}</td>
                    <td className="py-1 text-success">{c.after || "∅"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <ul className="mt-5 space-y-2">
          {issues.filter((i) => i.level !== "ok").map((i, n) => (
            <li key={n} className="flex gap-3 text-sm">
              <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${i.level === "error" ? "bg-destructive" : "bg-warning"}`} />
              <div><b className="font-medium">{i.field}:</b> {i.message}{i.fix && <span className="block text-muted-foreground">→ {i.fix}</span>}</div>
            </li>
          ))}
          {issues.every((i) => i.level === "ok") && <li className="text-sm text-success">All checks pass against DataCite & FORCE11 data citation principles</li>}
        </ul>
      </div>

      <div className="panel p-6">
        <p className="eyebrow mb-3">Edit metadata</p>
        <div className="grid gap-2 text-sm md:grid-cols-2">
          <input className="field md:col-span-2" value={record.title} onChange={set("title")} placeholder="Title" />
          <input className="field md:col-span-2" placeholder="Authors (Family, Given; …)"
            value={record.creators.map((c) => (c.family ? `${c.family}, ${c.given ?? ""}` : c.literal)).join("; ")}
            onChange={(e) =>
              setRecord({
                ...record,
                creators: e.target.value
                  .split(";").map((a) => a.trim()).filter(Boolean)
                  .map((a) => (a.includes(",")
                    ? { family: a.split(",")[0].trim(), given: a.split(",").slice(1).join(",").trim() }
                    : { literal: a })),
              })
            } />
          <input className="field min-w-0" value={record.year} onChange={set("year")} placeholder="Year" />
          <input className="field" value={record.version} onChange={set("version")} placeholder="Version" />
          <input className="field" value={record.publisher} onChange={set("publisher")} placeholder="Repository" />
          <input className="field font-mono" value={record.doi} onChange={set("doi")} placeholder="DOI" />
        </div>
        <OrcidPickup record={record} setRecord={setRecord} />
      </div>

      <div className="panel p-6">
        <div className="flex flex-wrap gap-1">
          {STYLES.map((st) => (
            <button key={st} onClick={() => setStyle(st)} className={`rounded-full px-3 py-1 text-xs ${style === st ? "bg-accent text-accent-foreground" : "bg-muted hover:bg-secondary"}`}>{st}</button>
          ))}
        </div>
        <p className={`mt-5 font-serif text-lg leading-relaxed ${citeLoading ? "opacity-50" : ""}`}
          dangerouslySetInnerHTML={{ __html: apiCite ? apiCite : escapeHtml(cite).replace(/\*(.+?)\*/g, "<em>$1</em>") }} />
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button className="btn-ghost" onClick={() => copy(cite.replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">"), "cite")}>{copied === "cite" ? "Copied ✓" : "Copy citation"}</button>
          {record.doi && <span className="text-xs text-muted-foreground">{citeLoading ? "Fetching official style…" : apiCite ? "Rendered by the DataCite registry" : "Rendered locally (registry unavailable)"}</span>}
        </div>
      </div>

      <div className="panel p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap gap-1">
            {(Object.keys(EXPORTS) as (keyof typeof EXPORTS)[]).map((k) => (
              <button key={k} onClick={() => setExp(k)} className={`rounded-full px-3 py-1 text-xs ${exp === k ? "bg-primary text-primary-foreground" : "bg-muted"}`}>{k}</button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button className="btn-ghost" onClick={() => copy(out, "exp")}>{copied === "exp" ? "Copied ✓" : "Copy"}</button>
            <button className="btn-ghost" onClick={() => { download(`dataset.${exp === "RIS" ? "ris" : exp === "CSL JSON" ? "json" : exp === "Zotero Extra" ? "txt" : "bib"}`, out); track("export_download", { format: exp }); }}>Download</button>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-1">
          <button className="btn-ghost" onClick={nativeShare}>{copied === "share" ? "Link copied ✓" : "Share"}</button>
          <button className="btn-ghost" onClick={() => { window.open(`https://wa.me/?text=${encodeURIComponent(shareText + " " + shareUrl())}`, "_blank"); track("share_link", { via: "whatsapp" }); }}>WhatsApp</button>
          <button className="btn-ghost" onClick={() => { window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl())}`, "_blank"); track("share_link", { via: "linkedin" }); }}>LinkedIn</button>
          <button className="btn-ghost" onClick={() => { window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl())}`, "_blank"); track("share_link", { via: "x" }); }}>X / Twitter</button>
          <button className="btn-ghost" onClick={() => { window.open(`mailto:?subject=${encodeURIComponent("Dataset citation repaired (CitationLX)")}&body=${encodeURIComponent(shareText + "\n" + shareUrl())}`); track("share_link", { via: "email" }); }}>Email</button>
          <button className="btn-ghost" onClick={() => { navigator.clipboard.writeText(shareUrl()); setCopied("share"); setTimeout(() => setCopied(""), 1200); track("share_link", { via: "copy" }); }}>{copied === "share" ? "Copied ✓" : "Copy link"}</button>
        </div>
        <pre className="mt-4 overflow-x-auto rounded-lg bg-muted p-4 font-mono text-xs leading-relaxed">{out}</pre>
        {exp === "Zotero Extra" && <p className="mt-2 text-xs text-muted-foreground">Paste into Zotero's Extra field to force dataset type and version in any citation style.</p>}
      </div>

      <DasPanel record={record} copy={copy} copied={copied} />
    </div>
  );
}

function VersionGuard({ versions, onSwitchDoi }: { versions: VersionInfo; onSwitchDoi: (doi: string) => void }) {
  if (versions.kind === "version") {
    return (
      <div className="mt-5 rounded-lg border border-success/40 bg-success/10 p-4 text-sm">
        <b className="font-medium">Version DOI — good.</b>{" "}
        <span className="text-muted-foreground">This DOI pins the exact version you used, which is what reproducibility guidance recommends. The concept DOI covering all versions is{" "}
          <a className="underline underline-offset-2" href={`https://doi.org/${versions.conceptDoi}`}>{versions.conceptDoi}</a>.</span>
      </div>
    );
  }
  return (
    <div className="mt-5 rounded-lg border border-warning/50 bg-warning/10 p-4 text-sm">
      <b className="font-medium">Concept DOI — this link always resolves to the latest version.</b>{" "}
      <span className="text-muted-foreground">If your results depend on a specific snapshot of the data, cite a version DOI instead:</span>
      <div className="mt-2 flex flex-wrap gap-2">
        {versions.versionDois?.slice(0, 6).map((d) => (
          <button key={d} className="btn-ghost" onClick={() => onSwitchDoi(d)}>{d}</button>
        ))}
      </div>
    </div>
  );
}

function StatusBanner({ status }: { status: StatusInfo }) {
  return (
    <div className="mt-5 rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm">
      {status!.updates.map((u, i) => (
        <p key={i} className={i ? "mt-2" : ""}>
          <b className="font-medium">⚠ {u.label ?? u.type.charAt(0).toUpperCase() + u.type.slice(1)}</b>
          {u.date ? ` (${u.date})` : ""} · Crossref reports this record was {u.type === "retraction" ? "retracted" : "updated or corrected"}.
          {u.doi && <> See the <a className="underline underline-offset-2" href={`https://doi.org/${u.doi}`}>update notice</a> before citing.</>}
        </p>
      ))}
      <p className="mt-1 text-xs text-muted-foreground">Checked against Crossref update metadata.</p>
    </div>
  );
}

function OrcidPickup({ record, setRecord }: { record: DatasetRecord; setRecord: (r: DatasetRecord) => void }) {
  const [id, setId] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const go = async () => {
    setBusy(true); setMsg("");
    try {
      const c = await fetchOrcidAuthor(id);
      setRecord({ ...record, creators: [...record.creators.filter((x) => x.orcid !== c.orcid), c] });
      setMsg(`Added ${c.family ?? c.literal}${c.given ? ", " + c.given : ""} from ORCID.`);
      track("orcid_fetch");
    } catch (e: any) { setMsg(e.message); }
    finally { setBusy(false); }
  };
  return (
    <div className="mt-3 border-t pt-3">
      <p className="eyebrow mb-2">ORCID pickup</p>
      <div className="flex gap-2">
        <input className="field font-mono" placeholder="0000-0002-1825-0097" value={id} onChange={(e) => setId(e.target.value)} onKeyDown={(e) => e.key === "Enter" && go()} />
        <button className="btn shrink-0" disabled={busy} onClick={go}>{busy ? "…" : "Add author"}</button>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">Paste an ORCID iD (0000-0002-1825-0097 is the demo iD) to pull the verified author name into this record.</p>
      {msg && <p className="mt-2 text-xs text-muted-foreground">{msg}</p>}
    </div>
  );
}

function DasPanel({ record, copy, copied }: { record: DatasetRecord; copy: (t: string, id: string) => void; copied: string }) {
  const [preset, setPreset] = useState(DAS_PRESETS[0].id);
  const p = DAS_PRESETS.find((x) => x.id === preset)!;
  const text = p.build(record);
  return (
    <div className="panel p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="eyebrow">Data availability statement</p>
        <div className="flex flex-wrap gap-1">
          {DAS_PRESETS.map((x) => (
            <button key={x.id} title={x.hint} onClick={() => { setPreset(x.id); track("das_preset", { preset: x.id }); }}
              className={`rounded-full px-3 py-1 text-xs ${preset === x.id ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-secondary"}`}>{x.label}</button>
          ))}
        </div>
      </div>
      <p className="mt-3 text-sm leading-relaxed">{text}</p>
      <button className="btn-ghost mt-4" onClick={() => copy(text, "das")}>{copied === "das" ? "Copied ✓" : "Copy statement"}</button>
    </div>
  );
}

function shareCard(record: DatasetRecord, s: number) {
  const c = document.createElement("canvas");
  c.width = 1200; c.height = 630;
  const x = c.getContext("2d");
  if (!x) return;
  x.fillStyle = "#1d1d26"; x.fillRect(0, 0, 1200, 630);
  x.fillStyle = "#d07a3a"; x.font = "italic 700 130px 'Playfair Display', Georgia, serif";
  x.fillText("\u201C", 48, 150);
  x.fillStyle = "#f5f1e8"; x.font = "500 44px 'Space Grotesk', Inter, sans-serif";
  const words = (record.title || "Untitled dataset").split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const t = line ? line + " " + w : w;
    if (x.measureText(t).width > 900 && line) { lines.push(line); line = w; if (lines.length === 2) break; }
    else line = t;
  }
  if (line && lines.length < 2) lines.push(line);
  const fit = (t: string, maxW: number) => {
    if (x.measureText(t).width <= maxW) return t;
    while (t.length > 1 && x.measureText(t + "…").width > maxW) t = t.slice(0, -1);
    return t + "…";
  };
  lines.slice(0, 2).forEach((l, i) => x.fillText(fit(l, 1080), 60, 250 + i * 56));
  const families = (record.creators ?? []).map((cr) => cr.family || cr.literal || "").filter(Boolean);
  const metaParts = [
    families.length ? families.slice(0, 3).join(", ") + (families.length > 3 ? " et al." : "") : "",
    record.year || "",
    record.version ? `version ${record.version}` : "",
    record.doi || record.url || "",
  ].filter(Boolean);
  if (metaParts.length) {
    x.fillStyle = "#8f8a99"; x.font = "26px Inter, sans-serif";
    x.fillText(fit(metaParts.join("  ·  "), 1080), 60, 250 + lines.length * 56 + 18);
  }
  x.fillStyle = "#d07a3a"; x.font = "700 170px 'Space Grotesk', Inter, sans-serif";
  const scoreTxt = String(s);
  x.fillText(scoreTxt, 60, 540);
  const sw = x.measureText(scoreTxt).width;
  x.fillStyle = "#f5f1e8"; x.font = "500 34px 'Space Grotesk', Inter, sans-serif";
  x.fillText("/ 100 citation health", 60 + sw + 32, 540);
  x.fillStyle = "#8f8a99"; x.font = "26px Inter, sans-serif";
  x.fillText("citationlx.online · dataset citation repair", 60, 596);
  const a = document.createElement("a");
  a.href = c.toDataURL("image/png");
  a.download = "citationlx-score.png";
  a.click();
  track("share_card");
}

const BOOKMARKLET = "javascript:(function(){var d='';var ms=document.querySelectorAll('meta[name=\"citation_doi\"],meta[name=\"DC.DOI\"],meta[name=\"prism.doi\"]');for(var i=0;i<ms.length;i++){var c=(ms[i].content||'').match(/10\\.\\d{4,9}\\/\\S+/);if(c){d=c[0];break}}if(!d)d=((window.getSelection()+'').match(/10\\.\\d{4,9}\\/\\S+/)||[])[0];if(!d)d=prompt('No DOI found on this page. Paste a DOI or dataset URL:');if(d){d=String(d).replace(/[.)]+$/,'');window.open('https://citationlx.online/?doi='+encodeURIComponent(d),'_blank')}})();";

function Bookmarklet() {
  const [copied, setCopied] = useState(false);
  const ref = useRef<HTMLAnchorElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.href = BOOKMARKLET;
  }, []);
  return (
    <div className="mt-4 flex flex-wrap items-center gap-3">
      <a ref={ref} draggable className="btn" href="#" onClick={(e) => e.preventDefault()}>Fix this citation · drag to bookmarks</a>
      <button className="btn-ghost" onClick={() => { navigator.clipboard.writeText(BOOKMARKLET); setCopied(true); setTimeout(() => setCopied(false), 1500); track("bookmarklet_copy"); }}>{copied ? "Code copied ✓" : "Copy code"}</button>
      <span className="text-xs text-muted-foreground">Drag the button to your bookmarks bar, or create a bookmark whose URL is the copied code.</span>
    </div>
  );
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]!));
}

type Row = { input: string; doi: string; status: string; record?: DatasetRecord; score?: number; dupOf?: number };

function Batch() {
  const [v, setV] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [busy, setBusy] = useState(false);
  const run = async () => {
    setBusy(true);
    track("batch_run");
    const chunks = v.includes("@") ? v.split(/(?=@\w+\s*\{)/) : v.split(/\n+/);
    const seen = new Map<string, number>();
    const base: Row[] = chunks.map((c) => c.trim()).filter(Boolean).map((c, i) => {
      const doi = extractDoi(c) ?? "";
      const r: Row = { input: c.slice(0, 80), doi, status: doi ? "queued" : "no DOI" };
      if (doi && seen.has(doi)) { r.dupOf = seen.get(doi)! + 1; r.status = "duplicate"; }
      else if (doi) seen.set(doi, i);
      return r;
    });
    setRows([...base]);
    await Promise.all(base.map(async (r, i) => {
      if (r.status !== "queued") return;
      try { const { record } = await fetchByDoi(r.doi); base[i] = { ...r, record, status: "ok", score: score(validate(record)) }; }
      catch { base[i] = { ...r, status: "not found" }; }
      setRows([...base]);
    }));
    setBusy(false);
  };
  const good = rows.filter((r) => r.record).map((r) => r.record!);
  return (
    <div className="space-y-3">
      <textarea className="field h-40 font-mono text-xs" placeholder={"One DOI/URL per line, or a .bib file"} value={v} onChange={(e) => setV(e.target.value)} />
      <button className="btn w-full justify-center" disabled={busy} onClick={run}>{busy ? "Processing…" : "Clean list"}</button>
      {rows.length > 0 && (
        <>
          <ul className="max-h-72 space-y-1 overflow-auto text-xs">
            {rows.map((r, i) => (
              <li key={i} className="flex justify-between gap-2 border-b py-1">
                <span className="truncate font-mono">{r.record?.title ?? r.doi ?? r.input}</span>
                <span className={r.status === "ok" ? "text-success" : r.status === "duplicate" ? "text-warning" : "text-muted-foreground"}>
                  {r.status === "duplicate" ? `dup of #${r.dupOf}` : r.status === "ok" ? r.score : r.status}
                </span>
              </li>
            ))}
          </ul>
          <p className="text-xs text-muted-foreground">{good.length} clean · {rows.filter((r) => r.status === "duplicate").length} duplicates removed</p>
          <div className="flex flex-wrap gap-2">
            <button className="btn-ghost" disabled={!good.length} onClick={() => download("datasets.bib", good.map(toBiblatex).join("\n\n"))}>.bib</button>
            <button className="btn-ghost" disabled={!good.length} onClick={() => download("datasets.ris", good.map(toRis).join("\n\n"))}>.ris</button>
            <button className="btn-ghost" disabled={!good.length} onClick={() => download("datasets.json", JSON.stringify(good.map(toCsl), null, 2), "application/json")}>CSL JSON</button>
          </div>
        </>
      )}
    </div>
  );
}
