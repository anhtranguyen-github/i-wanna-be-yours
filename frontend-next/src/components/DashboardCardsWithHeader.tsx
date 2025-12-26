import Link from "next/link";
import Image, { StaticImageData } from "next/image";
import { ClayCard } from "@/components/ui/clay-card";

// we need this for small logo in the card
import jlpt_universal_01 from "@public/img/jlpt_universal_01.jpg";

interface DashboardCardsProps {
  id: string;
  name: string;
  link: string;
  file: StaticImageData;
  description: string;
}

interface HeadlineProps {
  title: string;
  subtitle: string;
}

interface DashboardCardsWithHeaderProps {
  cards: DashboardCardsProps[];
  headline: HeadlineProps;
}

const DashboardCardsWithHeader = ({
  cards,
  headline,
}: DashboardCardsWithHeaderProps) => {
  return (
    <div className="p-5 max-w-7xl mx-auto">
      <div>
        <div className="mb-12 header p-6">
          <div className="title">
            <h2 className="mb-4 text-4xl font-extrabold" style={{ color: 'hsl(var(--primary))' }}>
              {headline.title || ""}
            </h2>
            <p className="text-xl font-medium text-neutral-ink">
              {headline.subtitle || ""}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {cards.map((card) => (
          <ClayCard
            key={card.id}
            className="group relative flex flex-col md:flex-row !p-0 overflow-hidden hover:scale-[1.02] transition-transform duration-300 min-h-[200px]"
          >
            <div className="w-full md:w-2/3 p-6 flex flex-col justify-between z-10 bg-inherit">
              <div className="mb-4">
                <Link href={card.link}>
                  <h3 className="text-2xl font-bold leading-tight mb-2 hover:text-brand-blue transition-colors" style={{ color: 'hsl(var(--text-default))' }}>
                    {card.name}
                  </h3>
                </Link>
                {card.description && (
                  <p className="text-sm text-neutral-ink leading-relaxed line-clamp-2">{card.description}</p>
                )}
              </div>

              <div className="flex items-center pt-4">
                <Link href={card.link}>
                  <button className="px-5 py-2.5 bg-brand-blue text-white text-sm font-bold rounded-xl  hover:bg-brand-blue/90 hover: transition-all active:scale-95">
                    Learn More
                  </button>
                </Link>
              </div>
            </div>

            <div className="w-full md:w-1/3 relative h-48 md:h-auto">
              <Image
                alt={card.name}
                className="object-cover w-full h-full absolute inset-0 transition-transform duration-500 group-hover:scale-110"
                src={card.file}
              />
              <div className="absolute inset-0 bg-gradient-to-l from-transparent to-black/5 md:hidden" />
            </div>
          </ClayCard>
        ))}
      </div>
    </div>
  );
};

export default DashboardCardsWithHeader;
