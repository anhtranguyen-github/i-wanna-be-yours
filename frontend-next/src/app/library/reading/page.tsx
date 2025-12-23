import ReadingCards from "@/components/ReadingCards";

export default function Reading() {
  return (
    <>
      <div className="min-h-screen bg-background p-6 md:p-12">
        <div className="max-w-7xl mx-auto space-y-12">
          {/* Header Section */}
          <div className="bg-card rounded-2xl p-8 md:p-12 border border-border  relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-reading/5 rounded-full blur-3xl -z-10"></div>

            <h1 className="text-4xl md:text-5xl font-black text-foreground mb-6 font-display tracking-tight">
              Japanese <span className="text-reading">Reading</span> Section
            </h1>

            <p className="text-muted-foreground font-bold text-sm leading-relaxed max-w-3xl">
              Explore our collection of Japanese short stories, each featuring
              audio, romaji, and English translations. Delve into detailed
              sentence-by-sentence explanations along with grammar insights and
              related vocabulary to enhance your learning experience.
            </p>
          </div>

          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <ReadingCards />
          </div>
        </div>
      </div>
    </>
  );
}
