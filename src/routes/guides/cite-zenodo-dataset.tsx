import { createFileRoute } from "@tanstack/react-router";
import { GuidePage, Example, faqSchema, type Faq } from "@/components/GuidePage";

const FAQS: Faq[] = [
  {
    q: "Which DOI should I cite for a Zenodo record?",
    a: "Normally the version DOI: it points to one unchanging version and is what reproducibility guidance recommends. Use the concept DOI only when you deliberately mean the dataset as a whole, across all versions. A version DOI always resolves to exactly the files and metadata you used.",
  },
  {
    q: "Why did Zotero or Mendeley import my Zenodo dataset as a journal article?",
    a: "General-purpose translators in reference managers often fall back to a generic import for repository records, which mis-types the item and drops the version and repository. Paste the broken export into CitationLX's Repair tab: it re-fetches the official Zenodo metadata from DataCite and repairs the record.",
  },
  {
    q: "How do I cite an older version of a Zenodo dataset?",
    a: "Open the record's landing page and expand the Versions panel. Every version has its own DOI. Cite the DOI of the specific version you used; CitationLX detects concept DOIs and offers one-click switching to the version DOIs.",
  },
  {
    q: "Do I need an access date when citing a Zenodo dataset?",
    a: "No. A DOI is persistent, so APA 7, MLA 9 and Chicago do not want an access date for Zenodo records cited by DOI. Access dates are for unstable URLs and data shared without a persistent identifier.",
  },
];

export const Route = createFileRoute("/guides/cite-zenodo-dataset")({
  head: () => ({
    meta: [
      { title: "How to cite a Zenodo dataset (APA 7, MLA 9, Chicago, IEEE) — CitationLX" },
      { name: "description", content: "Worked Zenodo dataset citations in APA 7, MLA 9, Chicago and IEEE, plus the concept DOI vs version DOI rule that most researchers get wrong. Free repair tool included." },
      { property: "og:title", content: "How to cite a Zenodo dataset" },
      { property: "og:description", content: "Worked examples in four styles, plus the concept vs version DOI rule." },
      { property: "og:type", content: "article" },
      { property: "og:url", content: "https://citationlx.online/guides/cite-zenodo-dataset" },
    ],
    links: [{ rel: "canonical", href: "https://citationlx.online/guides/cite-zenodo-dataset" }],
    scripts: [{ type: "application/ld+json", children: JSON.stringify(faqSchema(FAQS)) }],
  }),
  component: CiteZenodoDataset,
});

function CiteZenodoDataset() {
  return (
    <GuidePage
      title="How to cite a Zenodo dataset"
      description="Worked citations for a real Zenodo dataset in APA 7, MLA 9, Chicago and IEEE, the concept-DOI vs version-DOI rule, and the import mistakes reference managers make with Zenodo records."
      updated="November 2026"
      faq={FAQS}
      related={[
        { href: "/guides/cite-dryad-dataset", label: "How to cite a Dryad dataset" },
        { href: "/guides/cite-figshare-dataset", label: "How to cite a figshare dataset" },
        { href: "/guides", label: "All dataset citation guides" },
      ]}
    >
      <section>
        <h2 className="text-2xl">The short answer</h2>
        <p>
          Cite the <b>version DOI</b>, not the concept DOI. Zenodo mints a version DOI for every release of a record and one
          concept DOI that always resolves to the latest version. If your results depend on a specific snapshot of the data,
          the version DOI is the only link that keeps meaning the same bytes after the dataset is updated.
        </p>
      </section>

      <section>
        <h2 className="text-2xl">Worked example</h2>
        <p>
          Take a real record: the DCASE 2020 Challenge Task 2 Development Dataset by Koizumi and colleagues, published on
          Zenodo in 2020, version 1.0, DOI <span className="font-mono text-sm">10.5281/zenodo.3678171</span>, licensed CC BY-NC-SA 4.0.
        </p>
        <Example style="APA 7">
          Koizumi, Y., Kawaguchi, Y., Imoto, K., Nakamura, T., Nikaido, Y., Tanabe, R., Purohit, H., &amp; Suefusa, K. (2020). <i>DCASE 2020 challenge task 2 development dataset</i> (Version 1.0) [Data set]. Zenodo. https://doi.org/10.5281/zenodo.3678171
        </Example>
        <Example style="MLA 9">
          Koizumi, Yuma, et al. "DCASE 2020 Challenge Task 2 Development Dataset." Version 1.0, Zenodo, 2020, doi.org/10.5281/zenodo.3678171.
        </Example>
        <Example style="Chicago (author-date)">
          Koizumi, Yuma, Yohei Kawaguchi, Keisuke Imoto, Toshiki Nakamura, Yuki Nikaido, Ryo Tanabe, Harsh Purohit, and Kaori Suefusa. 2020. "DCASE 2020 Challenge Task 2 Development Dataset." Version 1.0. Zenodo. https://doi.org/10.5281/zenodo.3678171.
        </Example>
        <Example style="IEEE">
          Y. Koizumi et al., "DCASE 2020 Challenge Task 2 Development Dataset," Zenodo, ver. 1.0, 2020. [Online]. Available: https://doi.org/10.5281/zenodo.3678171
        </Example>
        <p className="text-sm text-muted-foreground">
          Note the details that generic citation generators miss: the bracketed [Data set] label in APA, the version in
          parentheses, and Zenodo named as the repository rather than a journal.
        </p>
      </section>

      <section>
        <h2 className="text-2xl">Concept DOI vs version DOI on Zenodo</h2>
        <p>
          For this dataset, <span className="font-mono text-sm">10.5281/zenodo.3678170</span> is the concept DOI and{" "}
          <span className="font-mono text-sm">10.5281/zenodo.3678171</span> is the DOI of version 1.0. If the authors later
          publish version 2.0, the concept DOI will silently start resolving to the new files, while the version DOI keeps
          pointing at exactly what you analysed. Cite the concept DOI only when you mean the evolving dataset as a whole.
        </p>
        <p>
          CitationLX flags this automatically: paste a concept DOI and it offers one-click switching to the version DOIs;
          paste a version DOI and it confirms you are safe, showing the concept DOI for reference.
        </p>
      </section>

      <section>
        <h2 className="text-2xl">Common mistakes with Zenodo citations</h2>
        <ul className="list-disc space-y-2 pl-5">
          <li>The record imports as "Journal Article" or "Report" in Zotero, Mendeley or EndNote, so it renders like a paper.</li>
          <li>The version is dropped, so readers cannot tell which release you used.</li>
          <li>Zenodo is recorded as a journal name instead of the repository/publisher.</li>
          <li>The paper describing the dataset is cited instead of the dataset itself. Both can be cited, but they are separate references.</li>
          <li>An old <span className="font-mono text-sm">dx.doi.org</span> or <span className="font-mono text-sm">doi:</span> link is used instead of the current https://doi.org form.</li>
        </ul>
      </section>
    </GuidePage>
  );
}
