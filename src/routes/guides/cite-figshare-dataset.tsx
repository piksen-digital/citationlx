import { createFileRoute } from "@tanstack/react-router";
import { GuidePage, Example, faqSchema, type Faq } from "@/components/GuidePage";

const FAQS: Faq[] = [
  {
    q: "What does the .v1 suffix in a figshare DOI mean?",
    a: "Figshare mints a versioned DOI for each release, like 10.6084/m9.figshare.14439242.v1, and reserves the bare DOI (without .v1) for the dataset across all versions. Cite the .v1 DOI when your results depend on the exact files you downloaded.",
  },
  {
    q: "Should I cite figshare or the institution hosting the item?",
    a: "Figshare is both the platform and the registered publisher for most records, so name figshare as the repository in the citation. Institutional figshare portals list the host in the record; keep figshare as the publisher unless the record states otherwise.",
  },
  {
    q: "How do I cite a figshare item that is a figure or a poster, not a dataset?",
    a: "The bracketed label should match what the item is: [Figure], [Poster], [Software] and so on. CitationLX focuses on datasets; for other item types, check the resource type shown on the figshare page and adjust the label.",
  },
];

export const Route = createFileRoute("/guides/cite-figshare-dataset")({
  head: () => ({
    meta: [
      { title: "How to cite a figshare dataset (APA 7, MLA 9, Chicago, IEEE) — CitationLX" },
      { name: "description", content: "Worked figshare dataset citations in APA 7, MLA 9, Chicago and IEEE, plus what the .v1 suffix in figshare DOIs means and which DOI to cite." },
      { property: "og:title", content: "How to cite a figshare dataset" },
      { property: "og:description", content: "Worked examples in four styles, plus the .v1 version-DOI rule." },
      { property: "og:type", content: "article" },
      { property: "og:url", content: "https://citationlx.online/guides/cite-figshare-dataset" },
    ],
    links: [{ rel: "canonical", href: "https://citationlx.online/guides/cite-figshare-dataset" }],
    scripts: [{ type: "application/ld+json", children: JSON.stringify(faqSchema(FAQS)) }],
  }),
  component: CiteFigshareDataset,
});

function CiteFigshareDataset() {
  return (
    <GuidePage
      title="How to cite a figshare dataset"
      description="Worked citations for a real figshare dataset in APA 7, MLA 9, Chicago and IEEE, what the .v1 suffix in figshare DOIs means, and the mistakes reference managers make with figshare records."
      updated="November 2026"
      faq={FAQS}
      related={[
        { href: "/guides/cite-zenodo-dataset", label: "How to cite a Zenodo dataset" },
        { href: "/guides/cite-dryad-dataset", label: "How to cite a Dryad dataset" },
        { href: "/guides", label: "All dataset citation guides" },
      ]}
    >
      <section>
        <h2 className="text-2xl">The short answer</h2>
        <p>
          Cite the <b>version DOI with its .v1 suffix</b>. Figshare reserves the bare DOI for the item across all versions,
          so a citation without .v1 can silently start pointing at newer files. Name <b>figshare</b> as the repository.
        </p>
      </section>

      <section>
        <h2 className="text-2xl">Worked example</h2>
        <p>
          Take a real record: "Ecopath with Ecosim (EwE) adjacency matrices" by Giacomuzzo and Jordán, published on figshare
          in 2021, version 1, DOI <span className="font-mono text-sm">10.6084/m9.figshare.14439242.v1</span>, licensed CC BY 4.0.
        </p>
        <Example style="APA 7">
          Giacomuzzo, E., &amp; Jordán, F. (2021). <i>Ecopath with Ecosim (EwE) adjacency matrices</i> (Version 1) [Data set]. figshare. https://doi.org/10.6084/m9.figshare.14439242.v1
        </Example>
        <Example style="MLA 9">
          Giacomuzzo, Emanuele, and Ferenc Jordán. "Ecopath With Ecosim (EwE) Adjacency Matrices." Version 1, figshare, 2021, doi.org/10.6084/m9.figshare.14439242.v1.
        </Example>
        <Example style="Chicago (author-date)">
          Giacomuzzo, Emanuele, and Ferenc Jordán. 2021. "Ecopath With Ecosim (EwE) Adjacency Matrices." Version 1. figshare. https://doi.org/10.6084/m9.figshare.14439242.v1.
        </Example>
        <Example style="IEEE">
          E. Giacomuzzo and F. Jordán, "Ecopath with Ecosim (EwE) adjacency matrices," figshare, ver. 1, 2021. [Online]. Available: https://doi.org/10.6084/m9.figshare.14439242.v1
        </Example>
      </section>

      <section>
        <h2 className="text-2xl">The .v1 suffix, and why it matters</h2>
        <p>
          A figshare DOI without a version suffix behaves like a concept DOI elsewhere: it always resolves to the latest
          version of the item. When you analyse a specific download, cite the suffixed DOI you actually used. If the dataset
          is later updated, your citation still describes the exact data behind your results.
        </p>
      </section>

      <section>
        <h2 className="text-2xl">Common mistakes with figshare citations</h2>
        <ul className="list-disc space-y-2 pl-5">
          <li>The bare DOI is cited, so the citation is not pinned to the version that was analysed.</li>
          <li>Figshare items imported into reference managers arrive as @misc with the repository missing.</li>
          <li>Figshare hosts many item types (figures, posters, software); the [Data set] label is applied to things that are not datasets.</li>
          <li>The licence (CC BY, CC0 and so on) is omitted where the journal asks for it in the data availability statement.</li>
        </ul>
      </section>
    </GuidePage>
  );
}
