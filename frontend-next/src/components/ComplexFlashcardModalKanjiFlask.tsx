"use client";

import useSWR from "swr";
import { FC, useState, useRef, Fragment, useEffect } from "react";
import { Dialog, Transition } from "@headlessui/react"; // https://headlessui.com/react/dialog
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlayCircle,
  faArrowLeft,
  faArrowRight,
  faGear,
  faShuffle,
  faRotate
} from "@fortawesome/free-solid-svg-icons";
import ClosedFlashcard from "@/components/ClosedFlashcard";


interface Question {
  _id: string;
  audio: string;
  difficulty: string;
  exampleReading: string;
  exampleWord: string;
  k_audio: string;
  kanji: string;
  p_tag: string;
  reading: string;
  s_tag: string;
  translation: string;
  userEmail: string;
  userId: string;
}

interface ComplexFlashcardProps {
  questions: Question[];
}

interface ComplexFlashcardModalProps {
  userId: string;
  collectionName: string;
  p_tag: string;
  s_tag: string;
  deckId?: string;
  deckTitle?: string;
  deckDescription?: string;
}

const ComplexFlashcardModal: FC<ComplexFlashcardModalProps> = ({
  userId,
  collectionName,
  p_tag,
  s_tag,
  deckId,
  deckTitle,
  deckDescription,
}) => {
  const [count, setCount] = useState<number>(0);
  let [isOpen, setIsOpen] = useState(false);
  const [shouldFetchData, setShouldFetchData] = useState(false);
  const [isFetching, setIsFetching] = useState(false); // To track fetching status

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [difficulty, setDifficulty] = useState<string | null>(null);

  // Settings State
  const [settings, setSettings] = useState({
    mode: 'learn' as 'basic' | 'learn',
    shuffle: false,
    defaultSide: 'front' as 'front' | 'back',
  });
  const [showSettings, setShowSettings] = useState(false);
  const [displayQuestions, setDisplayQuestions] = useState<Question[]>([]);
  const [reviewedCards, setReviewedCards] = useState<Set<number>>(new Set());

  const audioRef = useRef<HTMLAudioElement>(null);

  const fetcher = (...args: Parameters<typeof fetch>) =>
    fetch(...args).then((res) => res.json());

  // --------------------------------------------------------------------------------------------------------------------------------

  let apiUrl;

  // Adjust URLs based on the presence of userId
  if (userId) {
    apiUrl = `/f-api/v1/combine-flashcard-data-${collectionName}?userId=${userId}&collectionName=${collectionName}&p_tag=${p_tag}&s_tag=${s_tag}`;
  } else {
    apiUrl = `/e-api/v1/${collectionName}?p_tag=${p_tag}&s_tag=${s_tag}`;
  }

  // --------------------------------------------------------------------------------------------------------------------------------

  //const { data: questions, error } = useSWR<Question[]>(apiUrl, fetcher);

  // `enabled: shouldFetchData` controls when the SWR hook fetches data
  //const { data: questions, error } = useSWR<Question[]>(shouldFetchData ? apiUrl : null, fetcher);

  const { data: questions, error } = useSWR<Question[]>(
    shouldFetchData ? apiUrl : null,
    fetcher,
    {
      revalidateOnFocus: false, // Disable revalidation on window focus
      revalidateOnReconnect: false, // Disable revalidation on network reconnect
      refreshInterval: 0, // Disable automatic revalidation with an interval
      onSuccess: () => setIsFetching(false), // Set fetching to false when data is successfully fetched
      onError: () => setIsFetching(false),
    }
  );



  console.log(questions);

  // Handle Questions Update and Shuffling
  useEffect(() => {
    if (questions) {
      let q = [...questions];
      if (settings.shuffle) {
        // Fisher-Yates shuffle
        for (let i = q.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [q[i], q[j]] = [q[j], q[i]];
        }
      }
      setDisplayQuestions(q);
      setCurrentQuestionIndex(0);
      setReviewedCards(new Set());
    }
  }, [questions, settings.shuffle]);

  const currentQuestion = displayQuestions?.[currentQuestionIndex];

  /* ----------------- State ------------------ */
  const [hasRevealed, setHasRevealed] = useState(false); // Track if answer has been revealed for current card

  const [isFlipped, setIsFlipped] = useState(false); // State to track card flip

  const flipCard = () => {
    if (!isFlipped && !hasRevealed) {
      setHasRevealed(true);
    }
    setIsFlipped(!isFlipped);
  };

  const resetFlip = () => {
    setIsFlipped(settings.defaultSide === 'back');
    setHasRevealed(false);
  };

  // Re-apply default side when setting changes
  useEffect(() => {
    setIsFlipped(settings.defaultSide === 'back');
  }, [settings.defaultSide]);

  // Handle index change explicitly
  useEffect(() => {
    setHasRevealed(false);
  }, [currentQuestionIndex]);

  // Re-apply default side when setting changes or index changes
  // useEffect(() => {
  //   setIsFlipped(settings.defaultSide === 'back');
  // }, [currentQuestionIndex, settings.defaultSide]);

  // Function to save flashcard state to the backend
  const saveFlashcardState = async () => {
    // Ensure userId exists before proceeding
    if (!userId) {
      console.error("saveFlashcardState: No userId provided.");
      return; // Exit the function early if userId is not provided
    }

    if (difficulty && currentQuestion && userId) {
      try {
        console.log("mocking saving post call for userId");
        //await axios.post(`${baseUrl}/f-api/v1/flashcard`, {
        await axios.post(`/f-api/v1/flashcard`, {
          userId: userId,
          difficulty,
          collectionName: collectionName,
          kanji: currentQuestion.kanji,
          p_tag,
          s_tag,
        });
      } catch (error) {
        console.log("Failed to store flashcard state:", error);
      } finally {
        setDifficulty(null);
      }
    } else {
      // Log a message if the conditions for making the POST request are not met
      console.log(
        "saveFlashcardState: Insufficient data provided (missing difficulty or currentQuestion)."
      );
    }
  };

  const handleNextQuestion = () => {
    if (questions) {
      saveFlashcardState();
      setCurrentQuestionIndex((prevIndex) =>
        prevIndex === questions.length - 1 ? 0 : prevIndex + 1
      );
    }
  };

  const handlePreviousQuestion = () => {
    if (questions) {
      saveFlashcardState();
      setCurrentQuestionIndex((prevIndex) =>
        prevIndex === 0 ? questions.length - 1 : prevIndex - 1
      );
    }
  };

  // -------------------------------------------------------------

  const handleDifficultySelection = async (selectedDifficulty: string) => {
    // Save the difficulty and move to next card in one action
    if (currentQuestion && userId) {
      try {
        await axios.post(`/f-api/v1/flashcard`, {
          userId: userId,
          difficulty: selectedDifficulty,
          collectionName: collectionName,
          kanji: currentQuestion.kanji,
          p_tag,
          s_tag,
        });
      } catch (error) {
        console.log("Failed to store flashcard state:", error);
      }
    }

    // Reset flip and move to next card
    resetFlip();
    if (displayQuestions) {
      const nextIndex = currentQuestionIndex + 1;
      setReviewedCards(prev => new Set(prev).add(currentQuestionIndex));
      setCurrentQuestionIndex((prevIndex) =>
        prevIndex === displayQuestions.length - 1 ? 0 : prevIndex + 1
      );
    }
  };

  const handlePlayAudio = () => {
    if (audioRef.current) {
      audioRef.current.play();
    }
  };

  const playKanjiAudio = () => {
    if (currentQuestion && currentQuestion.k_audio) {
      // Ensure currentQuestion and its k_audio property are defined
      const audio = new Audio(currentQuestion.k_audio);
      audio.play();
    } else {
      // Handle the case where currentQuestion or k_audio is not available
      console.log("Audio URL is missing or the current question is undefined.");
      // Optionally, you might want to alert the user or handle this case more gracefully
    }
  };

  function closeModal() {
    setIsOpen(false);
    // Optionally reset `shouldFetchData` here if you want to refetch data every time the modal opens
    setShouldFetchData(false);
  }

  function openModal() {
    setIsOpen(true);
    setShouldFetchData(true);
    setIsFetching(true); // Start fetching data
    setReviewedCards(new Set());
  }

  const toggleSettings = () => setShowSettings(!showSettings);

  // ------------------------------------------------------------------------

  if (error) return <div>Failed to load</div>;

  // if (!isOpen)
  //   return (
  //     <div className=" p-2 bg-white dark:bg-gray-800 rounded-lg shadow transition-shadow duration-300 ease-in-out hover:">
  //       <div className="text-sm md:text-md lg:text-lg font-semibold text-neutral-ink dark:text-neutral-ink uppercase tracking-widest">
  //         Level: {p_tag}
  //       </div>
  //       <p>Kanji with one reading {s_tag}</p>
  //       <p className="mt-1 text-sm text-neutral-ink dark:text-neutral-ink">
  //         Explore the kanji readings interactively.
  //       </p>
  //       <button
  //         type="button"
  //         onClick={openModal}
  //         className="mt-2 inline-flex items-center justify-center rounded-md bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-gray-500 dark:focus:ring-gray-600 text-neutral-ink dark:text-neutral-ink text-sm px-3 py-1.5 transition-colors duration-150"
  //       >
  //         Open flashcard
  //       </button>
  //     </div>
  //   );


  if (!isOpen) {

    return (
      <ClosedFlashcard
        title={deckTitle || "Kanji Practice"}
        subtitle={s_tag}
        tags={['kanji', p_tag.toLowerCase().replace('jlpt_', '')]} // Derive tags from props
        description={deckDescription || "Explore kanji readings."}
        openModal={openModal}
        onMouseEnter={() => setShouldFetchData(true)}
        buttonText="Start Session"
        detailLink={deckId ? `/flashcards/details/${deckId}` : `/flashcards/details/kanji/${p_tag}/${s_tag}`} // Generated Link
      />
    );
  }














  const isLoading = !displayQuestions || displayQuestions.length === 0;

  if (isLoading && isFetching) return <div>Loading...</div>;
  if (!isLoading && displayQuestions.length === 0) return <div>No cards found.</div>;

  if (!currentQuestion) {
    // Render a loading state or nothing until the data is available
    return <div>Loading...</div>;
  }

  return (
    <div>
      <Transition.Root show={isOpen} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-50"
          open={isOpen}
          onClose={() => { }}
        >
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              onClick={() => setIsOpen(false)}
            />
          </Transition.Child>

          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-screen items-center justify-center p-4 z-50">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 translate-y-4 scale-95"
                enterTo="opacity-100 translate-y-0 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 translate-y-0 scale-100"
                leaveTo="opacity-0 translate-y-4 scale-95"
              >
                {/* Fixed-size modal with responsive breakpoints */}
                <Dialog.Panel
                  className="relative transform w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-2xl h-[85vh] max-h-[700px] overflow-hidden rounded-[2.5rem] bg-white p-4 sm:p-8 text-left  transition-all z-50 border border-slate-100 flex flex-col"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="h-full flex flex-col">
                    {/* Header Controls */}
                    <div className="flex justify-between items-center mb-4 z-10">
                      <button
                        onClick={() => setIsOpen(false)}
                        className="text-sm font-bold text-neutral-ink hover:text-neutral-ink dark:text-neutral-ink dark:hover:text-neutral-ink transition-colors"
                      >
                        Close Deck
                      </button>

                      <div className="flex items-center gap-4">
                        {/* Settings Button */}
                        <button
                          onClick={toggleSettings}
                          className="text-neutral-ink hover:text-neutral-ink dark:hover:text-neutral-ink p-1"
                        >
                          <FontAwesomeIcon icon={faGear} className="w-5 h-5" />
                        </button>
                      </div>
                    </div>

                    {/* Settings Panel */}
                    {showSettings && (
                      <div className="absolute top-16 right-8 z-20 w-72 bg-white rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-slate-100 p-6 animate-in fade-in slide-in-from-top-5">
                        <h3 className="font-black text-neutral-ink text-xs uppercase tracking-widest mb-4 border-b pb-3 border-slate-50 italic">Registry Calibration</h3>

                        <div className="space-y-6">
                          {/* Mode Toggle */}
                          <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-black text-neutral-ink uppercase tracking-widest">Operation Mode</label>
                            <div className="flex bg-slate-50 rounded-2xl p-1.5 border border-slate-100">
                              <button
                                onClick={() => setSettings(s => ({ ...s, mode: 'basic' }))}
                                className={`flex-1 text-[10px] font-black uppercase tracking-widest py-2 rounded-xl transition-all ${settings.mode === 'basic' ? 'bg-white  text-primary' : 'text-neutral-ink hover:text-slate-600'}`}
                              >
                                Static
                              </button>
                              <button
                                onClick={() => setSettings(s => ({ ...s, mode: 'learn' }))}
                                className={`flex-1 text-[10px] font-black uppercase tracking-widest py-2 rounded-xl transition-all ${settings.mode === 'learn' ? 'bg-primary text-white ' : 'text-neutral-ink hover:text-slate-600'}`}
                              >
                                Neural
                              </button>
                            </div>
                          </div>

                          {/* Shuffle Toggle */}
                          <div className="flex items-center justify-between">
                            <label className="text-[10px] font-black uppercase tracking-widest text-neutral-ink">Randomize Order</label>
                            <button
                              onClick={() => setSettings(s => ({ ...s, shuffle: !s.shuffle }))}
                              className={`w-12 h-6 rounded-full relative transition-all ${settings.shuffle ? 'bg-primary' : 'bg-slate-100 border border-slate-200'}`}
                            >
                              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full  transition-all ${settings.shuffle ? 'left-7' : 'left-1'}`}></div>
                            </button>
                          </div>

                          {/* Default Side Toggle */}
                          <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-black text-neutral-ink uppercase tracking-widest">Initiation Side</label>
                            <div className="flex bg-slate-50 rounded-2xl p-1.5 border border-slate-100">
                              <button
                                onClick={() => setSettings(s => ({ ...s, defaultSide: 'front' }))}
                                className={`flex-1 text-[10px] font-black uppercase tracking-widest py-2 rounded-xl transition-all ${settings.defaultSide === 'front' ? 'bg-white  text-primary' : 'text-neutral-ink hover:text-slate-600'}`}
                              >
                                Front
                              </button>
                              <button
                                onClick={() => setSettings(s => ({ ...s, defaultSide: 'back' }))}
                                className={`flex-1 text-[10px] font-black uppercase tracking-widest py-2 rounded-xl transition-all ${settings.defaultSide === 'back' ? 'bg-white  text-primary' : 'text-neutral-ink hover:text-slate-600'}`}
                              >
                                Rear
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}



                    {/* -------------------- Flip Card Container ------------------- */}
                    <div
                      className="flex-1 min-h-0 cursor-pointer"
                      onClick={flipCard}
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
                            <span className="text-7xl sm:text-8xl md:text-9xl font-black text-neutral-ink block mb-12 font-jp tracking-tighter italic">
                              {currentQuestion.kanji}
                            </span>
                            <button
                              onClick={(e) => { e.stopPropagation(); playKanjiAudio(); }}
                              className="w-16 h-16 rounded-3xl bg-slate-50 border border-slate-100 text-neutral-ink hover:text-primary hover:border-primary/20 hover:bg-white flex items-center justify-center transition-all active:scale-90  mx-auto"
                            >
                              <FontAwesomeIcon
                                icon={faPlayCircle}
                                className="w-7 h-7"
                              />
                            </button>
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
                            <div className="flex items-center space-x-6">
                              <button
                                onClick={(e) => { e.stopPropagation(); playKanjiAudio(); }}
                                className="w-16 h-16 rounded-2xl bg-white border border-slate-100 text-neutral-ink hover:text-primary hover:border-primary/20 flex items-center justify-center transition-all active:scale-90 "
                              >
                                <FontAwesomeIcon
                                  icon={faPlayCircle}
                                  className="w-7 h-7"
                                />
                              </button>
                              <div className="flex-1 min-w-0">
                                <div className="text-2xl sm:text-3xl font-black text-neutral-ink truncate tracking-tight italic font-jp">
                                  {currentQuestion.reading}
                                </div>
                                <div className="text-sm font-bold text-neutral-ink mt-1 truncate italic">
                                  {currentQuestion.translation}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Content - Scrollable */}
                          <div className="flex-1 min-h-0 overflow-y-auto p-8 sm:p-10 custom-scrollbar relative z-10">
                            <div className="space-y-10">
                              <div className="flex justify-center">
                                <span className="text-8xl sm:text-9xl font-black text-neutral-ink font-jp tracking-tighter italic">
                                  {currentQuestion.kanji}
                                </span>
                              </div>

                              <div className="space-y-4">
                                <div className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em] font-display">Compound Pattern</div>
                                <div className="p-8 bg-slate-50 border border-slate-100 rounded-[2rem]  flex items-center justify-between group/comp">
                                  <div className="flex-1">
                                    <div className="text-3xl font-jp font-black text-neutral-ink mb-2 tracking-tighter italic">{currentQuestion.exampleWord}</div>
                                    <div className="text-base font-bold text-neutral-ink italic">{currentQuestion.exampleReading}</div>
                                  </div>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); handlePlayAudio(); }}
                                    className="w-12 h-12 rounded-xl bg-white border border-slate-100 text-slate-300 group-hover/comp:text-primary group-hover/comp:border-primary/20 flex items-center justify-center transition-all "
                                  >
                                    <FontAwesomeIcon icon={faPlayCircle} className="w-5 h-5" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* -------------------- Navigation & Difficulty - Fixed bottom ------------------- */}
                    <div className="flex-shrink-0 pt-4 sm:pt-6 space-y-3">
                      {settings.mode === 'basic' ? (
                        <div className="flex flex-col items-center space-y-3">
                          <div className="flex justify-center gap-4 w-full">
                            <button
                              onClick={(e) => { e.stopPropagation(); handlePreviousQuestion(); }}
                              className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-neutral-ink dark:text-neutral-ink hover:bg-gray-300 dark:hover:bg-gray-600"
                            >
                              <FontAwesomeIcon icon={faArrowLeft} /> Prev
                            </button>

                            {!isFlipped ? (
                              <button
                                onClick={(e) => { e.stopPropagation(); flipCard(); }}
                                className="flex-1 px-4 py-2 bg-brand-salmon text-white font-bold rounded-xl  hover:bg-brand-salmon/90 transition-colors"
                              >
                                Show Answer
                              </button>
                            ) : (
                              <button
                                onClick={(e) => { e.stopPropagation(); handleNextQuestion(); }}
                                className="flex-1 px-4 py-2 bg-blue-500 text-white font-bold rounded-xl  hover:bg-blue-600 transition-colors"
                              >
                                Next Card <FontAwesomeIcon icon={faArrowRight} className="ml-2" />
                              </button>
                            )}

                            <button
                              onClick={(e) => { e.stopPropagation(); handleNextQuestion(); }}
                              className="px-4 py-2 rounded-xl bg-slate-50 border border-slate-100 text-neutral-ink hover:text-primary hover:border-primary/20 transition-all font-display font-black text-[10px] uppercase tracking-widest italic"
                            >
                              <FontAwesomeIcon icon={faArrowRight} /> Next
                            </button>
                          </div>
                        </div>
                      ) : (
                        // Learn Mode (SRS)
                        <>
                          {hasRevealed ? (
                            <div className="flex flex-col items-center space-y-3">
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
                        </>
                      )}

                      {/* Card counter */}
                      <div className="text-xs sm:text-sm text-neutral-ink text-center">
                        {currentQuestionIndex + 1} / {displayQuestions?.length || 0}
                      </div>
                    </div>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition.Root>
    </div>
  );
};

export default ComplexFlashcardModal;
