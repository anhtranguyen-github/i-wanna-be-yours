import Link from "next/link";
import { ClayCard } from "@/components/ui/clay-card";

interface BlogCardProps {
  id: string;
  name: string;
  link: string;
  file: string;
  description: string;
}

interface HeaderProps {
  title: string;
  subtitle: string;
}


interface BlogCardsProps {
  cards: BlogCardProps[];
  header: HeaderProps
}


const BlogCards = ({ cards, header }: BlogCardsProps) => {

  return (
    <div className="flex flex-col">
      <div className="p-7">
        <div className="w-full p-12 bg-white">
          <div className="flex items-end justify-between mb-12 header">
            <div className="title">
              <p className="mb-4 text-4xl font-bold" style={{ color: 'hsl(var(--text-default))' }}>
                {header.title}
              </p>
              <p className="text-2xl font-light text-neutral-ink">
                {header.subtitle}
              </p>
            </div>
            <div className="text-end"></div>
          </div>
          <div className="grid grid-cols-1 gap-12 md:grid-cols-2 xl:grid-cols-3">
            {cards.map((card) => (
              <ClayCard
                key={card.id}
                className="m-auto !p-0 overflow-hidden flex flex-col h-full hover:scale-105 transition-transform duration-300 cursor-pointer"
              >
                <Link href={card.link} className="block w-full h-48 relative overflow-hidden">
                  <img
                    alt="blog photo"
                    src={card.file}
                    className="object-cover w-full h-full hover:scale-110 transition-transform duration-500"
                  />
                </Link>
                <div className="w-full p-6 flex flex-col flex-grow">
                  <p className="font-medium text-brand-blue text-xs uppercase tracking-wider mb-2">ARTICLE</p>
                  <Link href={card.link}>
                    <h3 className="text-xl font-bold mb-3 hover:text-brand-blue transition-colors" style={{ color: 'hsl(var(--text-default))' }}>
                      {card.name}
                    </h3>
                  </Link>
                  <p className="mb-4 text-sm text-neutral-ink line-clamp-3 flex-grow">
                    {card.description}
                  </p>
                  <div className="flex items-center pt-4 border-t border-gray-100 mt-auto">
                    <Link href={card.link} className="relative block">
                      <img
                        alt="profile"
                        src="/img/cover.jpg"
                        className="mx-auto object-cover rounded-full h-10 w-10 border-2 border-white shadow-sm"
                      />
                    </Link>
                    {/* <Link href={card.link}>Read more</Link> */}
                    <div className="flex flex-col justify-between ml-4 text-xs">
                      <p className="font-bold text-neutral-ink">hanachan</p>
                      {/* <p className="text-neutral-ink dark:text-neutral-ink">
                        20 mars 2029 - 6 min read
                      </p> */}
                    </div>
                  </div>
                </div>
              </ClayCard>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlogCards;