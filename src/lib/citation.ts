// Dataset citation core: fetch, parse, validate, format, export.

export type Creator = { family?: string; given?: string; literal?: string; orcid?: string };
export type DatasetRecord = {
  title: string;
  creators: Creator[];
  year: string;
  publisher: string; // repository
  version: string;
  doi: string;
  url: string;
  resourceType: string; // e.g. Dataset, Software
  accessed: string; // YYYY-MM-DD
  description?: string;
  license?: string;
  identifierType?: string; // DOI, Handle, ARK, URL, Accession
  identifier?: string;
};

export const emptyRecord = (): DatasetRecord => ({
  title: "",
  creators: [],
  year: "",
  publisher: "",
  version: "",
  doi: "",
  url: "",
  resourceType: "Dataset",
  accessed: new Date().toISOString().slice(0, 10),
});

export function extractDoi(input: string): string | null {
  const m = input.trim().match(/10\.\d{4,9}\/[^\s"'<>,;}]+/i);
  if (!m) return null;
  return m[0].replace(/[.)\]]+$/, "").toLowerCase();
}

export type VersionInfo = { kind: "concept" | "version"; conceptDoi?: string; versionDois?: string[] };

export async function fetchByDoi(doi: string): Promise<{ record: DatasetRecord; source: string; rawType: string; versions?: VersionInfo }> {
  // Try DataCite first (richer dataset metadata), fallback to content negotiation.
  try {
    const r = await fetch(`https://api.datacite.org/dois/${encodeURIComponent(doi)}`);
    if (r.ok) {
      const a = (await r.json()).data.attributes;
      const rec: DatasetRecord = {
        ...emptyRecord(),
        title: a.titles?.[0]?.title ?? "",
        creators: (a.creators ?? []).map((c: any) => ({
          family: c.familyName,
          given: c.givenName,
          literal: c.familyName ? undefined : c.name,
          orcid: c.nameIdentifiers?.find((n: any) => n.nameIdentifierScheme === "ORCID")?.nameIdentifier,
        })),
        year: String(a.publicationYear ?? ""),
        publisher: typeof a.publisher === "string" ? a.publisher : a.publisher?.name ?? "",
        version: a.version ?? "",
        doi,
        url: `https://doi.org/${doi}`,
        resourceType: a.types?.resourceTypeGeneral ?? a.types?.resourceType ?? "",
        description: a.descriptions?.[0]?.description,
        license: a.rightsList?.[0]?.rights,
        identifierType: "DOI",
      };
      const rel: any[] = a.relatedIdentifiers ?? [];
      const toDoi = (x: any) => String(x?.relatedIdentifier ?? "").replace(/^doi:/i, "").toLowerCase();
      const conceptRel = rel.find((x) => x.relationType === "IsVersionOf")
        ?? rel.find((x) => x.relationType === "IsPreviousVersionOf" || x.relationType === "IsNewVersionOf");
      const versionDois = rel.filter((x) => x.relationType === "HasVersion").map(toDoi);
      const versions: VersionInfo | undefined = conceptRel
        ? { kind: "version", conceptDoi: toDoi(conceptRel) }
        : versionDois.length ? { kind: "concept", versionDois } : undefined;
      return { record: rec, source: "DataCite", rawType: a.types?.resourceTypeGeneral ?? "", versions };
    }
  } catch {}
  const r = await fetch(`https://doi.org/${doi}`, { headers: { Accept: "application/vnd.citationstyles.csl+json" } });
  if (!r.ok) throw new Error(`DOI not found (${r.status}). If this dataset has no registered DOI, use the “No DOI” tab to build the citation manually.`);
  const c = await r.json();
  return { record: fromCsl(c, doi), source: "Crossref / doi.org", rawType: c.type ?? "" };
}

function fromCsl(c: any, doi: string): DatasetRecord {
  return {
    ...emptyRecord(),
    title: Array.isArray(c.title) ? c.title[0] : c.title ?? "",
    creators: (c.author ?? []).map((a: any) => ({ family: a.family, given: a.given, literal: a.literal ?? a.name })),
    year: String(c.issued?.["date-parts"]?.[0]?.[0] ?? c.published?.["date-parts"]?.[0]?.[0] ?? ""),
    publisher: c.publisher ?? "",
    version: c.version ?? "",
    doi,
    url: `https://doi.org/${doi}`,
    resourceType: c.type === "dataset" ? "Dataset" : c.type === "software" ? "Software" : c.type ?? "",
    identifierType: "DOI",
  };
}

