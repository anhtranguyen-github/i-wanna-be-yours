"use client";

//http://localhost:3000/content/grammar_dashboard/JLPT_N3/10

import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlayCircle } from "@fortawesome/free-solid-svg-icons";

import GrammarHead from "@/components/GrammarHead";

import "./GrammarCard.css";

import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import Typography from "@mui/material/Typography";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

import axios from "axios";

type GrammarCardProps = {
  _id: any;
  title: string;
  short_explanation: string;
  long_explanation: string;
  formation: string;
  p_tag: string;
  s_tag: any;
  examples: {
    jp: string;
    romaji: string;
    en: string;
    grammar_audio: string;
  }[];
};

const GrammarDashboard = ({
  params,
}: {
  params: { slug: string; id: string };
}) => {
  /* eslint-disable react-hooks/exhaustive-deps */
  const p_dashboardId = params.slug;
  const s_dashboardId = params.id;

  const [grammarCardData, setGrammarCardData] = useState<GrammarCardProps[]>(
    []
  );
  const [filteredData, setFilteredData] = useState<GrammarCardProps[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Search logic
  useEffect(() => {
    if (!grammarCardData) return;
    const lowerTerm = searchTerm.toLowerCase();
    const filtered = grammarCardData.filter((card) => {
      return (
        card.title.toLowerCase().includes(lowerTerm) ||
        card.short_explanation.toLowerCase().includes(lowerTerm) ||
        card.examples.some(
          (ex) =>
            ex.jp.toLowerCase().includes(lowerTerm) ||
            ex.en.toLowerCase().includes(lowerTerm)
        )
      );
    });
    setFilteredData(filtered);
  }, [searchTerm, grammarCardData]);

  useEffect(() => {
    async function fetchData() {
      let apiUrl;
      if (process.env.REACT_APP_HOST_IP) {
        apiUrl = `http://${process.env.REACT_APP_HOST_IP}/e-api/v1/grammars?p_tag=${p_dashboardId}&s_tag=${s_dashboardId}`;
      } else {
        apiUrl = `/e-api/v1/grammars?p_tag=${p_dashboardId}&s_tag=${s_dashboardId}`;
      }

      try {
        const response = await axios.get<{ grammars: GrammarCardProps[] }>(
          apiUrl
        );

        if (response.data.grammars) {
          setGrammarCardData(response.data.grammars);
          setFilteredData(response.data.grammars);
        } else {
          setGrammarCardData([]);
          setFilteredData([]);
        }
        setError(null);
        setLoading(false);
      } catch (err) {
        setError(err as Error);
        setLoading(false);
      }
    }
    fetchData();
  }, [p_dashboardId, s_dashboardId]);

  return (
    <div className="min-h-screen bg-brand-dark/95 text-white p-6 md:p-12">
      <div className="max-w-4xl mx-auto">
        <GrammarHead />




        {/* Header & Search */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-10 gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-white mb-2">
              Grammar List
            </h1>
            <p className="text-white/60 text-sm max-w-md">
              Browse and study grammar points for this level.
            </p>
          </div>

          <div className="relative w-full md:w-auto">
            <input
              type="text"
              placeholder="Search grammars..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full md:w-80 bg-white/5 border border-white/10 rounded-full px-5 py-3 pl-10 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-brand-blue/50 focus:border-transparent transition-all backdrop-blur-sm"
            />
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 absolute left-3 top-3.5 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-blue"></div>
          </div>
        ) : error ? (
          <div className="bg-red-500/10 border border-red-500/20 text-red-200 p-6 rounded-xl text-center">
            <p>Failed to load data. Please try again later.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredData.length > 0 ? (
              filteredData.map((grammarPoint, index) => (
                <AccordionGrammarCard key={index} {...grammarPoint} />
              ))
            ) : (
              <div className="text-center py-12 text-white/30 italic">
                No grammar points found matching "{searchTerm}"
              </div>
            )}

          </div>
        )}
      </div>
    </div>
  );
};

export default GrammarDashboard;

