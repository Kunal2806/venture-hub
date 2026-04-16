// "use client";

// import { useState } from "react";
// import Image from "next/image";
// import { Star, CheckCircle, SlidersHorizontal, X } from "lucide-react";
// import { Navigation } from "@/components/home/Navigation";
// import { Footer } from "@/components/home/Footer";

// const startups = [
//   {
//     id: 1,
//     name: "Lumina Grid",
//     category: "Renewable Intelligence",
//     description: "Decentralized solar grid management using AI to balance loads for rural communities in sub-Saharan Africa.",
//     image: "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&q=80&w=800",
//     stage: "Seed", impact: "9.4", fundingGoal: "$1,200,000", fundingPercent: 75,
//     stats: [{ label: "Users", value: "12.4k" }, { label: "Revenue", value: "$450k" }, { label: "Status", value: "Active" }],
//     verified: false,
//   },
//   {
//     id: 2,
//     name: "Aeris Bio",
//     category: "Circular Packaging",
//     description: "Developing compostable, fungi-based packaging materials that dissolve harmlessly back into the earth.",
//     image: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&q=80&w=800",
//     stage: "Series A", impact: "8.8", fundingGoal: "$5,000,000", fundingPercent: 42,
//     stats: [{ label: "Contracts", value: "28" }, { label: "MoM Growth", value: "+12%" }, { label: "Verified", value: "✓" }],
//     verified: true,
//   },
//   {
//     id: 3,
//     name: "Hearth Home",
//     category: "Circular Housing",
//     description: "Modular housing solutions built from recycled industrial waste, designed for rapid deployment and climate resilience.",
//     image: "https://images.unsplash.com/photo-1518005020251-095c1f008353?auto=format&fit=crop&q=80&w=800",
//     stage: "Pre-Seed", impact: "9.1", fundingGoal: "$850,000", fundingPercent: 92,
//     stats: [{ label: "Units Built", value: "120" }, { label: "Pre-Orders", value: "450" }, { label: "Status", value: "Stealth" }],
//     verified: false,
//   },
//   {
//     id: 4,
//     name: "AquaPulse",
//     category: "Ocean Tech",
//     description: "Solar-powered desalination tech that extracts minerals from brine while producing ultra-pure drinking water.",
//     image: "https://images.unsplash.com/photo-1559128010-7c1ad6e1b6a5?auto=format&fit=crop&q=80&w=800",
//     stage: "Seed", impact: "9.6", fundingGoal: "$2,500,000", fundingPercent: 15,
//     stats: [{ label: "Liters/Day", value: "500k" }, { label: "Patents", value: "14" }, { label: "Verified", value: "✓" }],
//     verified: true,
//   },
// ];

// const industryFilters = ["Climate Tech", "AgriTech", "Circular Economy", "Deep Tech"];
// const impactAreas = ["Carbon", "Water", "Social", "Energy"];

// export default function InvestorsPage() {
//   const [activeImpact, setActiveImpact] = useState("Carbon");
//   const [sidebarOpen, setSidebarOpen] = useState(false);

//   return (
//     <div className="min-h-screen">
//       <Navigation activeItem="investors" />

//       <main className="pt-24 sm:pt-32 pb-16 sm:pb-24 px-4 sm:px-8 max-w-[1600px] mx-auto">

//         {/* Mobile filter toggle */}
//         <div className="flex lg:hidden justify-between items-center mb-6">
//           <h1 className="font-serif text-3xl text-forest">Opportunities</h1>
//           <button
//             onClick={() => setSidebarOpen(true)}
//             className="flex items-center gap-2 px-4 py-2 border border-forest/20 text-forest text-xs font-bold uppercase tracking-widest"
//           >
//             <SlidersHorizontal className="w-4 h-4" /> Filters
//           </button>
//         </div>

//         <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">

//           {/* Sidebar — drawer on mobile, static on desktop */}
//           <>
//             {/* Mobile overlay */}
//             {sidebarOpen && (
//               <div className="fixed inset-0 z-50 lg:hidden">
//                 <div className="absolute inset-0 bg-forest/20 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
//                 <div className="absolute top-0 left-0 h-full w-80 max-w-[85vw] bg-cream shadow-2xl overflow-y-auto p-8">
//                   <div className="flex justify-between items-center mb-8">
//                     <h3 className="font-serif text-2xl text-forest">Filters</h3>
//                     <button onClick={() => setSidebarOpen(false)}><X className="w-5 h-5 text-forest" /></button>
//                   </div>
//                   <SidebarContent activeImpact={activeImpact} setActiveImpact={setActiveImpact} industryFilters={industryFilters} impactAreas={impactAreas} />
//                 </div>
//               </div>
//             )}