// ---------- Parsing imported (broken) records ----------
export type Parsed = { record: DatasetRecord; format: string; originalType: string };

export function parseRecord(text: string): Parsed | null {
  const t = text.trim();
  if (!t) return null;
  if (t.startsWith("@")) return parseBibtex(t);
  if (/^TY\s{2}-/m.test(t)) return parseRis(t);
  if (t.startsWith("{") || t.startsWith("[")) {
    try {
      const j = JSON.parse(t);
      const c = Array.isArray(j) ? j[0] : j;
      return { record: fromCsl(c, (c.DOI ?? "").toLowerCase()), format: "CSL JSON", originalType: c.type ?? "?" };
    } catch {}
  }
  return null;
}

function splitNames(s: string): Creator[] {
  return s
    .split(/\s+and\s+/i)
    .map((n) => n.trim().replace(/[{}]/g, ""))
    .filter(Boolean)
    .map((n) => {
      if (n.includes(",")) {
        const [family, given] = n.split(",").map((x) => x.trim());
        return { family, given };
      }
      const parts = n.split(/\s+/);
      if (parts.length === 1) return { literal: n };
      return { family: parts.pop(), given: parts.join(" ") };
    });
}

function parseBibtex(t: string): Parsed {
  const type = (t.match(/^@(\w+)/)?.[1] ?? "").toLowerCase();
  const f: Record<string, string> = {};
  const re = /(\w+)\s*=\s*(\{((?:[^{}]|\{[^{}]*\})*)\}|"([^"]*)"|(\d+))/g;
  let m;
  while ((m = re.exec(t))) f[m[1].toLowerCase()] = (m[3] ?? m[4] ?? m[5] ?? "").replace(/[{}]/g, "").trim();
  const doi = extractDoi(f.doi ?? f.url ?? "") ?? "";
  return {
    format: "BibTeX",
    originalType: type,
    record: {
      ...emptyRecord(),
      title: f.title ?? "",
      creators: f.author ? splitNames(f.author) : [],
      year: f.year ?? f.date?.slice(0, 4) ?? "",
      publisher: f.publisher ?? f.organization ?? f.institution ?? f.howpublished ?? f.journal ?? "",
      version: f.version ?? f.edition ?? "",
      doi,
      url: f.url ?? (doi ? `https://doi.org/${doi}` : ""),
      resourceType: type === "dataset" ? "Dataset" : type === "software" ? "Software" : "",
      accessed: f.urldate ?? emptyRecord().accessed,
    },
  };
}

function parseRis(t: string): Parsed {
  const lines = t.split(/\r?\n/);
  const get = (k: string) => lines.filter((l) => l.startsWith(k + "  -")).map((l) => l.slice(6).trim());
  const type = get("TY")[0] ?? "";
  const doi = extractDoi(get("DO")[0] ?? get("UR")[0] ?? "") ?? "";
  return {
    format: "RIS",
    originalType: type,
    record: {
      ...emptyRecord(),
      title: get("TI")[0] ?? get("T1")[0] ?? "",
      creators: [...get("AU"), ...get("A1")].map((n) => splitNames(n)[0]),
      year: (get("PY")[0] ?? get("Y1")[0] ?? get("DA")[0] ?? "").slice(0, 4),
      publisher: get("PB")[0] ?? get("DB")[0] ?? get("JO")[0] ?? get("T2")[0] ?? "",
      version: get("ET")[0] ?? "",
      doi,
      url: get("UR")[0] ?? (doi ? `https://doi.org/${doi}` : ""),
      resourceType: type === "DATA" ? "Dataset" : type === "COMP" ? "Software" : "",
    },
  };
}

// ---------- Validator ----------
export type Issue = { level: "error" | "warn" | "ok"; field: string; message: string; fix?: string };

