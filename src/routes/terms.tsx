import { createFileRoute } from "@tanstack/react-router";
import { track } from "@/lib/analytics";
import { ThemeToggle } from "@/components/ThemeToggle";

const UPDATED = "12 November 2026";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms and Conditions | CitationLX" },
      {
        name: "description",
        content:
          "Read the terms governing access to and use of the CitationLX dataset citation repair tool.",
      },
      { property: "og:title", content: "Terms and Conditions | CitationLX" },
      {
        property: "og:description",
        content: "Terms for using CitationLX.",
      },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "https://citationlx.online/terms" }],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-3xl items-center justify-between px-6 py-6">
        <a href="/" className="flex items-baseline gap-2">
          <span className="font-serif text-2xl italic">CitationLX</span>
          <span className="eyebrow">dataset citation repair</span>
        </a>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <a href="/" className="btn-ghost" onClick={() => track("legal_page_cta", { page: "terms", action: "open_tool" })}>
            Open the tool
          </a>
        </div>
      </header>

      <article className="mx-auto max-w-3xl px-6 pb-16 pt-8">
        <p className="eyebrow">Legal · Updated {UPDATED}</p>
        <h1 className="mt-3 text-4xl leading-[1.1] md:text-5xl">Terms and Conditions</h1>
        <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
          These terms apply when you access or use CitationLX. Please read them
          before using the citation-repair tool.
        </p>

        <div className="mt-8 rounded-xl border border-border bg-card p-6 shadow-sm">
          <p className="eyebrow mb-2">Important</p>
          <p className="text-sm leading-relaxed">
            CitationLX is an assistance tool, not an authoritative citation
            certification service. You are responsible for checking the source record,
            citation rules, and final reference before relying on or submitting it.
          </p>
        </div>

        <div className="mt-10 space-y-10 text-[15px] leading-relaxed">
          <section>
            <h2 className="text-2xl">1. Operator and acceptance</h2>
            <p className="mt-3">
              CitationLX is an independently operated digital product created and
              maintained by <strong>George Chapungu</strong>, with <strong>Piksen Digital</strong>
              as its associated brand. In these terms, “CitationLX,” “we,” or “us”
              refers to the operator of the CitationLX product.
            </p>
            <p className="mt-3">
              By accessing or using CitationLX, you agree to these terms. If you do not
              agree, do not use the service. If you use CitationLX on behalf of an
              institution or organisation, you confirm that you are authorised to do
              so and that your use complies with these terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl">2. What CitationLX provides</h2>
            <p className="mt-3">
              CitationLX is a browser-based tool designed to help users inspect,
              repair, format, and export scholarly dataset and software citations. Its
              functions may include retrieving DOI and repository metadata, checking
              record types and versions, identifying possible metadata issues,
              formatting references in supported citation styles, processing batches,
              and exporting citation data.
            </p>
            <p className="mt-3">
              Features, supported providers, formats, citation styles, and limits may
              change over time. We may add, modify, suspend, or discontinue features
              where reasonably necessary to maintain or improve the service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl">3. Permitted use</h2>
            <p className="mt-3">
              You may use CitationLX for lawful personal, educational, academic,
              research, and professional purposes. You agree not to:
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-6">
              <li>use the service in violation of applicable law or another person's rights;</li>
              <li>attempt to disrupt, overload, reverse engineer, or compromise the service or its infrastructure, except where applicable law permits activities that cannot lawfully be restricted;</li>
              <li>use automated requests in a way that unreasonably burdens CitationLX or its third-party data providers;</li>
              <li>introduce malware, malicious code, or harmful content; or</li>
              <li>misrepresent a CitationLX result as official verification or endorsement by a registry, publisher, repository, or citation-style organisation.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl">4. Accuracy and your responsibility to verify</h2>
            <p className="mt-3">
              CitationLX retrieves and processes metadata supplied by third parties
              and applies automated rules to identify and repair possible citation
              problems. Source records may be incomplete, outdated, inconsistent,
              incorrectly deposited, unavailable, or changed after a request. Automated
              parsing, matching, formatting, and validation can also produce errors.
            </p>
            <p className="mt-3">
              A health score, warning, validation result, formatted reference, or
              suggested correction is an aid to review. It is not a guarantee that a
              citation is complete, correct, compliant with a particular institution's
              rules, or suitable for every publication or submission.
            </p>
            <p className="mt-3">
              You are responsible for checking important details against the original
              source and the applicable publisher, repository, institutional, or style
              requirements. This includes author names, titles, publication dates,
              versions, identifiers, repository or publisher names, access dates, and
              retraction or correction notices.
            </p>
          </section>

          <section>
            <h2 className="text-2xl">5. No professional or institutional advice</h2>
            <p className="mt-3">
              CitationLX is provided as a general-purpose software tool. It does not
              provide legal, publishing, research-integrity, library, or academic
              advice, and it does not replace guidance from a librarian, supervisor,
              publisher, institution, or other qualified professional. You remain
              responsible for deciding whether and how to use any result.
            </p>
          </section>

          <section>
            <h2 className="text-2xl">6. Your content and generated outputs</h2>
            <p className="mt-3">
              You retain any rights you hold in the citation records, text, identifiers,
              and other material you provide. You are responsible for ensuring that
              you have the rights and permissions needed to use that material with the
              service and any external provider contacted by a feature.
            </p>
            <p className="mt-3">
              Subject to third-party rights and applicable law, you may use, copy,
              edit, and export citation outputs for your own lawful purposes. Citation
              metadata may be factual information that is not owned by CitationLX.
              CitationLX does not claim ownership of your source records or the
              underlying metadata supplied by external registries.
            </p>
          </section>

          <section>
            <h2 className="text-2xl">7. Third-party services and data</h2>
            <p className="mt-3">
              CitationLX may rely on services and information from DataCite, Crossref,
              doi.org, ORCID, GitHub, Google, and other third parties. Those services
              are not controlled by CitationLX. Their availability, data quality,
              terms, privacy practices, and response times are their own responsibility.
            </p>
            <p className="mt-3">
              Your use of a third-party service may also be subject to that provider's
              terms and policies. CitationLX is not responsible for errors, outages,
              changes, omissions, or actions by third-party providers.
            </p>
          </section>

          <section>
            <h2 className="text-2xl">8. Browser processing, storage, and shared links</h2>
            <p className="mt-3">
              CitationLX is designed to process submitted citation material in your
              browser rather than through a central CitationLX account database.
              However, features that retrieve external metadata send relevant
              identifiers or URLs to the applicable provider. The website also uses
              analytics and browser technologies as described in the{" "}
              <a className="underline underline-offset-2" href="/privacy">Privacy Policy</a>.
            </p>
            <p className="mt-3">
              If you create a share link, information encoded in that link may be
              visible to anyone who obtains it. You are responsible for deciding
              whether the information is appropriate to share and for distributing
              the link safely.
            </p>
          </section>

          <section>
            <h2 className="text-2xl">9. Intellectual property</h2>
            <p className="mt-3">
              The CitationLX name, branding, website design, software, and original
              content are owned by or licensed to the operator, except for third-party
              materials and open-source components, which remain subject to their
              respective rights and licences. These terms do not transfer ownership
              of those materials to you.
            </p>
            <p className="mt-3">
              You may not copy, redistribute, sell, or create a competing derivative
              of protected CitationLX materials except as permitted by law or by an
              applicable licence or written permission. Nothing in this section limits
              rights that cannot lawfully be restricted.
            </p>
          </section>

          <section>
            <h2 className="text-2xl">10. Availability and changes</h2>
            <p className="mt-3">
              We aim to keep CitationLX useful and accessible, but uninterrupted or
              error-free operation is not guaranteed. Access may be unavailable or
              limited because of maintenance, technical issues, security concerns,
              network conditions, browser compatibility, or third-party outages.
            </p>
            <p className="mt-3">
              We may update these terms when the service or applicable requirements
              change. The updated date at the top of this page indicates the latest
              version. Material changes will be reflected by publishing the revised
              terms on this page.
            </p>
          </section>

          <section>
            <h2 className="text-2xl">11. Disclaimers</h2>
            <p className="mt-3">
              To the maximum extent permitted by applicable law, CitationLX is
              provided “as is” and “as available,” without warranties or conditions
              of any kind, whether express, implied, or statutory. We do not warrant
              that the service will be uninterrupted, secure, error-free, compatible
              with every device, or that its results will meet your requirements.
            </p>
            <p className="mt-3">
              Nothing in these terms excludes a warranty, right, or remedy that cannot
              legally be excluded or limited in your jurisdiction.
            </p>
          </section>

          <section>
            <h2 className="text-2xl">12. Limitation of liability</h2>
            <p className="mt-3">
              To the maximum extent permitted by applicable law, the operator will
              not be liable for indirect, incidental, special, consequential, or
              punitive loss, or for loss of data, research time, profits, revenue,
              goodwill, or academic or professional opportunity arising from or
              connected with use of, or inability to use, CitationLX.
            </p>
            <p className="mt-3">
              To the maximum extent permitted by applicable law, the operator's
              aggregate liability for claims arising from the service or these terms
              will be limited to the amount you paid directly to CitationLX for the
              service during the 12 months before the event giving rise to the claim.
              CitationLX is currently offered without a usage fee, so this amount may
              be zero. This limitation does not apply where liability cannot lawfully
              be limited, including liability that applicable law requires to remain
              available.
            </p>
          </section>

          <section>
            <h2 className="text-2xl">13. Indemnity</h2>
            <p className="mt-3">
              To the extent permitted by applicable law, you agree to be responsible
              for claims and costs arising from your unlawful use of CitationLX, your
              violation of these terms, or your infringement of another person's
              rights. This section does not require you to indemnify the operator for
              the operator's own unlawful conduct or for liability that cannot
              lawfully be transferred to you.
            </p>
          </section>

          <section>
            <h2 className="text-2xl">14. Suspension or discontinuation</h2>
            <p className="mt-3">
              We may restrict or suspend access where reasonably necessary to protect
              the service, users, third-party providers, or the public, or where use
              appears to violate these terms or applicable law. We may also
              discontinue CitationLX or any feature. Where reasonably practicable, we
              will take proportionate steps and provide notice when appropriate.
            </p>
          </section>

          <section>
            <h2 className="text-2xl">15. Governing law and mandatory rights</h2>
            <p className="mt-3">
              These terms are intended to operate subject to the laws that apply to
              the operator and the user. Any governing-law or dispute-resolution
              provision must be interpreted in a way that preserves mandatory
              consumer, privacy, and other protections that apply in the user's
              jurisdiction. Nothing in these terms removes rights that cannot
              legally be waived.
            </p>
            <p className="mt-3">
              This section is deliberately not selecting a country or court. The
              operator's legal residence and the intended principal market should be
              confirmed before a specific governing-law and venue clause is added.
            </p>
          </section>

          <section>
            <h2 className="text-2xl">16. Contact</h2>
            <p className="mt-3">
              Questions about these terms can be sent to{" "}
              <a className="underline underline-offset-2" href="mailto:cantrell22@hotmail.com">
                Contact
              </a>.
            </p>
          </section>
        </div>

        <div className="mt-12 flex flex-wrap gap-4 border-t border-border pt-6 text-sm">
          <a className="underline underline-offset-2" href="/privacy" onClick={() => track("legal_page_cta", { page: "terms", action: "privacy" })}>Privacy Policy</a>
          <a className="underline underline-offset-2" href="/" onClick={() => track("legal_page_cta", { page: "terms", action: "home" })}>Back to CitationLX</a>
        </div>
      </article>

      <footer className="border-t py-8 text-center text-xs text-muted-foreground">
        <p>© {new Date().getFullYear()} CitationLX</p>
        <p className="mt-2">
          <a className="underline underline-offset-2" href="/privacy">Privacy Policy</a>
        </p>
      </footer>
    </div>
  );
}
