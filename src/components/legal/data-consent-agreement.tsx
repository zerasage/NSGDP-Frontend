// Full text of the Data Contribution & Usage Consent Agreement, shown once
// during registration to the first person who accepts an invite on behalf
// of a new organisation (see /register/invite). Keep this in sync with
// nsgdp-backend/docs/data-contribution-consent-agreement.md — that file is
// the source of truth; this is the in-app rendering of the same terms.
export const DATA_CONSENT_VERSION = "2026-07-31";

export function DataConsentAgreement({ organisationName }: { organisationName: string }) {
  return (
    <div className="space-y-4 text-sm leading-relaxed text-muted-foreground">
      <div>
        <h4 className="font-semibold text-foreground">Data Contribution &amp; Usage Consent Agreement</h4>
        <p className="text-xs mt-1">
          Niger State GeoHealth Data Portal — Niger State Primary Health Care Development Agency (NSPHCDA)
        </p>
      </div>

      <p>
        This Agreement is entered into between the <strong>Niger State Primary Health Care Development
        Agency</strong> (&ldquo;NSPHCDA&rdquo;, &ldquo;the Agency&rdquo;), which administers the Niger State
        GeoHealth Data Portal (&ldquo;the Portal&rdquo;) on behalf of the Niger State Government, and{" "}
        <strong>{organisationName}</strong> (&ldquo;the Contributing Organisation&rdquo;).
      </p>

      <section>
        <h5 className="font-medium text-foreground mb-1">1. Background</h5>
        <p>
          NSPHCDA operates the Portal to consolidate datasets from government agencies, development partners,
          non-governmental organisations, research institutions, and other contributing bodies, to support public
          health planning, surveillance, resource allocation, and evidence-based policymaking across Niger State.
          By registering, the Contributing Organisation agrees to these terms for every dataset it submits, unless
          superseded by a more specific written agreement for a particular dataset or programme.
        </p>
      </section>

      <section>
        <h5 className="font-medium text-foreground mb-1">2. Consent and Grant of Rights</h5>
        <p>
          By submitting data to the Portal (&ldquo;Contributed Data&rdquo;), the Contributing Organisation grants
          NSPHCDA and the Niger State Government a non-exclusive, royalty-free, worldwide licence to host, store,
          reproduce, process, analyse, combine with other datasets, generate derivative statistics or
          visualisations from, and — subject to the Visibility Setting chosen for that dataset — display,
          distribute, and publish the Contributed Data, for public health planning, surveillance, policy
          formulation, resource allocation, research, and public transparency within NSPHCDA&rsquo;s mandate.
        </p>
        <p className="mt-2">
          This licence continues for as long as the Contributed Data remains on the Portal. Ownership of the
          Contributed Data is not transferred and remains with the Contributing Organisation, subject to Section 3.
        </p>
      </section>

      <section>
        <h5 className="font-medium text-foreground mb-1">3. Representations and Warranties</h5>
        <p>The Contributing Organisation represents and warrants that it:</p>
        <ul className="list-disc pl-5 mt-1 space-y-1">
          <li>has the full legal right and authority to submit the Contributed Data and grant this licence;</li>
          <li>is not, to its knowledge, infringing any third party&rsquo;s intellectual property or privacy rights;</li>
          <li>
            has obtained all consents and legal bases required under applicable law — including the Nigeria Data
            Protection Act 2023 — before submitting any data containing Personal or Health Data, and has, wherever
            practicable, de-identified or aggregated such data before upload;
          </li>
          <li>submits data in good faith, believing it accurate, complete, and not materially misleading; and</li>
          <li>will promptly notify NSPHCDA if it becomes aware that any submitted data was inaccurate or submitted in error.</li>
        </ul>
      </section>

      <section>
        <h5 className="font-medium text-foreground mb-1">4. Data Classification and Access Control</h5>
        <p>
          Each dataset is submitted under a Visibility Setting: <strong>Public</strong> (open to any visitor),{" "}
          <strong>Restricted</strong> (visible in the catalogue, but requires an approved access request before it
          can be previewed or downloaded), or <strong>Private</strong> (visible only within the Contributing
          Organisation and to NSPHCDA administrators). The Contributing Organisation is responsible for selecting a
          setting appropriate to the sensitivity of its data. NSPHCDA may reclassify or restrict a dataset it
          reasonably believes poses a data-protection, security, or public-interest concern.
        </p>
      </section>

      <section>
        <h5 className="font-medium text-foreground mb-1">5. Data Quality and Review</h5>
        <p>
          Contributed Data submitted for publication passes through NSPHCDA&rsquo;s standard review and approval
          workflow, which may include a data quality assessment. NSPHCDA may request clarification or corrections,
          or decline to publish, or return for revision, any dataset that does not meet the Portal&rsquo;s
          documentation or quality standards.
        </p>
      </section>

      <section>
        <h5 className="font-medium text-foreground mb-1">6. Confidentiality</h5>
        <p>
          NSPHCDA will take reasonable technical and administrative measures to prevent unauthorised access to
          Restricted or Private data, and will not disclose it outside of authorised users except with the
          Contributing Organisation&rsquo;s consent, where required by law, or where necessary to protect public
          health in an emergency.
        </p>
      </section>

      <section>
        <h5 className="font-medium text-foreground mb-1">7. Intellectual Property and Attribution</h5>
        <p>
          The Contributing Organisation retains all intellectual property rights in its Contributed Data, subject
          to the licence in Section 2. NSPHCDA will, where reasonably practicable, credit the Contributing
          Organisation as a data source in any derivative work or publication, and will honour any data licence
          the Contributing Organisation specifies for onward use by third parties.
        </p>
      </section>

      <section>
        <h5 className="font-medium text-foreground mb-1">8. Withdrawal of Consent and Data Retention</h5>
        <p>
          The Contributing Organisation may request removal of its data from public access at any time. NSPHCDA
          will remove it within a reasonable period, except where retention is required by law or for audit
          purposes, where the data has already been incorporated into an aggregated dataset that cannot reasonably
          be disaggregated, or for the duration of an ongoing access request, dispute, or investigation.
          Withdrawal does not affect the lawfulness of any use prior to the date of withdrawal.
        </p>
      </section>

      <section>
        <h5 className="font-medium text-foreground mb-1">9. Data Protection Compliance</h5>
        <p>
          Both parties will comply with the Nigeria Data Protection Act 2023 in respect of any Personal or Health
          Data within the Contributed Data. The Contributing Organisation acts as data controller for any such data
          it originates, and the parties will cooperate in good faith on any data-subject request or regulatory
          inquiry.
        </p>
      </section>

      <section>
        <h5 className="font-medium text-foreground mb-1">10. Liability</h5>
        <p>
          The Contributing Organisation will indemnify NSPHCDA against claims arising from a breach of its
          representations and warranties under Section 3. NSPHCDA provides the Portal on an &ldquo;as
          available&rdquo; basis and does not warrant uninterrupted or error-free operation.
        </p>
      </section>

      <section>
        <h5 className="font-medium text-foreground mb-1">11. Governing Law</h5>
        <p>
          This Agreement is governed by the laws of the Federal Republic of Nigeria and, where applicable, Niger
          State. Disputes will first be addressed through good-faith negotiation before formal proceedings before a
          court of competent jurisdiction in Niger State.
        </p>
      </section>

      <p className="text-xs pt-2 border-t">
        This is a summary rendering of the Agreement for registration purposes. The complete, definitive text is
        maintained by NSPHCDA and available on request.
      </p>
    </div>
  );
}
