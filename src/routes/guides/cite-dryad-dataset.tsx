import { createFileRoute } from "@tanstack/react-router";
import { GuidePage, Example, faqSchema, type Faq } from "@/components/GuidePage";

const FAQS: Faq[] = [
  {
    q: "Does Dryad use separate concept and version DOIs like Zenodo?",
    a: "No. Dryad mints one DOI per dataset and keeps a version history behind it; the DOI shown on the dataset page is the one to cite. If you need to reference the exact state of the data, mention the version date or number in your methods section.",
  },
  {
    q: "How do I cite Dryad data in APA 7?",
    a: "Author(s). (Year). Title in italics [Data set]. Dryad. https://doi.org/... Include the version if the record displays one, and add the licence if your journal requires it.",
  },
  {
    q: "Why does my reference manager type my Dryad import as @misc or a report?",
    a: "Dryad records arrive through generic importers that do not map the Dataset resource type cleanly. Paste the export into CitationLX's Repair tab and it restores the dataset type, creators, version and repository from the official registry.",
  },
];

export const Route = createFileRoute("/guides/cite-dryad-dataset")({
  head: () => ({
    meta: [
      { title: "How to cite a Dryad dataset (APA 7, MLA 9, Chicago, IEEE) — CitationLX" },
      { name: "description", content: "Worked Dryad dataset citations in APA 7, MLA 9, Chicago and IEEE, using a real CC0 Dryad record. Includes how Dryad versions data and the mistakes to avoid." },
      { property: "og:title", content: "How to cite a Dryad dataset" },
      { property: "og:description", content: "Worked examples in four styles for Dryad's CC0 datasets." },
      { property: "og:type", content: "article" },
      { property: "og:url", content: "https://citationlx.online/guides/cite-dryad-dataset" },
    ],
    links: [{ rel: "canonical", href: "https://citationlx.online/guides/cite-dryad-dataset" }],
    scripts: [{ type: "application/ld+json", children: JSON.stringify(faqSchema(FAQS)) }],
  }),
  component: CiteDryadDataset,
});

function CiteDryadDataset() {
  return (
    <GuidePage
      title="How to cite a Dryad dataset"
      description="Worked citations for a real Dryad dataset in APA 7, MLA 9, Chicago and IEEE, how Dryad handles versioning, and the import mistakes reference managers make with Dryad records."
      updated="November 2026"
      faq={FAQS}
      related={[
        { href: "/guides/cite-zenodo-dataset", label: "How to cite a Zenodo dataset" },
        { href: "/guides/cite-figshare-dataset", label: "How to cite a figshare dataset" },
        { href: "/guides", label: "All dataset citation guides" },
      ]}
    >
      <section>
        <h2 className="text-2xl">The short answer</h2>
        <p>
          Cite the DOI shown on the Dryad dataset page, name <b>Dryad</b> as the repository (the publisher slot in a data
          citation), and include the version if the record displays one. Most Dryad datasets are released under CC0, so no
          permission statement is needed, but the citation itself still must be complete.
        </p>
      </section>

      <section>
        <h2 className="text-2xl">Worked example</h2>
        <p>
          Take a real record: "Expectation-Maximization enables phylogenetic dating under a Categorical Rate Model" by Mai,
          Charvel and Mirarab, published on Dryad in 2022, DOI{" "}
          <span className="font-mono text-sm">10.5061/dryad.pk0p2ngs0</span>, released under CC0.
        </p>
        <Example style="APA 7">
          Mai, U., Charvel, E., &amp; Mirarab, S. (2022). <i>Expectation-maximization enables phylogenetic dating under a categorical rate model</i> [Data set]. Dryad. https://doi.org/10.5061/dryad.pk0p2ngs0
        </Example>
        <Example style="MLA 9">
          Mai, Uyen, Eduardo Charvel, and Siavash Mirarab. "Expectation-Maximization Enables Phylogenetic Dating Under a Categorical Rate Model." Dryad, 2022, doi.org/10.5061/dryad.pk0p2ngs0.
        </Example>
        <Example style="Chicago (author-date)">
          Mai, Uyen, Eduardo Charvel, and Siavash Mirarab. 2022. "Expectation-Maximization Enables Phylogenetic Dating Under a Categorical Rate Model." Dryad. https://doi.org/10.5061/dryad.pk0p2ngs0.
        </Example>
        <Example style="IEEE">
          U. Mai, E. Charvel, and S. Mirarab, "Expectation-Maximization enables phylogenetic dating under a Categorical Rate Model," Dryad, 2022. [Online]. Available: https://doi.org/10.5061/dryad.pk0p2ngs0
        </Example>
        <p className="text-sm text-muted-foreground">
          Many Dryad records are companions to a journal article. The article and the dataset are two separate references:
          cite the dataset wherever your journal requires data citation, and the paper in the normal way.
        </p>
      </section>

      <section>
        <h2 className="text-2xl">How Dryad handles versions</h2>
        <p>
          Unlike Zenodo, Dryad does not mint a separate public DOI per version. The dataset DOI is stable while Dryad keeps
          an internal version history. That makes the citation simpler, but it also means you should note in your methods
          which version or download date you used, so your results can be traced if the dataset is ever updated.
        </p>
      </section>

      <section>
        <h2 className="text-2xl">Common mistakes with Dryad citations</h2>
        <ul className="list-disc space-y-2 pl-5">
          <li>The import lands as @misc or a report, so styles like APA cannot add the [Data set] label.</li>
          <li>Dryad is recorded as a journal or left out entirely, even though the repository is a required element.</li>
          <li>Author names arrive ALL CAPS from the repository export and never get fixed.</li>
          <li>The companion paper is cited instead of the dataset, or vice versa, without the other reference.</li>
        </ul>
      </section>
    </GuidePage>
  );
}
