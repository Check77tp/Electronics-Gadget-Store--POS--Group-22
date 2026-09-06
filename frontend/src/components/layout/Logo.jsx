// Inline SVG logo, ported verbatim from the project's `gadgetpos_logo_code.html`
// Stitch export.
export default function Logo({ className = 'h-8 w-auto' }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 40" fill="none">
      <rect x="2" y="6" width="28" height="28" rx="8" fill="#2563EB" />
      <path d="M9 14h14v12H9z" stroke="#FFFFFF" strokeWidth="2" fill="none" />
      <path d="M13 18h6M13 22h4" stroke="#60A5FA" strokeWidth="2" strokeLinecap="round" />
      <circle cx="21" cy="12" r="2.5" fill="#38BDF8" />
      <text x="38" y="26" fontFamily="system-ui, -apple-system, sans-serif" fontWeight="800" fontSize="20" fill="#0F172A" letterSpacing="-0.5">
        Gadget<tspan fill="#2563EB">POS</tspan>
      </text>
    </svg>
  );
}
