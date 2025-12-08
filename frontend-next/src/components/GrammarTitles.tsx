import Link from "next/link";
import React from "react";
import ClayCard from "./ui/ClayCard";

interface GrammarTitlesProps {
  lang: string;
  pTag: string;
  slug: string;
}

const GrammarTitles: React.FC<GrammarTitlesProps> = async ({ lang, pTag, slug }) => {
  // ... (keeping logs if desired or cleaning them up - I will keep them minimal)

  let apiUrl;
  if (process.env.REACT_APP_HOST_IP) {
    apiUrl = `http://${process.env.REACT_APP_HOST_IP}:8000/e-api/v1/grammar-titles?p_tag=${pTag}`;
  } else {
    apiUrl = `http://localhost:8000/e-api/v1/grammar-titles?p_tag=${pTag}`;
  }

  try {
    const response = await fetch(apiUrl);
    const data = await response.json();
    const titles = data.titles;

    const encodeTitle = (title: string) => {
      return encodeURIComponent(title.replace(/\//g, "-"));
    };

    return (
      <div className="mx-auto max-w-screen-xl px-5">
        <h2 className="text-2xl font-bold mb-4 py-8" style={{ color: 'hsl(var(--primary))' }}>
          {lang} grammar list for {pTag}:
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {titles.map((title: any, index: any) => (
            <Link
              key={index}
              href={`/content/grammar_dashboard/${pTag}/${encodeTitle(title)}`}
              className="block hover:scale-[1.02] transition-transform duration-200"
            >
              <ClayCard className="h-full flex items-center justify-center !p-6 !py-8 hover:bg-opacity-80 transition-opacity">
                <span className="text-lg font-semibold text-center" style={{ color: 'hsl(var(--text-default))' }}>
                  {title}
                </span>
              </ClayCard>
            </Link>
          ))}
        </div>
      </div>
    );
  } catch (error) {
    console.error("Error fetching data:", error);
    return null;
  }
};

export default GrammarTitles;

