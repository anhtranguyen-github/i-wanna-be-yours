import { useState } from "react";
import Image from "next/image";
import Link from "next/link";


type Props = {
  img: any;
  title: any;
  link: any;
};

export default function CategoriesHeader() {
  const [filter, setFilter] = useState("All");

  const categories = ["All", "Grammar", "Vocabulary", "Kanji"];

  const items = [
    { title: "Japanese JLPT N5 Grammar", link: "/content/grammar_selection/JLPT_N5", category: "Grammar", img: "/img/core.png" },
    { title: "Japanese JLPT N4 Grammar", link: "/content/grammar_selection/JLPT_N4", category: "Grammar", img: "/img/core.png" },
    { title: "Japanese JLPT N3 Grammar", link: "/content/grammar_selection/JLPT_N3", category: "Grammar", img: "/img/core.png" },
    { title: "Japanese JLPT N2 Grammar", link: "/content/grammar_selection/JLPT_N2", category: "Grammar", img: "/img/core.png" },
    { title: "Japanese JLPT N1 Grammar", link: "/content/grammar_selection/JLPT_N1", category: "Grammar", img: "/img/core.png" },
    { title: "Essential Verbs", link: "/content/vocabulary_selection/essential_verbs", category: "Vocabulary", img: "/img/core.png" },
    { title: "JLPT N3 Vocab", link: "/content/vocabulary_selection/JLPT_N3", category: "Vocabulary", img: "/img/core.png" },
    { title: "Kanji", link: "/content/kanji", category: "Kanji", img: "/img/core.png" },
    { title: "Radicals", link: "/content/radicals", category: "Kanji", img: "/img/core.png" },
  ];

  const filteredItems = filter === "All"
    ? items
    : items.filter(item => item.category === filter);

  return (
    <div className="w-11/12 py-5 px-10 bg-gray-50 rounded-md hidden lg:block">
      <div className="w-full flex flex-col lg:flex-row items-center justify-between">
        <h1 className="text-xl font-bold">Categories</h1>
        <div className="flex space-x-2">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-4 py-2 rounded-full text-sm font-bold transition-colors ${filter === cat
                ? "bg-brand-blue text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-5 w-full grid md:grid-cols-5 gap-5">
        {filteredItems.map((item) => (
          <Card key={item.title} img={item.img} title={item.title} link={item.link} />
        ))}
      </div>
    </div>
  );
}

// we would need better icons, maybe some kanji instead
function Card({ img, title, link }: Props) {
  return (
    <div className="p-5 flex items-center text-center justify-center flex-col">
      {/* <Image src={img} className="h-12" width={200} height={200} alt="" /> */}
      <h1 className="text-xl font-bold mt-5">
        {link ? (
          <Link href={link} className="text-gray-600 hover:text-blue-800">
            {title}
          </Link>
        ) : (
          title
        )}
      </h1>
    </div>
  );
}