const GrammarCard: React.FC<GrammarCardProps> = (props) => {
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      if (audio) {
        audio.pause();
      }
    };
  }, [audio]);

  const handlePlayAudio = (audioSrc: string) => {
    if (audio) {
      audio.pause();
    }

    const newAudio = new Audio(audioSrc);
    newAudio.play();
    setAudio(newAudio);
  };

  return (
    <div className="p-6 text-neutral-ink">

      {/* Short Explanation */}
      <div className="mb-6 bg-white/5 p-4 rounded-lg border border-white/5">
        <div className="text-xs uppercase tracking-widest text-brand-blue mb-1 font-bold">Explanation</div>
        <div className="text-lg leading-relaxed">{props.short_explanation}</div>
      </div>

      {/* Formation */}
      <div className="mb-6">
        <div className="text-xs uppercase tracking-widest text-white/50 mb-2 font-bold">Formation</div>
        <div className="font-mono text-sm bg-black/20 p-3 rounded text-green-300 border border-white/5 whitespace-pre-wrap">
          {props.formation}
        </div>
      </div>


      {/* Examples */}
      <div className="mb-6">
        <div className="text-xs uppercase tracking-widest text-white/50 mb-3 font-bold">Examples</div>
        <div className="space-y-3">
          {props.examples.map((example, index) => (
            <div key={index} className="group flex items-start space-x-4 p-3 hover:bg-white/5 rounded-lg transition-colors border border-transparent hover:border-white/5">
              <button
                onClick={() => handlePlayAudio(example.grammar_audio)}
                className="flex-shrink-0 mt-1 text-brand-blue hover:text-white transition-colors"
              >
                <FontAwesomeIcon icon={faPlayCircle} className="text-2xl" />
              </button>
              <div>
                <div className="text-lg font-jp font-medium text-white mb-1 group-hover:text-blue-100 transition-colors">
                  {example.jp}
                </div>
                <div className="text-xs text-white/40 italic mb-1">
                  {example.romaji}
                </div>
                <div className="text-sm text-neutral-ink">
                  {example.en}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {props.long_explanation && (
        <div className="mt-6 pt-6 border-t border-white/10">
          <div className="text-xs uppercase tracking-widest text-white/50 mb-2 font-bold">Detailed Note</div>
          <div className="text-sm text-neutral-ink leading-relaxed max-h-40 overflow-y-auto custom-scrollbar pr-2">
            {props.long_explanation}
          </div>
        </div>
      )}
    </div>
  );
};

const AccordionGrammarCard: React.FC<GrammarCardProps> = (props) => {
  return (
    <Accordion
      sx={{
        backgroundColor: "rgba(255, 255, 255, 0.03)",
        backdropFilter: "blur(12px)",
        borderRadius: "12px !important",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        marginBottom: "16px",
        color: "white",
        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
        overflow: "hidden",
        "&:before": {
          display: "none",
        },
        "&.Mui-expanded": {
          margin: "0 0 16px 0",
          backgroundColor: "rgba(255, 255, 255, 0.06)",
          borderColor: "rgba(255, 255, 255, 0.15)",
        }
      }}
    >
      <AccordionSummary
        expandIcon={<ExpandMoreIcon sx={{ color: "rgba(255,255,255,0.5)" }} />}
        aria-controls="panel1a-content"
        id="panel1a-header"
        sx={{
          "& .MuiAccordionSummary-content": {
            margin: "16px 0",
          }
        }}
      >
        <Typography sx={{ fontWeight: 600, fontSize: '1.1rem', letterSpacing: '0.01em' }}>
          {props.title}
        </Typography>
      </AccordionSummary>
      <AccordionDetails sx={{ padding: 0 }}>
        <GrammarCard {...props} />
      </AccordionDetails>
    </Accordion>
  );
};

// the _id is from mongodb api response
// const grammarCardData: GrammarCardProps[] = [
//   {
//     _id: "64503724544eb35093176707",
//     title: "～としたら (〜to shitara)",
//     short_explanation:
//       "Express a hypothetical situation; 'if', 'suppose', 'assuming'.",
//     long_explanation:
//       "Express a hypothetical situation; 'if', 'suppose', 'assuming'. Express a hypothetical situation; 'if', 'suppose', 'assuming'. Express a hypothetical situation; 'if', 'suppose', 'assuming'. Express a hypothetical situation; 'if', 'suppose', 'assuming'.",
//     formation:
//       "Verb-casual + としたら\nい-Adjective + としたら\nな-Adjective + だとしたら\nNoun + だとしたら",
//     examples: [
//       {
//         jp: "明日雨が降るとしたら、傘を持って行きましょう。",
//         romaji: "Ashita ame ga furu to shitara, kasa wo motte ikimashou.",
//         en: "If it rains tomorrow, let's bring an umbrella.",
//         grammar_audio:
//           "/audio/grammar/s_としたらtoshitara_20230501_明日雨が降るとしたら傘を持って行きましょう.mp3",
//       },
//       {
//         jp: "このケーキが美味しくないとしたら、誰も食べないでしょう。",
//         romaji: "Kono keeki ga oishikunai to shitara, daremo tabenai deshou.",
//         en: "If this cake is not delicious, nobody will eat it.",
//         grammar_audio:
//           "/audio/grammar/s_としたらtoshitara_20230501_このケーキが美味しくないとしたら誰も食べないでしょう.mp3",
//       },
//       {
//         jp: "彼が病気だとしたら、すぐに病院に行かせてあげてください。",
//         romaji:
//           "Kare ga byouki da to shitara, sugu ni byouin ni ikasete agete kudasai.",
//         en: "If he is sick, please take him to the hospital right away.",
//         grammar_audio:
//           "/audio/grammar/s_としたらtoshitara_20230501_彼が病気だとしたらすぐに病院に行かせてあげてください.mp3",
//       },
//       {
//         jp: "彼女が学生だとしたら、このレストランは割引があるでしょう。",
//         romaji:
//           "Kanojo ga gakusei da to shitara, kono resutoran wa waribiki ga aru deshou.",
//         en: "If she is a student, there will be a discount at this restaurant.",
//         grammar_audio:
//           "/audio/grammar/s_としたらtoshitara_20230501_彼女が学生だとしたらこのレストランは割引があるでしょう.mp3",
//       },
//     ],
//     p_tag: "JLPT_N3",
//     s_tag: "100",
//   },
// ];
