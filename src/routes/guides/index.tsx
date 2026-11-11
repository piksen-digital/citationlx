import { createFileRoute } from "@tanstack/react-router";
import { GuidePage, faqSchema, type Faq } from "@/components/GuidePage";

const FAQS: Faq[] = [
  {
    q: "How is citing a dataset different from citing a paper?",
    a: "A dataset is a living, versioned research object. On top of the usual authors, year and title, a good data citation names the repository that hosts the data, the specific version you used, and its persistent identifier (usually a DOI). These conventions come from DataCite and the FORCE11 data citation principles.",
  },
  {
    q: "What is the difference between a concept DOI and a version DOI?",
    a: "Repositories like Zenodo mint two kinds of DOI. A version DOI points to one unchanging version of the data; a concept DOI represents the dataset across all versions and always resolves to the latest one. For reproducibility you should normally cite the version DOI you actually used.",
  },
  {
    q: "What should a complete dataset citation include?",
    a: "Creator(s), publication year, dataset title, version (if any), the repository or publisher, and the DOI or other persistent identifier. APA 7 additionally wants a bracketed [Data set] label after the title.",
  },
  {
    q: "Do all datasets have a DOI?",
    a: "No. Data shared via a lab website, supplementary material or a repository without DOIs may only have a URL or an accession number. In that case include the identifier you have and an accessed date. CitationLX has a dedicated \"No DOI\" mode for exactly this situation.",
  },
];

const GUIDES = [
  {
    href: "/guides/cite-zenodo-dataset",
    title: "How to cite a Zenodo dataset",
    body: "Worked examples in APA 7, MLA 9, Chicago and IEEE, plus how Zenodo's concept and version DOIs work and which one to cite.",
  },
  {
    href: "/guides/cite-dryad-dataset",
    title: "How to cite a Dryad dataset",
    body: "Real examples for Dryad's CC0 datasets in the four major styles, and how Dryad handles versions.",
  },
  {
    href: "/guides/cite-figshare-dataset",
    title: "How to cite a figshare dataset",
    body: "Why figshare version DOIs end in .v1, and worked citations in APA 7, MLA 9, Chicago and IEEE.",
  },
];

export const Route = createFileRoute("/guides/")({
  head: () => ({
    meta: [
      { title: "Dataset citation guides — CitationLX" },
      { name: "description", content: "Repository-by-repository guides to citing research data correctly: Zenodo, Dryad, figshare and more. Worked examples in APA 7, MLA 9, Chicago and IEEE, with version-DOI guidance." },
      { property: "og:title", content: "Dataset citation guides — CitationLX" },
      { property: "og:description", content: "How to cite datasets from Zenodo, Dryad, figshare and other repositories, in every major style." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://citationlx.online/guides" },
    ],
    links: [{ rel: "canonical", href: "https://citationlx.online/guides" }],
    scripts: [{ type: "application/ld+json", children: JSON.stringify(faqSchema(FAQS)) }],
  }),
  component: GuidesIndex,
});

function GuidesIndex() {
  return (
    <GuidePage
      title="How to cite a dataset, repository by repository"
      description="Every major repository handles identifiers and versions differently, and reference managers get most of them wrong. These guides show worked citations for real datasets, the version-DOI rules for each repository, and the mistakes to avoid."
      updated="November 2026"
      faq={FAQS}
      related={[]}
    >
      <section>
        <h2 className="text-2xl">The guides</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {GUIDES.map((g) => (
            <a key={g.href} href={g.href} className="panel block p-5 transition hover:shadow-md">
              <h3 className="text-lg leading-snug">{g.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{g.body}</p>
            </a>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-2xl">What makes a dataset citation different</h2>
        <p>
          A dataset is not a fixed text but a living, versionable research object. Beyond the usual authors, year and title,
          a correct data citation carries three extra things: the <b>repository</b> that hosts the data (which is the
          publisher in a data citation), the <b>version</b> you actually used, and a <b>persistent identifier</b>, usually
          a DOI registered with DataCite. APA 7 also wants a bracketed <b>[Data set]</b> label after the title.
        </p>
        <p>
          Reference managers were built for journal articles and books, so they routinely mis-type datasets as journal
          articles, drop the version, or bury the repository in a notes field. If a citation looks off, paste it into
          CitationLX: it re-fetches the authoritative registry record, shows you exactly what was wrong, and produces a
          repaired citation plus clean BibTeX, RIS and CSL JSON exports.
        </p>
      </section>
    </GuidePage>
  );
}
