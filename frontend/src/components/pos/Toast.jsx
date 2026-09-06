// Lightweight bottom-center toast, ported from the Stitch markup's
// #pos-toast, driven by real state instead of direct DOM manipulation.
export default function Toast({ toast }) {
  return (
    <div
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 transform transition-all duration-300 pointer-events-none ${
        toast ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}
    >
      <div className="bg-inverse-surface text-inverse-on-surface px-4 py-2.5 rounded-lg shadow-xl flex items-center gap-2 font-body-md text-body-md">
        <span className="material-symbols-outlined text-emerald-400 text-[20px]">{toast?.icon || 'check_circle'}</span>
        <span>{toast?.message}</span>
      </div>
    </div>
  );
}