//             {/* Desktop sidebar */}
//             <aside className="hidden lg:block w-72 flex-shrink-0 space-y-10 reveal" style={{ animationDelay: "0.1s" }}>
//               {/* Profile */}
//               <section>
//                 <h5 className="text-[10px] font-bold uppercase tracking-[0.3em] text-forest/40 mb-6">Investor Profile</h5>
//                 <div className="bg-beige/40 border border-forest/5 p-6 space-y-6">
//                   <div>
//                     <p className="text-[10px] font-bold uppercase tracking-widest text-forest/40">Portfolio Value</p>
//                     <p className="font-serif text-2xl text-forest">$12,450,000</p>
//                   </div>
//                   <div className="grid grid-cols-2 gap-4">
//                     <div>
//                       <p className="text-[10px] font-bold uppercase tracking-widest text-forest/40">Active</p>
//                       <p className="font-serif text-lg text-forest">14</p>
//                     </div>
//                     <div>
//                       <p className="text-[10px] font-bold uppercase tracking-widest text-forest/40">IRR</p>
//                       <p className="font-serif text-lg text-forest">24.8%</p>
//                     </div>
//                   </div>
//                   <button className="block w-full text-center py-3 bg-forest text-white text-[10px] font-bold uppercase tracking-widest hover:opacity-90 transition-opacity">
//                     Manage Assets
//                   </button>
//                 </div>
//               </section>
//               <SidebarContent activeImpact={activeImpact} setActiveImpact={setActiveImpact} industryFilters={industryFilters} impactAreas={impactAreas} />
//             </aside>
//           </>

//           {/* Main content */}
//           <div className="flex-1 space-y-8 sm:space-y-12">
//             <header className="hidden lg:flex flex-col md:flex-row md:items-end justify-between gap-6 sm:gap-8 reveal">
//               <div className="max-w-2xl">
//                 <h1 className="font-serif text-4xl sm:text-5xl text-forest mb-3 sm:mb-4">Curated Opportunities</h1>
//                 <p className="text-forest/60 leading-relaxed text-sm sm:text-base">
//                   Explore high-impact ventures verified by the VentureHub network. Every project is selected for its technical rigor and ethical resonance.
//                 </p>
//               </div>
//               <div className="flex items-center gap-4 border-b border-forest/10 pb-2 flex-shrink-0">
//                 <span className="text-[10px] font-bold uppercase tracking-widest text-forest/40">Sort By:</span>
//                 <select className="bg-transparent text-sm font-bold uppercase tracking-widest text-forest focus:outline-none cursor-pointer">
//                   <option>Latest Listings</option>
//                   <option>Highest Funding</option>
//                   <option>Impact Score</option>
//                 </select>
//               </div>
//             </header>

//             {/* Cards */}
//             <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-10 reveal" style={{ animationDelay: "0.2s" }}>
//               {startups.map(({ id, name, category, description, image, stage, impact, fundingGoal, fundingPercent, stats }) => (
//                 <div key={id} className="startup-card bg-white border border-forest/5 group cursor-pointer overflow-hidden">
//                   <div className="relative aspect-video overflow-hidden bg-beige">
//                     <Image src={image} alt={name} fill className="card-img object-cover transition-transform duration-700" />
//                     <div className="card-overlay absolute inset-0 bg-forest/40 opacity-0 transition-opacity flex items-center justify-center">
//                       <span className="px-5 py-2.5 bg-white text-forest text-[10px] font-bold uppercase tracking-widest">View Detail</span>
//                     </div>
//                     <div className="absolute top-3 sm:top-4 left-3 sm:left-4 flex gap-2">
//                       <span className="px-2 sm:px-3 py-1 bg-white/90 backdrop-blur-sm text-forest text-[9px] font-bold uppercase tracking-widest">{stage}</span>
//                       <span className="px-2 sm:px-3 py-1 bg-forest text-white text-[9px] font-bold uppercase tracking-widest">Impact: {impact}</span>
//                     </div>
//                   </div>

