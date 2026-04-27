import Link from "next/link";

export function CTASection() {
  return (
    <section className="py-16 sm:py-24 px-4 sm:px-8 relative overflow-hidden bg-[#1A362B]">
      {/* Decorative Organic Blob */}
      <div className="absolute top-0 right-0 w-[300px] sm:w-[600px] h-[300px] sm:h-[600px] bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

      <div className="max-w-3xl mx-auto text-center relative z-10">
        <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-white mb-4 sm:mb-6 leading-tight">
          Ready to plant the seeds of your{" "}
          <span className="italic font-normal">legacy?</span>
        </h2>
        <p className="text-white/60 text-sm sm:text-base max-w-xl mx-auto mb-8 sm:mb-10 font-light leading-relaxed">
          Join a curated collective where purpose meets precision. We are now accepting
          applications for the 2024 Growth Cohort.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
          <Link
            href="/startups"
            className="w-full sm:w-auto px-8 sm:px-10 py-4 bg-white text-[#1A362B] font-bold uppercase text-xs tracking-widest shadow-2xl hover:bg-[#EFEBE3] transition-colors text-center"
          >
            Apply for Capital
          </Link>
          <Link
            href="/mentorship"
            className="w-full sm:w-auto px-8 sm:px-10 py-4 border border-white/20 text-white font-bold uppercase text-xs tracking-widest hover:bg-white/10 transition-colors text-center"
          >
            Become a Mentor
          </Link>
        </div>

        {/* Stats */}
        <div className="flex items-center justify-center gap-12 mt-12 sm:mt-16">
          <div>
            <div className="font-serif text-2xl sm:text-3xl text-white mb-1">$42M+</div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-white/40">Deployed</div>
          </div>
          <div className="w-px h-8 bg-white/10" />
          <div>
            <div className="font-serif text-2xl sm:text-3xl text-white mb-1">240%</div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-white/40">Avg. Growth</div>
          </div>
        </div>
      </div>
    </section>
  );
}