export function validate(r: DatasetRecord, originalType?: string): Issue[] {
  const out: Issue[] = [];
  const push = (level: Issue["level"], field: string, message: string, fix?: string) =>
    out.push({ level, field, message, fix });

  if (originalType && !/^(dataset|data|misc|software|comp)$/i.test(originalType) && originalType !== "?")
    push("error", "Item type", `Imported as "${originalType}" — reference managers will format it like a journal article.`, "Set type to Dataset (RIS: DATA, BibLaTeX: @dataset, CSL: dataset).");
  if (originalType && /^misc$/i.test(originalType))
    push("warn", "Item type", "Typed as @misc. Works, but styles can't add the [Data set] label.", "Use @dataset (BibLaTeX) or keep @misc with a type note.");

  r.creators.length ? push("ok", "Creators", `${r.creators.length} creator(s)`) : push("error", "Creators", "No creators. Datasets need authors to give credit.", "Add the dataset authors or the responsible organisation.");
  const allCaps = r.creators.some((c) => c.family && c.family === c.family.toUpperCase() && c.family.length > 3);
  if (allCaps) push("warn", "Creators", "Some names are ALL CAPS (common repository export artefact).", "Use title-case names.");
  if (r.creators.some((c) => c.literal && /\s/.test(c.literal) && !/(institute|university|lab|centre|center|group|consortium|survey|agency|office|bureau|team|project)/i.test(c.literal)))
    push("warn", "Creators", "A person appears stored as a single literal name — it won't sort or abbreviate correctly.", "Split into family / given names.");

  r.title ? push("ok", "Title", "Present") : push("error", "Title", "Missing title.");
  if (r.title && r.title === r.title.toUpperCase() && r.title.length > 10) push("warn", "Title", "Title is ALL CAPS.");
  /^\d{4}$/.test(r.year) ? push("ok", "Year", r.year) : push("error", "Year", "Missing or malformed publication year.");
  r.publisher ? push("ok", "Repository", r.publisher) : push("error", "Repository", "No publisher / repository. Required by DataCite and the Joint Declaration of Data Citation Principles.", "Add the archive, e.g. Zenodo, Dryad, PANGAEA.");
  if (r.publisher && /journal|letters|review|proceedings/i.test(r.publisher)) push("warn", "Repository", "Publisher looks like a journal name — likely a mis-mapped field.");
  r.version ? push("ok", "Version", r.version) : push("warn", "Version", "No version. Datasets change; cite the version you used.", "Add version (e.g. v2.1) if the repository provides one.");
  if (r.doi) push("ok", "Identifier", `DOI ${r.doi}`);
  else if (r.identifier || r.url) {
    push("warn", "Identifier", "No DOI. Citation relies on a URL/other identifier which may break.", "Prefer Handle/ARK/accession number; always include an access date.");
    if (!r.accessed) push("error", "Access date", "Non-DOI citations need an access date.");
  } else push("error", "Identifier", "No DOI, URL or identifier — the data can't be located.");
  if (r.url && /^http:\/\/dx\.doi\.org|^doi:/i.test(r.url)) push("warn", "Identifier", "Old DOI form. Current guidance is https://doi.org/…");
  if (r.resourceType && !/dataset|data|software/i.test(r.resourceType)) push("warn", "Resource type", `Resource type is "${r.resourceType}", not Dataset.`);
  return out;
}

export const score = (issues: Issue[]) => {
  const e = issues.filter((i) => i.level === "error").length;
  const w = issues.filter((i) => i.level === "warn").length;
  return Math.max(0, 100 - e * 20 - w * 7);
};

// ---------- Formatting ----------
const initials = (g?: string) => (g ? g.split(/[\s-]+/).filter(Boolean).map((p) => p[0].toUpperCase() + ".").join(" ") : "");
const nm = (c: Creator, style: "apa" | "full" | "vancouver" | "inverted") => {
  if (c.literal && !c.family) return c.literal;
  if (style === "apa") return `${c.family}${c.given ? ", " + initials(c.given) : ""}`;
  if (style === "vancouver") return `${c.family} ${initials(c.given).replace(/[.\s]/g, "")}`;
  if (style === "inverted") return `${c.family}${c.given ? ", " + c.given : ""}`;
  return `${c.given ? c.given + " " : ""}${c.family}`;
};
const join = (arr: string[], last = "&") =>
  arr.length <= 1 ? arr.join("") : arr.length === 2 ? `${arr[0]} ${last} ${arr[1]}` : `${arr.slice(0, -1).join(", ")}, ${last} ${arr.at(-1)}`;
