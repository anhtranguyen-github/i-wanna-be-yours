import GrammarTitles from "@/components/GrammarTitles";

export default async function Page() {

  return (
    <div className="mx-auto max-w-screen-xl">
      {/* <p>{data.titles}</p> */}

      <h1 className="text-3xl font-bold mb-4 px-5" style={{ color: 'hsl(var(--primary))' }}>
        Japanese grammar JLPT N5-N1:
      </h1>

      <GrammarTitles lang="Japanese" pTag="JLPT_N5" slug="/knowledge-base/grammar" />
      <GrammarTitles lang="Japanese" pTag="JLPT_N4" slug="/knowledge-base/grammar" />
      <GrammarTitles lang="Japanese" pTag="JLPT_N3" slug="/knowledge-base/grammar" />
      <GrammarTitles lang="Japanese" pTag="JLPT_N2" slug="/knowledge-base/grammar" />
      <GrammarTitles lang="Japanese" pTag="JLPT_N1" slug="/knowledge-base/grammar" />
    </div>
  );
}

const encodeTitle = (title: string) => {
  return encodeURIComponent(title);
};

