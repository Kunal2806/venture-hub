// components/about/MissionSection.tsx
export function MissionSection() {
  return (
    <section className="bg-[#EFEBE3] px-6 sm:px-12 py-24 text-center">
      <div className="max-w-3xl mx-auto reveal" style={{ animationDelay: "0.1s" }}>
        <span className="block text-[10px] font-bold uppercase tracking-[0.2em] text-[#1A362B]/40 mb-6">
          Our Mission
        </span>
        <blockquote className="font-serif text-2xl sm:text-3xl lg:text-4xl font-medium italic leading-[1.4] text-[#1A362B]">
          &ldquo;Our mission is to create a structured and accessible ecosystem where innovation
          meets opportunity.&rdquo;
        </blockquote>
      </div>
    </section>
  );
}