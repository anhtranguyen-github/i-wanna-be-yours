"use client";

import useSWR from "swr";
import { FC, useState, useRef, Fragment, useEffect } from "react";
import { Dialog, Transition } from "@headlessui/react";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlayCircle,
  faArrowLeft,
  faArrowRight,
} from "@fortawesome/free-solid-svg-icons";
import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/24/solid";
import ClosedFlashcard from "@/components/ClosedFlashcard";

/* -------------------------------------------------------------------
   Type Definitions
   ------------------------------------------------------------------- */
interface Example {
  jp: string;
  romaji: string;
  en: string;
  grammar_audio: string;
}

interface GrammarData {
  title: string;
  short_explanation: string;
  long_explanation: string;
  formation: string;
  examples: Example[];
  userId?: string;
  difficulty?: string;
  p_tag?: string;
  s_tag?: string;
  // Add additional fields if needed (e.g., _id, __v, etc.)
}

interface GrammarFlashcardModalProps {
  userId: string;
  collectionName: string; // likely "grammars"
  p_tag: string;
  s_tag: string;
  deckId?: string;
}

/* -------------------------------------------------------------------
   GrammarFlashcardModal Component
   ------------------------------------------------------------------- */
const GrammarFlashcardModal: FC<GrammarFlashcardModalProps> = ({
  userId,
  collectionName,
  p_tag,
  s_tag,
  deckId,
}) => {
  /* ----------------- State & Refs ------------------ */
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [shouldFetchData, setShouldFetchData] = useState<boolean>(false);
  const [isFetching, setIsFetching] = useState<boolean>(false);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [difficulty, setDifficulty] = useState<string | null>(null);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);

  const flipCard = () => setIsFlipped(!isFlipped);
  const resetFlip = () => setIsFlipped(false);

  /* Construct the endpoint for combining dynamic user data with static grammar data */
  const apiUrl = `/f-api/v1/combine-flashcard-data-grammars?userId=${userId}&collectionName=${collectionName}&p_tag=${p_tag}&s_tag=${s_tag}`;

  /* SWR fetcher function */
  const fetcher = (url: string) =>
    fetch(url)
      .then((res) => res.json())
      // For grammar data, the endpoint returns an array directly (no "words" key).
      .then((data) => data as GrammarData[]);

  /* Use SWR to fetch grammar data */
  const { data: grammarItems, error } = useSWR<GrammarData[]>(
    shouldFetchData ? apiUrl : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      refreshInterval: 0,
      onSuccess: () => setIsFetching(false),
      onError: () => setIsFetching(false),
    }
  );

  /* Current grammar item */
  const currentGrammar = grammarItems?.[currentIndex];

  /* -------------- Modal Controls -------------- */

  function closeModal() {
    setIsOpen(false);
    // Reset shouldFetchData so a fresh fetch occurs next time
    setShouldFetchData(false);
  }

  function openModal() {
    setIsOpen(true);
    setShouldFetchData(true);
    setIsFetching(true);
  }

  /* -------------- Flashcard Navigation -------------- */
  const handleNext = () => {
    saveFlashcardState();
    if (!grammarItems) return;
    setCurrentIndex((prevIndex) =>
      prevIndex === grammarItems.length - 1 ? 0 : prevIndex + 1
    );
  };

  const handlePrevious = () => {
    saveFlashcardState();
    if (!grammarItems) return;
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? grammarItems.length - 1 : prevIndex - 1
    );
  };

  /* -------------- Difficulty ---------------- */
  const handleDifficultySelection = async (selectedDifficulty: string) => {
    // Save the difficulty and move to next card in one action
    if (currentGrammar && userId) {
      try {
        const grammar_s_tag = currentGrammar.s_tag ?? s_tag;
        const grammar_p_tag = currentGrammar.p_tag ?? p_tag;

        await axios.post(`/f-api/v1/flashcard`, {
          userId: userId,
          difficulty: selectedDifficulty,
          collectionName: collectionName,
          title: currentGrammar.title,
          p_tag: grammar_p_tag,
          s_tag: grammar_s_tag,
        });
      } catch (error) {
        console.log("Failed to store grammar flashcard state:", error);
      }
    }

    // Reset flip and move to next card
    resetFlip();
    if (grammarItems) {
      setCurrentIndex((prevIndex) =>
        prevIndex === grammarItems.length - 1 ? 0 : prevIndex + 1
      );
    }
  };

  /* -------------- Persist Flashcard State -------------- */

  const saveFlashcardState = async () => {
    // Only attempt to save if we have a difficulty selected and a current grammar item
    if (!userId || !currentGrammar || !difficulty) return;

    try {
      // If the static doc has its own s_tag, use it; otherwise, fallback to the s_tag from props.
      const grammar_s_tag = currentGrammar.s_tag ?? s_tag;
      const grammar_p_tag = currentGrammar.p_tag ?? p_tag;

      await axios.post(`/f-api/v1/flashcard`, {
        userId: userId,
        difficulty,
        collectionName: collectionName,
        title: currentGrammar.title,
        p_tag: grammar_p_tag,
        s_tag: grammar_s_tag,
      });
    } catch (error) {
      console.log("Failed to store grammar flashcard state:", error);
    } finally {
      setDifficulty(null);
    }
  };

  /* -------------- Rendering -------------- */
  if (error) return <div>Failed to load grammar data.</div>;

  if (!isOpen) {
    return (
      <ClosedFlashcard
        title={p_tag.replace('JLPT_', '') + ' Grammar'}
        subtitle={s_tag}
        tags={['grammar', p_tag.toLowerCase().replace('jlpt_', '')]}
        description="Explore essential Japanese grammar interactively."
        openModal={openModal}
        buttonText="Open Flashcard"
        detailLink={deckId ? `/flashcards/details/${deckId}` : `/flashcards/details/${collectionName}/${p_tag}/${s_tag}`}
      />
    );
  }

  // If the modal is open but data is still fetching:
  if (isFetching || !grammarItems) return <div>Loading grammar data...</div>;

  // If no grammar items were found
  if (grammarItems.length === 0) {
    return (
      <div>
        <button onClick={() => setIsOpen(false)}>Close</button>
        <p>
          No grammar items found for {p_tag} / {s_tag}
        </p>
      </div>
    );
  }

  // Current grammar item must exist at this point
  if (!currentGrammar) {
    return <div>Loading current grammar card...</div>;
  }

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog
        as="div"
        className="relative z-50"
        open={isOpen}
        onClose={() => { }}
      >
        {/* Overlay */}
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div
            className="fixed inset-0 bg-gray-600 bg-opacity-40"
            onClick={closeModal}
          />
        </Transition.Child>

        {/* Modal Container */}
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 scale-95 translate-y-4"
              enterTo="opacity-100 scale-100 translate-y-0"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 scale-100 translate-y-0"
              leaveTo="opacity-0 scale-95 translate-y-4"
            >
              {/* Fixed-size modal with responsive breakpoints */}
              <Dialog.Panel
                className="relative transform w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-2xl h-[85vh] max-h-[700px] overflow-hidden rounded-[2.5rem] bg-white p-4 sm:p-8 text-left shadow-2xl transition-all border border-slate-100"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="h-full flex flex-col">
                  {/* Close button */}
                  <button
                    onClick={closeModal}
                    className="absolute right-3 top-3 text-neutral-ink hover:text-neutral-ink dark:hover:text-neutral-ink z-10"
                  >
                    ✕
                  </button>

                  {/* Flip Card Container */}
                  <div
                    className="flex-1 min-h-0 cursor-pointer"
                    onClick={!isFlipped ? flipCard : undefined}
                    style={{ perspective: '1000px' }}
                  >
                    <div
                      className="relative w-full h-full transition-transform duration-500"
                      style={{
                        transformStyle: 'preserve-3d',
                        transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                      }}
                    >
                      {/* ===== FRONT SIDE - Fixed size ===== */}
                      <div
                        className="absolute inset-0 w-full h-full bg-white rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-slate-100 flex flex-col items-center justify-center p-6 sm:p-12 overflow-hidden"
                        style={{ backfaceVisibility: 'hidden' }}
                      >
                        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2" />
                        <div className="text-center relative z-10">
                          <div className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em] mb-12 font-display italic">Spectral Signature</div>
                          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-neutral-ink mb-8 tracking-tighter italic">
                            {currentGrammar.title}
                          </h2>
                          <p className="text-sm sm:text-base md:text-lg font-bold text-neutral-ink italic max-w-md mx-auto leading-relaxed">
                            {currentGrammar.short_explanation}
                          </p>
                        </div>
                      </div>

                      {/* ===== BACK SIDE - Fixed size with scroll ===== */}
                      <div
                        className="absolute inset-0 w-full h-full bg-white rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-slate-100 flex flex-col overflow-hidden"
                        style={{
                          backfaceVisibility: 'hidden',
                          transform: 'rotateY(180deg)',
                        }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />

                        {/* Header - Fixed */}
                        <div className="flex-shrink-0 p-8 sm:p-10 border-b border-slate-50 bg-slate-50/30 relative z-10">
                          <h2 className="text-2xl sm:text-3xl font-black text-neutral-ink tracking-tight italic">
                            {currentGrammar.title}
                          </h2>
                          <p className="mt-2 text-sm font-bold text-neutral-ink italic">
                            {currentGrammar.short_explanation}
                          </p>
                        </div>

                        {/* Content - Scrollable */}
                        <div className="flex-1 min-h-0 overflow-y-auto p-8 sm:p-10 space-y-8 custom-scrollbar relative z-10">
                          <div className="w-full rounded-[2rem] bg-slate-50 p-6 border border-slate-100 shadow-sm">
                            <h3 className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-3">
                              Formation Matrix
                            </h3>
                            <p className="text-sm sm:text-base text-neutral-ink font-bold font-jp">
                              {currentGrammar.formation}
                            </p>
                          </div>

                          <div className="w-full rounded-[2rem] bg-slate-50 p-6 border border-slate-100 shadow-sm">
                            <h3 className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-3">
                              Detailed Logic
                            </h3>
                            <p className="text-sm sm:text-base text-slate-600 font-medium leading-relaxed">
                              {currentGrammar.long_explanation}
                            </p>
                          </div>

                          <ExampleSection examples={currentGrammar.examples} />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Navigation & Difficulty - Fixed bottom */}
                  <div className="flex-shrink-0 pt-4 sm:pt-6 space-y-3">
                    {isFlipped ? (
                      <div className="flex flex-col items-center space-y-3">
                        <span className="text-xs sm:text-sm font-semibold text-neutral-ink dark:text-neutral-ink">
                          How well did you know this?
                        </span>
                        <div className="flex flex-wrap justify-center gap-2">
                          <button
                            className="py-2 px-4 sm:py-3 sm:px-6 rounded-xl font-bold text-xs sm:text-sm bg-red-100 hover:bg-red-200 text-red-700 transition-colors"
                            onClick={() => handleDifficultySelection("hard")}
                          >
                            😓 Hard
                          </button>
                          <button
                            className="py-2 px-4 sm:py-3 sm:px-6 rounded-xl font-bold text-xs sm:text-sm bg-yellow-100 hover:bg-yellow-200 text-yellow-700 transition-colors"
                            onClick={() => handleDifficultySelection("medium")}
                          >
                            🤔 Medium
                          </button>
                          <button
                            className="py-2 px-4 sm:py-3 sm:px-6 rounded-xl font-bold text-xs sm:text-sm bg-green-100 hover:bg-green-200 text-green-700 transition-colors"
                            onClick={() => handleDifficultySelection("easy")}
                          >
                            😊 Easy
                          </button>
                        </div>

                        <button
                          onClick={() => {
                            resetFlip();
                            handleNext();
                          }}
                          className="text-xs sm:text-sm text-neutral-ink hover:text-neutral-ink"
                        >
                          Skip without rating
                        </button>
                      </div>
                    ) : (
                      <div className="flex justify-center">
                        <button
                          onClick={flipCard}
                          className="px-6 py-2 sm:px-8 sm:py-3 bg-brand-salmon hover:bg-brand-salmon/90 text-white font-bold rounded-xl transition-colors text-sm sm:text-base"
                        >
                          Show Answer
                        </button>
                      </div>
                    )}

                    {/* Card counter */}
                    <div className="text-xs sm:text-sm text-neutral-ink text-center">
                      {currentIndex + 1} / {grammarItems?.length || 0}
                    </div>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
};