const idLink = (r: DatasetRecord) => (r.doi ? `https://doi.org/${r.doi}` : r.url || r.identifier || "");
const fmtDate = (d: string) => {
  const dt = new Date(d);
  return isNaN(+dt) ? d : dt.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

export const STYLES = ["APA 7", "DataCite", "Chicago", "Harvard", "MLA 9", "Vancouver", "IEEE"] as const;
export type Style = (typeof STYLES)[number];

const isSoftware = (r: DatasetRecord) => /software/i.test(r.resourceType ?? "");

export function formatCitation(r: DatasetRecord, style: Style): string {
  const cs = r.creators;
  const isSw = isSoftware(r);
  const v = r.version ? ` (Version ${r.version.replace(/^v(ersion)?\s*/i, "")})` : "";
  const id = idLink(r);
  const acc = !r.doi && r.accessed ? fmtDate(r.accessed) : "";
  switch (style) {
    case "APA 7": {
      const a = cs.length > 20 ? [...cs.slice(0, 19).map((c) => nm(c, "apa")), "⊂", nm(cs.at(-1)!, "apa")].join(", ") : join(cs.map((c) => nm(c, "apa")), "&");
      return `${a || r.publisher} (${r.year || "n.d."}). *${r.title}*${v} ${isSw ? "[Computer software]" : "[Data set]"}. ${r.publisher ? r.publisher + ". " : ""}${acc ? `Retrieved ${acc}, from ` : ""}${id}`.trim();
    }
    case "DataCite":
      return `${cs.map((c) => nm(c, "apa")).join("; ")} (${r.year}). ${r.title}${r.version ? ` (Version ${r.version})` : ""} [${r.resourceType || "Dataset"}]. ${r.publisher}. ${id}`;
    case "Chicago": {
      const a = cs.length ? [nm(cs[0], "inverted"), ...cs.slice(1).map((c) => nm(c, "full"))] : [];
      return `${join(a, "and")}. ${r.year}. “${r.title}.” ${r.version ? `Version ${r.version}. ` : ""}${r.publisher}. ${isSw ? "Computer software" : "Dataset"}. ${acc ? `Accessed ${acc}. ` : ""}${id}.`;
    }
    case "Harvard":
      return `${join(cs.map((c) => nm(c, "apa")), "and")} (${r.year}) *${r.title}*${v ? "," + v.replace(/[()]/g, "") : ""} ${isSw ? "[Computer software]" : "[Dataset]"}. ${r.publisher}. ${acc ? `Available at: ${id} (Accessed: ${acc}).` : `Available at: ${id}.`}`;
    case "MLA 9": {
      const a = cs.length === 0 ? "" : cs.length === 1 ? nm(cs[0], "inverted") : cs.length === 2 ? `${nm(cs[0], "inverted")}, and ${nm(cs[1], "full")}` : `${nm(cs[0], "inverted")}, et al`;
      return `${a ? a + ". " : ""}*${r.title}*. ${r.version ? `Version ${r.version}, ` : ""}${r.publisher}, ${r.year}. ${isSw ? "Computer software" : "Dataset"}, ${id.replace(/^https?:\/\//, "")}.${acc ? ` Accessed ${acc}.` : ""}`;
    }
    case "Vancouver": {
      const a = cs.length > 6 ? cs.slice(0, 6).map((c) => nm(c, "vancouver")).join(", ") + ", et al" : cs.map((c) => nm(c, "vancouver")).join(", ");
      return `${a}. ${r.title} ${isSw ? "[computer software]" : "[dataset]"}. ${r.version ? `Version ${r.version}. ` : ""}${r.publisher}; ${r.year}${acc ? ` [cited ${r.accessed}]` : ""}. Available from: ${id}`;
    }
    case "IEEE": {
      const a = cs.map((c) => `${initials(c.given)} ${c.family ?? c.literal}`.trim());
      return `${join(a, "and")}, “${r.title},” ${r.publisher}, ${r.version ? `ver. ${r.version}, ` : ""}${r.year}. [Online]. Available: ${id}`;
    }
  }
}

// ---------- Official DataCite style rendering ----------
// DataCite's content-negotiation endpoint renders registry-verified citations.
const STYLE_API: Record<Style, string> = {
  "APA 7": "apa",
  DataCite: "datacite",
  Chicago: "chicago-author-date",
  Harvard: "harvard3",
  "MLA 9": "mla",
  Vancouver: "vancouver",
  IEEE: "ieee",
};

/** Fetch the official rendered citation for a DOI; falls back to local formatting on any failure. */
export async function fetchStyledCitation(r: DatasetRecord, style: Style): Promise<string> {
  if (!r.doi) return formatCitation(r, style);
  try {
    const res = await fetch(`https://api.datacite.org/text/x-bibliography/${encodeURIComponent(r.doi)}?style=${STYLE_API[style]}`, {
      headers: { Accept: "text/x-bibliography" },
    });
    if (!res.ok) throw new Error(String(res.status));
    const text = (await res.text()).trim();
    if (!text) throw new Error("empty");
    return text;
  } catch {
    return formatCitation(r, style);
  }
}

// ---------- Exports ----------
const key = (r: DatasetRecord) =>
  ((r.creators[0]?.family ?? r.creators[0]?.literal ?? r.publisher ?? "data").replace(/[^A-Za-z]/g, "") + (r.year || "nd") + (r.title.split(/\s+/).find((w) => w.length > 3) ?? "").replace(/[^A-Za-z]/g, "")).toLowerCase();
const bibAuthors = (r: DatasetRecord) => r.creators.map((c) => (c.family ? `${c.family}, ${c.given ?? ""}`.replace(/, $/, "") : `{${c.literal}}`)).join(" and ");

export function toBiblatex(r: DatasetRecord) {
  const f: [string, string][] = [
    ["author", bibAuthors(r)], ["title", `{${r.title}}`], ["year", r.year], ["publisher", r.publisher],
    ["version", r.version], ["doi", r.doi], ["url", idLink(r)], ["urldate", r.doi ? "" : r.accessed],
  ];
  return `@${isSoftware(r) ? "software" : "dataset"}{${key(r)},\n${f.filter(([, v]) => v).map(([k, v]) => `  ${k} = {${v}}`).join(",\n")}\n}`;
}
export function toBibtex(r: DatasetRecord) {
  const f: [string, string][] = [
    ["author", bibAuthors(r)], ["title", `{${r.title}}`], ["year", r.year], ["publisher", r.publisher],
    ["howpublished", r.publisher], ["version", r.version], ["doi", r.doi], ["url", idLink(r)],
    ["note", `[${isSoftware(r) ? "Computer software" : "Data set"}]${r.version ? `, Version ${r.version}` : ""}${!r.doi && r.accessed ? `. Accessed ${r.accessed}` : ""}`],
  ];
  return `@misc{${key(r)},\n${f.filter(([, v]) => v).map(([k, v]) => `  ${k} = {${v}}`).join(",\n")}\n}`;
}
export function toRis(r: DatasetRecord) {
  const l = [isSoftware(r) ? "TY  - COMP" : "TY  - DATA", ...r.creators.map((c) => `AU  - ${c.family ? `${c.family}, ${c.given ?? ""}`.replace(/, $/, "") : c.literal}`),
    `TI  - ${r.title}`, `PY  - ${r.year}`, r.publisher && `PB  - ${r.publisher}`, r.publisher && `DP  - ${r.publisher}`,
    r.version && `ET  - ${r.version}`, r.doi && `DO  - ${r.doi}`, `UR  - ${idLink(r)}`, !r.doi && r.accessed && `Y2  - ${r.accessed}`,
    r.license && `C1  - License: ${r.license}`, "ER  - "];
  return l.filter(Boolean).join("\n");
}
export function toCsl(r: DatasetRecord) {
  return {
    id: key(r), type: isSoftware(r) ? "software" : "dataset", title: r.title,
    author: r.creators.map((c) => (c.family ? { family: c.family, given: c.given } : { literal: c.literal })),
    issued: r.year ? { "date-parts": [[Number(r.year)]] } : undefined,
    publisher: r.publisher, version: r.version || undefined, DOI: r.doi || undefined, URL: idLink(r),
    accessed: !r.doi && r.accessed ? { "date-parts": [r.accessed.split("-").map(Number)] } : undefined,
    genre: isSoftware(r) ? "Software" : "Data set",
  };
}
export function toZoteroExtra(r: DatasetRecord) {
  // Works in any Zotero version (and for "Document" items in older ones).
  return [`Type: ${isSoftware(r) ? "software" : "dataset"}`, r.version && `Version: ${r.version}`, r.doi && `DOI: ${r.doi}`, r.publisher && `Publisher: ${r.publisher}`, `Genre: ${isSoftware(r) ? "Software" : "Data set"}`]
    .filter(Boolean).join("\n");
}
export function toAvailability(r: DatasetRecord) {
  const who = r.creators.length ? (r.creators.length > 2 ? `${nm(r.creators[0], "apa").split(",")[0]} et al.` : join(r.creators.map((c) => c.family ?? c.literal ?? ""), "&")) : r.publisher;
  return `The data that support the findings of this study are openly available in ${r.publisher || "[repository]"} at ${idLink(r)}${r.version ? ` (version ${r.version})` : ""}${r.license ? `, under a ${r.license} licence` : ""}, reference ${who} (${r.year}).`;
}

export const EXPORTS = {
  "BibLaTeX": toBiblatex,
  "BibTeX": toBibtex,
  "RIS": toRis,
  "CSL JSON": (r: DatasetRecord) => JSON.stringify(toCsl(r), null, 2),
  "Zotero Extra": toZoteroExtra,
} as const;

export function diff(a: DatasetRecord, b: DatasetRecord) {
  const fields: (keyof DatasetRecord)[] = ["title", "year", "publisher", "version", "doi", "resourceType"];
  const out = fields
    .filter((f) => String(a[f] ?? "").trim() !== String(b[f] ?? "").trim())
    .map((f) => ({ field: f, before: String(a[f] ?? ""), after: String(b[f] ?? "") }));
  if (a.creators.length !== b.creators.length)
    out.push({ field: "creators" as any, before: `${a.creators.length} names`, after: `${b.creators.length} names` });
  return out;
}

export function download(name: string, text: string, mime = "text/plain") {
  const url = URL.createObjectURL(new Blob([text], { type: mime }));
  const a = document.createElement("a");
  a.href = url; a.download = name; a.click();
  URL.revokeObjectURL(url);
}

// ---------- Shareable repair reports (URL fragment only — nothing is stored server-side) ----------

export type SharePayload = {
  record: DatasetRecord; origType?: string;
  changes: { field: string; before: string; after: string }[]; source: string;
};

export function encodeShare(p: SharePayload): string {
  const bytes = new TextEncoder().encode(JSON.stringify({ v: 1, ...p }));
  let bin = "";
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function decodeShare(s: string): SharePayload | null {
  try {
    const b64 = s.replace(/-/g, "+").replace(/_/g, "/");
    const bin = atob(b64 + "=".repeat((4 - (b64.length % 4)) % 4));
    const bytes = Uint8Array.from(bin, (ch) => ch.charCodeAt(0));
    const j = JSON.parse(new TextDecoder().decode(bytes));
    if (!j || j.v !== 1 || !j.record || !Array.isArray(j.record.creators)) return null;
    return { record: j.record, origType: j.origType, changes: j.changes ?? [], source: j.source || "Shared report" };
  } catch {
    return null;
  }
}

// ---------- Retraction / update status (Crossref) ----------
export type StatusInfo = { updates: { type: string; label?: string; doi: string; date?: string }[] } | null;

/** Checks Crossref update metadata (retractions, corrections). Returns null when the DOI is not in Crossref or has no updates. */
export async function checkStatus(doi: string): Promise<StatusInfo> {
  try {
    const r = await fetch(`https://api.crossref.org/works/${encodeURIComponent(doi)}`);
    if (!r.ok) return null;
    const m = (await r.json()).message ?? {};
    const ups = (Array.isArray(m["update-to"]) ? m["update-to"] : [])
      .map((u: any) => ({
        type: String(u.type ?? "update"),
        label: u.label ?? undefined,
        doi: String(u.DOI ?? ""),
        date: Array.isArray(u.updated) ? u.updated.filter((x: any) => typeof x === "number").join("-") : undefined,
      }))
      .filter((u: any) => u.doi);
    return ups.length ? { updates: ups } : null;
  } catch {
    return null;
  }
}

// ---------- Data availability statement presets ----------
const citeAuthors = (r: DatasetRecord) =>
  r.creators.length
    ? join(r.creators.map((c) => (c.family ? `${c.family}, ${c.given ?? ""}`.replace(/, $/, "") : c.literal ?? "")), "&")
    : r.publisher || "the authors";
const fullRef = (r: DatasetRecord) =>
  `${citeAuthors(r)} (${r.year}). ${r.title}${r.version ? ` (Version ${r.version})` : ""}. ${r.publisher}. ${idLink(r)}.`;

export type DasPreset = { id: string; label: string; hint: string; build: (r: DatasetRecord) => string };

export const DAS_PRESETS: DasPreset[] = [
  { id: "generic", label: "Generic", hint: "Works for any journal or funder", build: toAvailability },
  { id: "nih", label: "NIH DMS", hint: "NIH Data Management & Sharing Plan (2026 format)", build: (r) => `The dataset(s) generated and/or analysed during the current study are available in the ${r.publisher || "[repository]"} repository, ${idLink(r)}${r.version ? ` (version ${r.version})` : ""}. ${r.license ? `The data are shared under a ${r.license} licence. ` : ""}Reference: ${fullRef(r)}.` },
  { id: "nsf", label: "NSF", hint: "NSF data management plan (Research.gov)", build: (r) => `Data supporting the findings of this study are preserved and openly available in ${r.publisher || "[repository]"} at ${idLink(r)}${r.version ? ` (version ${r.version})` : ""}, in formats that allow verification and reanalysis by other researchers. Reference: ${fullRef(r)}.` },
  { id: "plos", label: "PLOS", hint: "PLOS data availability policy", build: (r) => `All relevant data are available from the ${r.publisher || "[repository]"} database (DOI: ${r.doi || idLink(r)}${r.version ? `, version ${r.version}` : ""}). Reference: ${fullRef(r)}.` },
  { id: "nature", label: "Nature Portfolio", hint: "Nature journals' data availability statement", build: (r) => `The datasets generated and/or analysed during the current study are available in the ${r.publisher || "[repository]"} repository, ${idLink(r)}${r.version ? ` (version ${r.version})` : ""}. Reference: ${fullRef(r)}.` },
  { id: "elsevier", label: "Elsevier", hint: "Elsevier research data statement", build: (r) => `The data that support the findings of this study are openly available in ${r.publisher || "[repository]"} at ${idLink(r)}${r.version ? ` (version ${r.version})` : ""}, reference ${fullRef(r)}.` },
];

// ---------- Software citation mode (CITATION.cff / GitHub / software DOIs) ----------
/** Minimal parser for the subset of CITATION.cff (YAML) that matters for citations. */
export function parseCff(text: string): DatasetRecord | null {
  if (!/^cff-version:/m.test(text.trim())) return null;
  const scalar = (k: string) => new RegExp(`^${k}:\\s*(.+?)\\s*$`, "m").exec(text)?.[1]?.replace(/^["']|["']$/g, "");
  const FIELD: Record<string, string> = { "family-names": "family", "given-names": "given", name: "literal", alias: "alias", orcid: "orcid" };
  const kv = (l: string) => {
    const m = /^\s*(family-names|given-names|name|alias|orcid):\s*(.*?)\s*$/.exec(l);
    return m ? { k: FIELD[m[1]], v: m[2].replace(/^["']|["']$/g, "") } : null;
  };
  const authors: Creator[] = [];
  let cur: any = {};
  let inAuthors = false;
  const push = () => {
    const c = cur;
    const creator: Creator = c.family || c.given
      ? { family: c.family, given: c.given, orcid: c.orcid }
      : { literal: c.literal ?? c.alias, orcid: c.orcid };
    if (creator.family || creator.given || creator.literal) authors.push(creator);
    cur = {};
  };
  for (const line of text.split(/\r?\n/)) {
    if (/^authors:/.test(line)) { inAuthors = true; continue; }
    if (!inAuthors) continue;
    if (/^\S/.test(line)) { push(); break; }
    if (/^\s*-\s*/.test(line)) { push(); const p = kv(line.replace(/^\s*-\s*/, "")); if (p) cur[p.k] = p.v; continue; }
    const p = kv(line); if (p) cur[p.k] = p.v;
  }
  push();
  const title = scalar("title") ?? "";
  if (!title) return null;
  const released = scalar("date-released") ?? "";
  const repoUrl = scalar("repository-code") ?? scalar("repository") ?? scalar("url") ?? "";
  return {
    ...emptyRecord(),
    title,
    creators: authors,
    year: released.slice(0, 4) || String(new Date().getFullYear()),
    publisher: /github/i.test(repoUrl) ? "GitHub" : "Zenodo",
    version: scalar("version") ?? "",
    doi: (scalar("doi") ?? "").toLowerCase(),
    url: repoUrl,
    resourceType: "Software",
    description: scalar("abstract") ?? "",
    license: scalar("license") ?? "",
    identifierType: "DOI",
  };
}

/** Fetch software metadata from a GitHub repo (CITATION.cff, then the GitHub API), a software DOI, or pasted CFF text. */
export async function fetchSoftware(input: string): Promise<{ record: DatasetRecord; source: string }> {
  const t = input.trim();
  if (/^cff-version:/m.test(t)) {
    const rec = parseCff(t);
    if (!rec) throw new Error("Couldn't parse that CITATION.cff. Check that it is valid YAML with a title.");
    return { record: rec, source: "Pasted CITATION.cff" };
  }
  const gh = t.match(/github\.com\/([\w.-]+)\/([\w.-]+)/i);
  if (gh) {
    const owner = gh[1], repo = gh[2].replace(/\.git$/, "");
    for (const p of ["CITATION.cff", "citation.cff"]) {
      try {
        const r = await fetch(`https://raw.githubusercontent.com/${owner}/${repo}/HEAD/${p}`);
        if (r.ok) {
          const rec = parseCff(await r.text());
          if (rec) return { record: rec, source: `CITATION.cff · github.com/${owner}/${repo}` };
        }
      } catch {}
    }
    const r = await fetch(`https://api.github.com/repos/${owner}/${repo}`);
    if (r.ok) {
      const j = await r.json();
      return {
        record: {
          ...emptyRecord(),
          title: j.name ?? repo,
          creators: [{ literal: j.owner?.login ?? owner }],
          year: String(j.created_at ?? "").slice(0, 4),
          publisher: "GitHub",
          url: j.html_url ?? `https://github.com/${owner}/${repo}`,
          resourceType: "Software",
          description: j.description ?? "",
        },
        source: "GitHub API — ask the maintainers to add a CITATION.cff for a richer citation",
      };
    }
    if (r.status === 404) throw new Error(`Repository ${owner}/${repo} not found or private. Paste its CITATION.cff instead.`);
  }
  const doi = extractDoi(t);
  if (doi) {
    const { record, source } = await fetchByDoi(doi);
    return { record: { ...record, resourceType: record.resourceType || "Software" }, source };
  }
  throw new Error("Paste a GitHub repo link, a software DOI (e.g. a Zenodo release), or the raw CITATION.cff text.");
}

// ---------- ORCID author pickup ----------
export async function fetchOrcidAuthor(input: string): Promise<Creator> {
  const id = input.trim().replace(/^https?:\/\/orcid\.org\//i, "").replace(/[^0-9Xx]/g, "").toUpperCase();
  if (!/^\d{15}[\dX]$/.test(id)) throw new Error("That doesn't look like an ORCID iD (expected a form like 0000-0002-1825-0097).");
  const r = await fetch(`https://pub.orcid.org/v3.0/${id}/record`, { headers: { Accept: "application/json" } });
  if (!r.ok) throw new Error(`ORCID lookup failed (${r.status}). Check the iD and try again.`);
  const j = await r.json();
  const n = j?.person?.name ?? {};
  const family = n["family-names"] ?? undefined;
  const given = n["given-names"] ?? undefined;
  const credit = j?.person?.["credit-names"]?.[0]?.["credit-name"]?.value ?? undefined;
  return { family, given, literal: family || given ? undefined : credit ?? id, orcid: `https://orcid.org/${id}` };
}

