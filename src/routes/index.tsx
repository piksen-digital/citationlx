import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  type DatasetRecord, type Style, EXPORTS, STYLES, diff, download, emptyRecord, extractDoi,
  fetchByDoi, fetchStyledCitation, formatCitation, parseRecord, score, toAvailability, validate, toBiblatex, toRis, toCsl,
} from "@/lib/citation";

const FAQS: { q: string; a: string }[] = [
  {
    q: "Why do reference managers get dataset citations wrong?",
    a: "Most reference managers were built for journal articles and books. When you import a dataset, they often record it as a journal article, drop the version, or lose the publisher (the repository), which produces citations that don't follow DataCite or FORCE11 data citation principles. CitationLX detects those errors and repairs them against the official registry record.",
  },
  {
    q: "Which citation styles does CitationLX support?",
    a: "Seven styles: APA 7, Chicago, MLA 9, Harvard, IEEE, Vancouver and Turabian. You can switch between them instantly and copy or download the result.",
  },
  {
    q: "What if my dataset has no DOI?",
    a: "Use the “No DOI” tab. You can build a citation manually with authors, title, year, version, publisher and any identifier you have (URL, Handle, ARK, accession number), including an accessed date for informally shared data.",
  },
  {
    q: "What export formats are available?",
    a: "Clean BibLaTeX, RIS and CSL JSON, plus a Zotero “Extra” field snippet that forces the dataset type and version even in stubborn libraries. Batch mode exports a whole cleaned reference list at once.",
  },
  {
    q: "Does CitationLX store my data?",
    a: "No. Everything runs in your browser. Metadata is fetched from the public DataCite and Crossref APIs, and nothing you paste is ever uploaded or saved.",
  },
  {
    q: "Is CitationLX free?",
    a: "Yes. CitationLX is a free microtool for academic researchers — no account, no sign-in, no limits.",
  },
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

type Tab = "doi" | "repair" | "nodoi" | "batch";
const TABS: [Tab, string, string][] = [
  ["doi", "Cite by DOI", "Paste a DOI or repository link"],
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

  const load = (r: DatasetRecord, src: string, ot?: string, ch: ReturnType<typeof diff> = []) => {
    setRecord(r); setSource(src); setOrigType(ot); setChanges(ch);
  };

  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-baseline gap-2">
          <span className="font-serif text-2xl italic">CitationLX</span>
          <span className="eyebrow">dataset citation repair</span>
        </div>
        <nav className="hidden items-center gap-5 text-sm md:flex">
          <a href="#how-it-works" className="text-muted-foreground transition hover:text-foreground">How it works</a>
          <a href="#faq" className="text-muted-foreground transition hover:text-foreground">FAQ</a>
          <a href="mailto:cantrell22@hotmail.com?subject=Feature%20suggestion%20for%20CitationLX" className="btn-ghost">Suggest a feature</a>
        </nav>
        <span className="font-mono text-xs text-muted-foreground md:hidden">DataCite · Crossref</span>
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
              <button key={id} onClick={() => setTab(id)}
                className={`rounded-md px-3 py-2 text-left text-sm transition ${tab === id ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}>
                {label}
              </button>
            ))}
          </nav>
          <div className="panel p-5">
            <p className="eyebrow mb-3">{TABS.find((t) => t[0] === tab)![2]}</p>
            {tab === "doi" && <DoiInput onLoad={load} />}
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
            <Workbench record={record} setRecord={setRecord} origType={origType} changes={changes} source={source} />
          ) : (
            <Empty />
          )}
        </div>
      </main>

      <section id="how-it-works" className="mx-auto max-w-6xl px-6 pb-16">
        <p className="eyebrow">How it works</p>
        <h2 className="mt-2 text-3xl">Three steps to a correct dataset citation</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {[
            ["1", "Paste", "Drop in a DOI or repository link, a broken BibTeX / RIS / CSL export from your reference manager, or build a record manually for data shared without a DOI."],
            ["2", "Diagnose & repair", "CitationLX checks the record against the DataCite or Crossref registry, fixes the resource type, version, authors and year, and shows you exactly which fields changed — with a citation health score."],
            ["3", "Export", "Copy a journal-ready citation in seven styles, download clean BibLaTeX, RIS or CSL JSON, and generate a Data Availability Statement or Zotero Extra snippet."],
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

      <footer className="border-t py-8 text-center text-xs text-muted-foreground">
        <p>Metadata from DataCite & Crossref public APIs. Runs entirely in your browser — nothing is stored.</p>
        <p className="mt-2">
          <a href="#how-it-works" className="underline-offset-2 hover:underline">How it works</a>
          {" · "}
          <a href="#faq" className="underline-offset-2 hover:underline">FAQ</a>
          {" · "}
          <a href="mailto:cantrell22@hotmail.com?subject=Feature%20suggestion%20for%20CitationLX" className="underline-offset-2 hover:underline">Suggest a feature</a>
        </p>
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
      </div>
      <ul className="mt-8 grid gap-3 text-sm text-muted-foreground md:grid-cols-2">
        <li>✦ Detects datasets mis-typed as journal articles</li>
        <li>✦ Diffs your import against authoritative metadata</li>
        <li>✦ Generates a journal-ready Data Availability Statement</li>
        <li>✦ Zotero "Extra" field snippet for stubborn libraries</li>
      </ul>
    </div>
  );
}

function DoiInput({ onLoad }: { onLoad: (r: DatasetRecord, s: string, ot?: string) => void }) {
  const [v, setV] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const go = async () => {
    const doi = extractDoi(v);
    if (!doi) return setErr("No DOI found in that input. Repository pages (Zenodo, Dryad, figshare) usually show one — or use the “No DOI” tab to build the citation manually.");
    setErr(""); setBusy(true);
    try { const { record, source, rawType } = await fetchByDoi(doi); onLoad(record, source, rawType); }
    catch (e: any) { setErr(`${e.message} — you can also switch to the “No DOI” tab and enter the details manually.`); }
    finally { setBusy(false); }
  };
  return (
    <div className="space-y-3">
      <input className="field font-mono" placeholder="10.5281/zenodo.… or URL" value={v}
        onChange={(e) => setV(e.target.value)} onKeyDown={(e) => e.key === "Enter" && go()} />
      <button className="btn w-full justify-center" disabled={busy} onClick={go}>{busy ? "Fetching…" : "Fetch metadata"}</button>
      {err && <p className="text-sm text-destructive">{err}</p>}
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

function RepairInput({ onLoad }: { onLoad: (r: DatasetRecord, s: string, ot?: string, ch?: any) => void }) {
  const [v, setV] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const go = async () => {
    const p = parseRecord(v);
    if (!p) return setErr("Couldn't read that. Paste a BibTeX entry, RIS record or CSL JSON.");
    setErr(""); setBusy(true);
    let fixed = { ...p.record, resourceType: "Dataset" };
    let src = `Your ${p.format} (repaired locally)`;
    if (p.record.doi) {
      try {
        const { record } = await fetchByDoi(p.record.doi);
        fixed = { ...record, accessed: p.record.accessed };
        src = `${p.format} repaired against registry`;
      } catch {}
    }
    onLoad(fixed, src, p.originalType, diff(p.record, fixed));
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

function Workbench({ record, setRecord, origType, changes, source }: {
  record: DatasetRecord; setRecord: (r: DatasetRecord) => void; origType?: string; changes: ReturnType<typeof diff>; source: string;
}) {
  const issues = useMemo(() => validate(record, origType), [record, origType]);
  const s = score(issues);
  const [style, setStyle] = useState<Style>("APA 7");
  const [exp, setExp] = useState<keyof typeof EXPORTS>("BibLaTeX");
  const [copied, setCopied] = useState("");
  const copy = (t: string, id: string) => { navigator.clipboard.writeText(t.replace(/\*/g, "")); setCopied(id); setTimeout(() => setCopied(""), 1200); };
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
          </div>
        </div>

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
          {issues.every((i) => i.level === "ok") && <li className="text-sm text-success">All checks pass against DataCite & FORCE11 data citation principles.</li>}
        </ul>
      </div>

      <div className="panel p-6">
        <p className="eyebrow mb-3">Edit metadata</p>
        <div className="grid gap-2 text-sm md:grid-cols-2">
          <input className="field md:col-span-2" value={record.title} onChange={set("title")} placeholder="Title" />
          <input className="field md:col-span-2" placeholder="Authors (Family, Given; …)"
            value={record.creators.map((c) => (c.family ? `${c.family}, ${c.given ?? ""}` : c.literal)).join("; ")}
            onChange={(e) => setRecord({ ...record, creators: e.target.value.split(";").map((a) => a.trim()).filter(Boolean).map((a) => a.includes(",") ? { family: a.split(",")[0].trim(), given: a.split(",").slice(1).join(",").trim() } : { literal: a }) })} />
          <input className="field min-w-0" value={record.year} onChange={set("year")} placeholder="Year" />
          <input className="field" value={record.version} onChange={set("version")} placeholder="Version" />
          <input className="field" value={record.publisher} onChange={set("publisher")} placeholder="Repository" />
          <input className="field font-mono" value={record.doi} onChange={set("doi")} placeholder="DOI" />
        </div>
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
          <div className="flex gap-2">
            <button className="btn-ghost" onClick={() => copy(out, "exp")}>{copied === "exp" ? "Copied ✓" : "Copy"}</button>
            <button className="btn-ghost" onClick={() => download(`dataset.${exp === "RIS" ? "ris" : exp === "CSL JSON" ? "json" : exp === "Zotero Extra" ? "txt" : "bib"}`, out)}>Download</button>
          </div>
        </div>
        <pre className="mt-4 overflow-x-auto rounded-lg bg-muted p-4 font-mono text-xs leading-relaxed">{out}</pre>
        {exp === "Zotero Extra" && <p className="mt-2 text-xs text-muted-foreground">Paste into Zotero's Extra field to force dataset type and version in any citation style.</p>}
      </div>

      <div className="panel p-6">
        <p className="eyebrow">Data availability statement</p>
        <p className="mt-3 text-sm leading-relaxed">{toAvailability(record)}</p>
        <button className="btn-ghost mt-4" onClick={() => copy(toAvailability(record), "das")}>{copied === "das" ? "Copied ✓" : "Copy statement"}</button>
      </div>
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
