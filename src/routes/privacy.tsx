import { createFileRoute } from "@tanstack/react-router";
import { track } from "@/lib/analytics";
import { ThemeToggle } from "@/components/ThemeToggle";

const UPDATED = "12 November 2026";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy | CitationLX" },
      {
        name: "description",
        content:
          "Learn what information CitationLX processes, how browser-based citation repair works, and how analytics and public metadata services are used.",
      },
      { property: "og:title", content: "Privacy Policy | CitationLX" },
      {
        property: "og:description",
        content: "How CitationLX handles information and protects your privacy.",
      },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "https://citationlx.online/privacy" }],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-3xl items-center justify-between px-6 py-6">
        <a href="/" className="flex items-baseline gap-2">
          <span className="font-serif text-2xl italic">CitationLX</span>
          <span className="eyebrow">dataset citation repair</span>
        </a>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <a href="/" className="btn-ghost" onClick={() => track("legal_page_cta", { page: "privacy", action: "open_tool" })}>
            Open the tool
          </a>
        </div>
      </header>

      <article className="mx-auto max-w-3xl px-6 pb-16 pt-8">
        <p className="eyebrow">Legal · Updated {UPDATED}</p>
        <h1 className="mt-3 text-4xl leading-[1.1] md:text-5xl">Privacy Policy</h1>
        <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
          This policy explains how CitationLX handles information when you visit or use
          the CitationLX website and citation-repair tool.
        </p>

        <div className="mt-8 rounded-xl border border-border bg-card p-6 shadow-sm">
          <p className="eyebrow mb-2">In brief</p>
          <p className="text-sm leading-relaxed">
            CitationLX is designed to process citation records in your browser rather
            than through a CitationLX account or central citation database. However,
            the website uses Google Analytics, loads web fonts from Google, and makes
            requests to external scholarly metadata services when you use relevant
            features. Those services receive the information needed to fulfil each
            request, along with ordinary connection data such as your IP address.
          </p>
        </div>

        <div className="mt-10 space-y-10 text-[15px] leading-relaxed">
          <section>
            <h2 className="text-2xl">1. Who operates CitationLX</h2>
            <p className="mt-3">
              CitationLX is an independently operated digital product created and
              maintained by <strong>George Chapungu</strong>. <strong>Piksen Digital</strong>
              is the associated brand. References in this policy to “CitationLX,”
              “we,” or “us” mean the operator of the CitationLX product.
            </p>
            <p className="mt-3">
              Privacy enquiries can be sent to{" "}
              <a className="underline underline-offset-2" href="mailto:cantrell22@hotmail.com">
                cantrell22@hotmail.com
              </a>.
            </p>
          </section>

          <section>
            <h2 className="text-2xl">2. Information you enter into CitationLX</h2>
            <p className="mt-3">
              CitationLX is a browser-based tool. Citation text and files that you paste
              or import for repair are processed by the application in your browser.
              CitationLX does not require you to create an account, and the product is
              not designed to maintain a central account profile or citation library.
            </p>
            <p className="mt-3">
              When a feature needs external metadata, the browser sends a request to the
              relevant provider. Depending on the feature, that request may contain a
              DOI, ORCID iD, repository URL, GitHub repository identifier, or other
              identifier you supplied. The external provider receives that request and
              may process it under its own privacy terms.
            </p>
            <p className="mt-3">
              Avoid entering confidential, unpublished, personal, or otherwise
              sensitive material unless you are comfortable with the processing
              described here and by the relevant external provider.
            </p>
          </section>

          <section>
            <h2 className="text-2xl">3. Analytics and usage information</h2>
            <p className="mt-3">
              The website currently uses Google Analytics 4 to understand general
              website usage and improve the service. The analytics integration is
              loaded by the website and records events such as tool interactions,
              feature use, and navigation actions. Event parameters may include
              identifiers or feature details supplied by the application, for example
              a DOI associated with a DOI-fetch event.
            </p>
            <p className="mt-3">
              Google Analytics may process information such as online identifiers,
              device and browser information, pages or screens viewed, approximate
              location derived from network information, interaction events, and IP
              address information as described in Google's documentation and terms.
              Google may use cookies or similar technologies in providing its
              analytics service.
            </p>
            <p className="mt-3">
              <strong>Important:</strong> the current website implementation loads
              Google Analytics without an in-product consent banner or preference
              control. If your location requires prior consent for non-essential
              analytics technologies, the implementation should be updated to obtain
              that consent before loading analytics. You can also use your browser
              settings and Google's available opt-out controls.
            </p>
            <p className="mt-3">
              Learn more in{" "}
              <a className="underline underline-offset-2" href="https://policies.google.com/privacy" target="_blank" rel="noreferrer">
                Google's Privacy Policy
              </a>{" "}
              and{" "}
              <a className="underline underline-offset-2" href="https://support.google.com/analytics/answer/6004245" target="_blank" rel="noreferrer">
                Google's information about Google Analytics
              </a>.
            </p>
          </section>

          <section>
            <h2 className="text-2xl">4. External metadata and technology providers</h2>
            <p className="mt-3">
              To retrieve, compare, or format scholarly records, CitationLX may make
              direct requests from your browser to services including:
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-6">
              <li>
                <a className="underline underline-offset-2" href="https://datacite.org/" target="_blank" rel="noreferrer">DataCite</a>,
                for DOI metadata and citation formatting;
              </li>
              <li>
                <a className="underline underline-offset-2" href="https://www.crossref.org/" target="_blank" rel="noreferrer">Crossref</a>
                and <a className="underline underline-offset-2" href="https://doi.org/" target="_blank" rel="noreferrer">doi.org</a>,
                for DOI records and related metadata;
              </li>
              <li>
                <a className="underline underline-offset-2" href="https://orcid.org/" target="_blank" rel="noreferrer">ORCID</a>,
                for public researcher profile information when you use an ORCID feature;
              </li>
              <li>
                <a className="underline underline-offset-2" href="https://github.com/" target="_blank" rel="noreferrer">GitHub</a>,
                for public repository and software citation information when you use
                the software feature; and
              </li>
              <li>
                Google services for website analytics and web fonts.
              </li>
            </ul>
            <p className="mt-3">
              These providers operate independently and have their own privacy
              policies, security practices, and retention periods. CitationLX does not
              control how they use information they receive. A provider may receive
              your IP address, browser information, and the identifier or URL included
              in the request.
            </p>
          </section>

          <section>
            <h2 className="text-2xl">5. Browser storage, preferences, and shared links</h2>
            <p className="mt-3">
              CitationLX uses browser storage for limited functions such as remembering
              your display theme. The application also registers a service worker that
              may cache application resources to support loading and offline use.
              These technologies store information on your device; they are separate
              from a server-side CitationLX account.
            </p>
            <p className="mt-3">
              If you use a share-link feature, citation information may be encoded in
              the link itself. Anyone who obtains that link may be able to view the
              information encoded in it. Do not create or distribute a share link
              containing information you want to keep private.
            </p>
            <p className="mt-3">
              You can clear browser storage and cached website data through your
              browser settings. Doing so may reset preferences or remove locally
              available application resources.
            </p>
          </section>

          <section>
            <h2 className="text-2xl">6. How long information is kept</h2>
            <p className="mt-3">
              CitationLX is not designed to store your submitted citation records in a
              central user account or permanent citation database. Information may
              remain temporarily in your browser while you use the tool, in browser
              storage or caches, or in a share link you create. Google Analytics and
              external providers may retain data they collect according to their own
              retention settings and policies.
            </p>
          </section>

          <section>
            <h2 className="text-2xl">7. Security</h2>
            <p className="mt-3">
              We use reasonable measures appropriate to a small browser-based service,
              but no website, browser, network transmission, or storage method can be
              guaranteed to be completely secure. Keep your browser and device
              up-to-date, and avoid using the tool to process information that requires
              a level of confidentiality the service has not expressly undertaken to
              provide.
            </p>
          </section>

          <section>
            <h2 className="text-2xl">8. International processing</h2>
            <p className="mt-3">
              CitationLX and the external providers it uses may be accessed from, or
              process connection and service data in, countries other than the country
              where you are located. Those countries may have different data-protection
              laws. The relevant external provider's policy explains its own
              international processing arrangements.
            </p>
          </section>

          <section>
            <h2 className="text-2xl">9. Your privacy choices and rights</h2>
            <p className="mt-3">
              Depending on where you live, you may have rights to request access to,
              correction of, deletion of, or information about personal data, or to
              object to or restrict certain processing. You may also have rights
              relating to analytics cookies and similar technologies.
            </p>
            <p className="mt-3">
              To make a privacy enquiry, contact us at the email address in Section 1.
              Please do not include passwords, identity documents, or sensitive
              personal information in your initial message. Requests relating to data
              held by Google, DataCite, Crossref, ORCID, GitHub, or another provider
              may need to be made directly to that provider.
            </p>
          </section>

          <section>
            <h2 className="text-2xl">10. Children's privacy</h2>
            <p className="mt-3">
              CitationLX is intended for researchers, students, educators, and other
              people working with scholarly references. It is not directed to children
              under the age at which they may independently consent to online data
              processing under applicable law. We do not knowingly seek to collect
              children's personal information.
            </p>
          </section>

          <section>
            <h2 className="text-2xl">11. Changes to this policy</h2>
            <p className="mt-3">
              This policy may be updated as CitationLX changes or as legal and
              operational requirements evolve. The updated date at the top of this
              page indicates when the latest version was published. Continued use of
              the service after an update means you have had an opportunity to review
              the revised policy; it does not remove any rights that apply to you by
              law.
            </p>
          </section>

          <section>
            <h2 className="text-2xl">12. Contact</h2>
            <p className="mt-3">
              Questions or requests about this policy can be sent to{" "}
              <a className="underline underline-offset-2" href="mailto:cantrell22@hotmail.com">
                cantrell22@hotmail.com
              </a>.
            </p>
          </section>
        </div>

        <div className="mt-12 flex flex-wrap gap-4 border-t border-border pt-6 text-sm">
          <a className="underline underline-offset-2" href="/terms" onClick={() => track("legal_page_cta", { page: "privacy", action: "terms" })}>Terms and Conditions</a>
          <a className="underline underline-offset-2" href="/" onClick={() => track("legal_page_cta", { page: "privacy", action: "home" })}>Back to CitationLX</a>
        </div>
      </article>

      <footer className="border-t py-8 text-center text-xs text-muted-foreground">
        <p>© {new Date().getFullYear()} CitationLX · Independently operated by George Chapungu · Piksen Digital</p>
        <p className="mt-2">
          <a className="underline underline-offset-2" href="/terms">Terms and Conditions</a>
        </p>
      </footer>
    </div>
  );
}
