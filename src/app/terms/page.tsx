import Link from "next/link";
import Image from "next/image";

export const metadata = {
  title: "Pilot terms & privacy — VandyLoop",
};

// Plain-English pilot terms + privacy notice. This is a builder's draft to make
// the pilot honest and transparent — it is NOT legal advice and must be reviewed
// by Vanderbilt's office of general counsel / privacy before a real launch.
export default function TermsPage() {
  return (
    <div className="flex-1">
      <div className="mx-auto max-w-2xl px-6 py-16">
        <Link href="/" className="inline-flex items-center gap-2 mb-8">
          <Image src="/recoup-logo.png" alt="Recoup" width={245} height={245} className="h-8 w-8" />
          <span className="font-display font-semibold tracking-tight">Recoup / VandyLoop</span>
        </Link>

        <h1 className="font-display text-3xl font-semibold tracking-tight">
          Pilot terms &amp; privacy notice
        </h1>
        <p className="mt-2 text-[13px] text-ink-4">
          Plain-English summary for the VandyLoop recycling challenge pilot. Draft for review.
        </p>

        <div className="mt-8 space-y-6 text-[14px] text-ink-3 leading-relaxed">
          <Section title="What this is">
            VandyLoop is a recycling challenge run by Recoup as a pilot at Vanderbilt. You earn
            points for verified aluminum-can returns and can redeem them for rewards funded by
            Vanderbilt and campus partners. Points have no cash value and are not transferable.
          </Section>

          <Section title="What we collect">
            <ul className="list-disc pl-5 space-y-1">
              <li>Your name, chosen handle, and university email.</li>
              <li>A hashed password (we never store it in plain text).</li>
              <li>Your recycling activity: which bin, when, the classifier result, and points.</li>
              <li>
                If you choose to share it, your device location <em>at the moment you log a return</em>,
                used only to confirm you&apos;re at the bin. We don&apos;t track you in the background.
              </li>
              <li>Optional photos you submit of a can, used only to verify the material.</li>
            </ul>
          </Section>

          <Section title="What we don't do">
            <ul className="list-disc pl-5 space-y-1">
              <li>No access to your VandyID, meal plan, financial accounts, or campus records.</li>
              <li>No continuous or background location tracking.</li>
              <li>No selling your data. No advertising.</li>
            </ul>
          </Section>

          <Section title="How we use it">
            To run the challenge: score returns, power the leaderboard and team bracket, issue
            rewards, and produce aggregate sustainability reporting for Vanderbilt. Aggregate
            reporting never identifies you individually.
          </Section>

          <Section title="Fair play">
            Returns are verified (location, a rotating bin code, photo classification, and
            duplicate detection). Attempting to farm points — fake returns, reused photos,
            logging from off-site — can result in points being reversed or your account removed.
          </Section>

          <Section title="Your choices">
            You can stop participating at any time and request that your account and data be
            deleted by contacting the pilot team. Location and photo sharing are optional per
            return (returns still log without them, with lower verification).
          </Section>

          <Section title="Contact">
            Questions about the pilot or your data: the VandyLoop pilot team / Vanderbilt
            Sustainability. (Add the real contact before launch.)
          </Section>

          <div className="rounded-[var(--radius)] border border-amber-soft bg-amber-wash p-4 text-[12px] text-ink-3">
            <strong className="text-ink">Note:</strong> This is a draft notice written to keep the
            pilot transparent. Before a real launch it must be reviewed and finalized with
            Vanderbilt&apos;s privacy / general counsel, including FERPA and any applicable consent
            requirements.
          </div>
        </div>

        <div className="mt-10">
          <Link href="/join" className="text-[14px] text-brand font-medium hover:underline">
            ← Back to sign up
          </Link>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="font-display text-[16px] font-semibold tracking-tight text-ink mb-1.5">
        {title}
      </h2>
      <div>{children}</div>
    </section>
  );
}
