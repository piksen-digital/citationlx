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
  resourceType: string; // e.g. Dataset
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

export async function fetchByDoi(doi: string): Promise<{ record: DatasetRecord; source: string; rawType: string }> {
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
      return { record: rec, source: "DataCite", rawType: a.types?.resourceTypeGeneral ?? "" };
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
    resourceType: c.type === "dataset" ? "Dataset" : c.type ?? "",
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
      resourceType: type === "dataset" ? "Dataset" : "",
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
      resourceType: type === "DATA" ? "Dataset" : "",
    },
  };
}

// ---------- Validator ----------
export type Issue = { level: "error" | "warn" | "ok"; field: string; message: string; fix?: string };

export function validate(r: DatasetRecord, originalType?: string): Issue[] {
  const out: Issue[] = [];
  const push = (level: Issue["level"], field: string, message: string, fix?: string) =>
    out.push({ level, field, message, fix });

  if (originalType && !/^(dataset|data|misc)$/i.test(originalType) && originalType !== "?")
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
  if (r.resourceType && !/dataset|data/i.test(r.resourceType)) push("warn", "Resource type", `Resource type is "${r.resourceType}", not Dataset.`);
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
};

export const STYLES = ["APA 7", "DataCite", "Chicago", "Harvard", "MLA 9", "Vancouver", "IEEE"] as const;
export type Style = (typeof STYLES)[number];

export function formatCitation(r: DatasetRecord, style: Style): string {
  const cs = r.creators;
  const v = r.version ? ` (Version ${r.version.replace(/^v(ersion)?\s*/i, "")})` : "";
  const id = idLink(r);
  const acc = !r.doi && r.accessed ? fmtDate(r.accessed) : "";
  switch (style) {
    case "APA 7": {
      const a = cs.length > 20 ? [...cs.slice(0, 19).map((c) => nm(c, "apa")), "…", nm(cs.at(-1)!, "apa")].join(", ") : join(cs.map((c) => nm(c, "apa")), "&");
      return `${a || r.publisher} (${r.year || "n.d."}). *${r.title}*${v} [Data set]. ${r.publisher ? r.publisher + ". " : ""}${acc ? `Retrieved ${acc}, from ` : ""}${id}`.trim();
    }
    case "DataCite":
      return `${cs.map((c) => nm(c, "apa")).join("; ")} (${r.year}). ${r.title}${r.version ? ` (Version ${r.version})` : ""} [${r.resourceType || "Dataset"}]. ${r.publisher}. ${id}`;
    case "Chicago": {
      const a = cs.length ? [nm(cs[0], "inverted"), ...cs.slice(1).map((c) => nm(c, "full"))] : [];
      return `${join(a, "and")}. ${r.year}. “${r.title}.” ${r.version ? `Version ${r.version}. ` : ""}${r.publisher}. Dataset. ${acc ? `Accessed ${acc}. ` : ""}${id}.`;
    }
    case "Harvard":
      return `${join(cs.map((c) => nm(c, "apa")), "and")} (${r.year}) *${r.title}*${v ? "," + v.replace(/[()]/g, "") : ""} [Dataset]. ${r.publisher}. ${acc ? `Available at: ${id} (Accessed: ${acc}).` : `Available at: ${id}.`}`;
    case "MLA 9": {
      const a = cs.length === 0 ? "" : cs.length === 1 ? nm(cs[0], "inverted") : cs.length === 2 ? `${nm(cs[0], "inverted")}, and ${nm(cs[1], "full")}` : `${nm(cs[0], "inverted")}, et al`;
      return `${a ? a + ". " : ""}*${r.title}*. ${r.version ? `Version ${r.version}, ` : ""}${r.publisher}, ${r.year}. Dataset, ${id.replace(/^https?:\/\//, "")}.${acc ? ` Accessed ${acc}.` : ""}`;
    }
    case "Vancouver": {
      const a = cs.length > 6 ? cs.slice(0, 6).map((c) => nm(c, "vancouver")).join(", ") + ", et al" : cs.map((c) => nm(c, "vancouver")).join(", ");
      return `${a}. ${r.title} [dataset]. ${r.version ? `Version ${r.version}. ` : ""}${r.publisher}; ${r.year}${acc ? ` [cited ${r.accessed}]` : ""}. Available from: ${id}`;
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
  return `@dataset{${key(r)},\n${f.filter(([, v]) => v).map(([k, v]) => `  ${k} = {${v}}`).join(",\n")}\n}`;
}
export function toBibtex(r: DatasetRecord) {
  const f: [string, string][] = [
    ["author", bibAuthors(r)], ["title", `{${r.title}}`], ["year", r.year], ["publisher", r.publisher],
    ["howpublished", r.publisher], ["version", r.version], ["doi", r.doi], ["url", idLink(r)],
    ["note", `[Data set]${r.version ? `, Version ${r.version}` : ""}${!r.doi && r.accessed ? `. Accessed ${r.accessed}` : ""}`],
  ];
  return `@misc{${key(r)},\n${f.filter(([, v]) => v).map(([k, v]) => `  ${k} = {${v}}`).join(",\n")}\n}`;
}
export function toRis(r: DatasetRecord) {
  const l = ["TY  - DATA", ...r.creators.map((c) => `AU  - ${c.family ? `${c.family}, ${c.given ?? ""}`.replace(/, $/, "") : c.literal}`),
    `TI  - ${r.title}`, `PY  - ${r.year}`, r.publisher && `PB  - ${r.publisher}`, r.publisher && `DP  - ${r.publisher}`,
    r.version && `ET  - ${r.version}`, r.doi && `DO  - ${r.doi}`, `UR  - ${idLink(r)}`, !r.doi && r.accessed && `Y2  - ${r.accessed}`,
    r.license && `C1  - License: ${r.license}`, "ER  - "];
  return l.filter(Boolean).join("\n");
}
export function toCsl(r: DatasetRecord) {
  return {
    id: key(r), type: "dataset", title: r.title,
    author: r.creators.map((c) => (c.family ? { family: c.family, given: c.given } : { literal: c.literal })),
    issued: r.year ? { "date-parts": [[Number(r.year)]] } : undefined,
    publisher: r.publisher, version: r.version || undefined, DOI: r.doi || undefined, URL: idLink(r),
    accessed: !r.doi && r.accessed ? { "date-parts": [r.accessed.split("-").map(Number)] } : undefined,
    genre: "Data set",
  };
}
export function toZoteroExtra(r: DatasetRecord) {
  // Works in any Zotero version (and for "Document" items in older ones).
  return [`Type: dataset`, r.version && `Version: ${r.version}`, r.doi && `DOI: ${r.doi}`, r.publisher && `Publisher: ${r.publisher}`, `Genre: Data set`]
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
