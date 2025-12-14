"use client";

import { useState } from "react";
// import Image from "next/image";
import Link from "next/link";
import { ClayCard } from "@/components/ui/clay-card";


// type Props = {
//   img: any;
//   title: any;
//   link: any;
// };

export default function CategoriesHeader() {
  const [filter, setFilter] = useState("All");

  const categories = ["All", "Grammar", "Vocabulary", "Kanji"];

  const items = [
    { title: "Japanese JLPT N5 Grammar", link: "/knowledge-base/all/grammar_selection/JLPT_N5", category: "Grammar", img: "/img/core.png" },
    { title: "Japanese JLPT N4 Grammar", link: "/knowledge-base/all/grammar_selection/JLPT_N4", category: "Grammar", img: "/img/core.png" },
    { title: "Japanese JLPT N3 Grammar", link: "/knowledge-base/all/grammar_selection/JLPT_N3", category: "Grammar", img: "/img/core.png" },
    { title: "Japanese JLPT N2 Grammar", link: "/knowledge-base/all/grammar_selection/JLPT_N2", category: "Grammar", img: "/img/core.png" },
    { title: "Japanese JLPT N1 Grammar", link: "/knowledge-base/all/grammar_selection/JLPT_N1", category: "Grammar", img: "/img/core.png" },
    { title: "Essential Verbs", link: "/knowledge-base/verbs/essential_verbs", category: "Vocabulary", img: "/img/core.png" },
    { title: "JLPT N3 Vocab", link: "/knowledge-base/verbs/JLPT_N3", category: "Vocabulary", img: "/img/core.png" },
    { title: "Kanji", link: "/knowledge-base/kanji", category: "Kanji", img: "/img/core.png" },
    { title: "Radicals", link: "/knowledge-base/radicals", category: "Kanji", img: "/img/core.png" },
  ];

  const filteredItems = filter === "All"
    ? items
    : items.filter(item => item.category === filter);

  return (
    <div className="w-11/12 py-5 px-10 rounded-md hidden lg:block">
      <div className="w-full flex flex-col lg:flex-row items-center justify-between">
        <h1 className="text-xl font-bold" style={{ color: 'hsl(var(--primary))' }}>Categories</h1>
        <div className="flex space-x-2">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-6 py-2 rounded-2xl text-sm font-bold transition-all duration-300 ${filter === cat
                ? "bg-brand-blue text-white shadow-inner"
                : "bg-white text-gray-700 hover:bg-gray-100 clay-button"
                }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-8 w-full grid md:grid-cols-4 gap-6">
        {filteredItems.map((item) => (
          <Link href={item.link} key={item.title}>
            <ClayCard className="h-full flex flex-col items-center justify-center text-center hover:-translate-y-1 transition-transform cursor-pointer">
              {/* <Image src={item.img} className="h-12 mb-4" width={48} height={48} alt="" /> */}
              <h3 className="text-lg font-bold">{item.title}</h3>
            </ClayCard>
          </Link>
        ))}
      </div>
    </div>
  );
}