//                   <div className="p-5 sm:p-8 space-y-4 sm:space-y-6">
//                     <div className="flex justify-between items-start">
//                       <div>
//                         <h3 className="font-serif text-xl sm:text-2xl text-forest mb-1">{name}</h3>
//                         <p className="text-xs font-bold uppercase tracking-widest text-forest/40">{category}</p>
//                       </div>
//                       <Star className="text-forest/20 hover:text-forest cursor-pointer transition-colors w-5 h-5 mt-1 flex-shrink-0" />
//                     </div>
//                     <p className="text-sm text-forest/60 leading-relaxed line-clamp-2">{description}</p>
//                     <div className="space-y-2 sm:space-y-3">
//                       <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-forest/40">
//                         <span>Funding Goal</span>
//                         <span>{fundingPercent}% Reached</span>
//                       </div>
//                       <div className="h-[2px] w-full bg-forest/5">
//                         <div className="h-full bg-forest transition-all" style={{ width: `${fundingPercent}%` }} />
//                       </div>
//                       <div className="flex justify-between font-serif text-base sm:text-lg text-forest">
//                         <span>{fundingGoal}</span>
//                         <span className="text-xs font-sans font-bold uppercase text-forest/40 pt-1">Target</span>
//                       </div>
//                     </div>
//                     <div className="grid grid-cols-3 pt-4 sm:pt-6 border-t border-forest/5 gap-2 sm:gap-4">
//                       {stats.map(({ label, value }) => (
//                         <div key={label} className="text-center">
//                           <p className="text-[9px] font-bold uppercase tracking-widest text-forest/40">{label}</p>
//                           {value === "✓" ? (
//                             <CheckCircle className="text-forest mx-auto mt-1 w-4 h-4" />
//                           ) : (
//                             <p className={`font-serif text-sm sm:text-base text-forest ${value.startsWith("+") ? "text-emerald-600" : ""}`}>{value}</p>
//                           )}
//                         </div>
//                       ))}
//                     </div>
//                   </div>
//                 </div>
//               ))}
//             </div>

//             <div className="pt-8 sm:pt-12 flex justify-center reveal">
//               <button className="px-10 sm:px-12 py-4 sm:py-5 border border-forest/20 text-forest text-[10px] font-bold uppercase tracking-widest hover:bg-beige transition-colors">
//                 Load More Opportunities
//               </button>
//             </div>
//           </div>
//         </div>
//       </main>

//       <Footer />
//     </div>
//   );
// }

// function SidebarContent({
//   activeImpact, setActiveImpact, industryFilters, impactAreas
// }: {
//   activeImpact: string;
//   setActiveImpact: (v: string) => void;
//   industryFilters: string[];
//   impactAreas: string[];
// }) {
//   return (
//     <section className="space-y-8">
//       <h5 className="text-[10px] font-bold uppercase tracking-[0.3em] text-forest/40">Filters</h5>
//       <div className="space-y-6">
//         <div>
//           <label className="text-[11px] font-bold uppercase tracking-widest text-forest/60 mb-3 block">Industry</label>
//           <div className="space-y-2">
//             {industryFilters.map((item, i) => (
//               <label key={item} className="flex items-center gap-3 cursor-pointer group">
//                 <input type="checkbox" defaultChecked={i === 0} className="accent-forest w-4 h-4" />
//                 <span className="text-sm text-forest/80 group-hover:text-forest transition-colors">{item}</span>
//               </label>
//             ))}
//           </div>
//         </div>
//         <div>
//           <label className="text-[11px] font-bold uppercase tracking-widest text-forest/60 mb-3 block">Investment Stage</label>
//           <select className="w-full bg-transparent border-b border-forest/20 py-2 text-sm focus:outline-none focus:border-forest text-forest">
//             <option>All Stages</option>
//             <option>Pre-Seed</option>
//             <option>Seed</option>
//             <option>Series A</option>
//           </select>
//         </div>
//         <div>
//           <label className="text-[11px] font-bold uppercase tracking-widest text-forest/60 mb-3 block">Impact Area</label>
//           <div className="flex flex-wrap gap-2">
//             {impactAreas.map((area) => (
//               <button
//                 key={area}
//                 onClick={() => setActiveImpact(area)}
//                 className={`px-3 py-1 text-[10px] font-bold uppercase tracking-widest transition-colors ${
//                   activeImpact === area ? "bg-forest text-white" : "bg-forest/5 text-forest hover:bg-forest/10"
//                 }`}
//               >
//                 {area}
//               </button>
//             ))}
//           </div>
//         </div>
//       </div>
//     </section>
//   );
// }
import { ProfileForm } from "@/components/investor/ProfileForm";

export const metadata = {
  title: "Investor Profile | VentureHub",
  description: "Set your investment preferences to get matched with the right startups.",
};

export default function InvestorProfilePage() {
  return <ProfileForm defaultValues={null} />;
}