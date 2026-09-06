// Empty-state placeholder for nav destinations that belong to a later
// Construction increment (Increments 2-4 per claude/README.md Section 9).
// Keeps every sidebar link routable so nothing 404s in Increment 1.
export default function ComingSoonPage({ title }) {
  return (
    <div className="flex flex-col items-center justify-center gap-space-md p-space-2xl min-h-[calc(100vh-4rem)]">
      <span className="material-symbols-outlined text-outline text-[48px]">construction</span>
      <h1 className="font-headline-lg text-headline-lg text-on-surface">{title}</h1>
      <p className="font-body-md text-body-md text-on-surface-variant max-w-md text-center">
        Coming in a later increment. This screen is planned per the Construction increment
        schedule in the project&apos;s <code className="font-label-code text-label-code">README.md</code>.
      </p>
    </div>
  );
}
