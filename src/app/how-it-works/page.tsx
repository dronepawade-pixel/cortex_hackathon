import { ArrowRight, Leaf } from "lucide-react";

export const metadata = {
  title: "How it works — ScanAid",
  description: "How ScanAid works. Content coming soon.",
};

export default function HowItWorks() {
  return (
    <div className="mx-auto w-full max-w-[1240px] overflow-x-clip px-4 sm:px-7 lg:px-10">
      <header className="flex min-h-20 flex-wrap items-center justify-between gap-x-4 gap-y-2 py-4 sm:min-h-28 sm:py-5">
        <a href="/" aria-label="ScanAid home" className="flex min-h-11 items-center gap-2.5 text-forest">
          <span className="grid size-9 place-items-center rounded-full bg-keylime"><Leaf className="size-5" strokeWidth={1.5} /></span>
          <span className="text-xl font-semibold tracking-tight">ScanAid<span className="text-forest-muted">.</span></span>
        </a>
        <nav aria-label="Main navigation" className="order-3 flex w-full items-center gap-5 overflow-x-auto text-[13px] text-forest-muted sm:gap-8 lg:order-none lg:w-auto">
          <a href="/#analyzer" className="inline-flex min-h-11 shrink-0 items-center transition-colors hover:text-forest">Analyzer</a>
          <a href="/#timeline" className="inline-flex min-h-11 shrink-0 items-center transition-colors hover:text-forest">Timeline</a>
          <a href="/#indicators" className="inline-flex min-h-11 shrink-0 items-center transition-colors hover:text-forest">Indicators</a>
          <a href="/#early-care" className="hidden min-h-11 shrink-0 items-center transition-colors hover:text-forest sm:inline-flex">Why early care</a>
          <a href="/how-it-works" aria-current="page" className="inline-flex min-h-11 shrink-0 items-center text-forest">How it works</a>
        </nav>
        <a href="/#analyzer" className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full bg-forest px-4 text-[13px] text-cream transition-colors hover:bg-[#0c2f10] sm:gap-3 sm:px-5">Try the demo <ArrowRight className="size-3.5" /></a>
      </header>

      <main>
        <section aria-labelledby="how-it-works-title" className="py-12 sm:py-24">
          <p className="eyebrow mb-3">How it works</p>
          <h1 id="how-it-works-title" className="section-title">How it works.</h1>
          <p className="mt-4 max-w-[52ch] text-sm leading-relaxed text-forest-muted">
            This page is a placeholder. Add the step-by-step content here.
          </p>
        </section>
      </main>

      <footer className="flex flex-col gap-6 border-t border-border py-8 text-xs text-forest-muted sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
        <div>
          <a href="/" className="flex min-h-11 items-center gap-2 text-base font-semibold tracking-tight text-forest"><Leaf className="size-4" strokeWidth={1.5} /> ScanAid.</a>
          <p className="mt-2">A little more clarity. A little earlier.</p>
        </div>
        <div className="max-w-[46ch] sm:text-right">
          <p>CXHPS07 · Hackathon prototype</p>
          <p className="mt-2 leading-relaxed">Early indication only. Not a medical device.</p>
        </div>
      </footer>
    </div>
  );
}