export default GrammarFlashcardModal;

/* -------------------------------------------------------------------
 ExampleSection - displays the grammar examples (jp, romaji, en)
 ------------------------------------------------------------------- */
interface ExampleSectionProps {
  examples: Example[];
}

const ExampleSection: FC<ExampleSectionProps> = ({ examples }) => {
  const [openStates, setOpenStates] = useState<{ [key: number]: boolean }>({});

  const toggleOpenState = (index: number) => {
    setOpenStates((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const playExampleAudio = (url: string) => {
    const audio = new Audio(url);
    audio.play();
  };

  return (
    <div className="flex flex-col space-y-6">
      <h3 className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
        Operational Contexts
      </h3>
      {examples.map((ex, i) => (
        <div
          key={i}
          className="rounded-[2rem] border border-slate-100 bg-slate-50/50 p-6 shadow-sm hover:shadow-md hover:bg-white transition-all group/ex"
        >
          <div className="flex items-center justify-between gap-4">
            {/* JP Sentence */}
            <div className="text-xl font-bold text-neutral-ink font-jp leading-relaxed group-hover/ex:text-primary transition-colors">{ex.jp}</div>

            {/* Audio + expand button */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => playExampleAudio(ex.grammar_audio)}
                className="w-10 h-10 rounded-xl bg-white border border-slate-100 text-slate-300 hover:text-primary hover:border-primary/20 flex items-center justify-center transition-all shadow-sm"
              >
                <FontAwesomeIcon
                  icon={faPlayCircle}
                  className="h-5 w-5"
                />
              </button>
              <button
                onClick={() => toggleOpenState(i)}
                className="w-10 h-10 rounded-xl bg-white border border-slate-100 text-slate-300 hover:text-primary hover:border-primary/20 flex items-center justify-center transition-all shadow-sm"
              >
                {openStates[i] ? (
                  <ChevronUpIcon className="h-5 w-5" />
                ) : (
                  <ChevronDownIcon className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          {/* Romaji & English */}
          {openStates[i] && (
            <div className="mt-4 space-y-2 text-sm animate-in slide-in-from-top-2 duration-300">
              <div className="text-neutral-ink font-medium italic">{ex.romaji}</div>
              <div className="text-slate-600 font-bold italic">{ex.en}</div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
