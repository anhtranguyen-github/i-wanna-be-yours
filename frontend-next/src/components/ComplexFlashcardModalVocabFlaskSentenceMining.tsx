"use client";

import useSWR from "swr";
import { FC, useState, useRef, Fragment } from "react";
import { useEffect } from "react";
import { Dialog, Transition } from "@headlessui/react"; // https://headlessui.com/react/dialog
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlayCircle,
  faArrowLeft,
  faArrowRight,
} from "@fortawesome/free-solid-svg-icons";
import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/24/solid";
import ClosedFlashcard from "@/components/ClosedFlashcard";

interface Question {
  id: string;
  vocabulary_original: string;
  vocabulary_simplified: string;
  vocabulary_english: string;
  vocabulary_audio: string;
  word_type: string; // Optional, if you want to display the type of word (e.g., Verb)
  sentences: Array<{
    sentence_original: string;
    sentence_simplified?: string; // Optional if you sometimes have simplified versions
    sentence_romaji: string;
    sentence_english: string;
    sentence_audio: string;
    sentence_picture?: string; // Optional, if you have pictures for some sentences
  }>;
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
}

const ComplexFlashcardModal: FC<ComplexFlashcardModalProps> = ({
  userId,
  collectionName,
  p_tag,
  s_tag,
  deckId,
}) => {
  const [count, setCount] = useState<number>(0);
  let [isOpen, setIsOpen] = useState(false);
  const [shouldFetchData, setShouldFetchData] = useState(false);
  const [isFetching, setIsFetching] = useState(false); // To track fetching status

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [difficulty, setDifficulty] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement>(null);

  let apiUrl;

  // Adjust URLs based on the presence of userId
  if (userId) {
    //apiUrl = `/f-api/v1/combine-flashcard-data-${collectionName}?userId=${userId}&collectionName=${collectionName}&p_tag=${p_tag}&s_tag=${s_tag}`;

    // we have different endpoint for sentence mined data from text-parser
    apiUrl = `/f-api/v1/text-parser-words?userId=${userId}&collectionName=${collectionName}&p_tag=${p_tag}&s_tag=${s_tag}`;
  } else {
    apiUrl = `/e-api/v1/${collectionName}?p_tag=${p_tag}&s_tag=${s_tag}`;
  }

  const fetcher = (url: string) =>
    fetch(url)
      .then((res) => res.json())
      .then((data) => data.words); // Extract the words array from the response

  //const { data: questions, error } = useSWR<Question[]>(apiUrl, fetcher);
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

  const currentQuestion = questions?.[currentQuestionIndex];

  console.log("------------------------------------------");
  console.log(currentQuestion);

  const [isFlipped, setIsFlipped] = useState(false); // State to track card flip

  const flipCard = () => {
    setIsFlipped(!isFlipped);
  };

  const resetFlip = () => {
    setIsFlipped(false);
  };

  // Function to save flashcard state to the backend
  const saveFlashcardState = async () => {
    // Ensure userId exists before proceeding
    if (!userId) {
      console.error("saveFlashcardState: No userId provided.");
      return; // Exit the function early if userId is not provided
    }

    if (difficulty && currentQuestion && userId) {
      try {
        //await axios.post(`${baseUrl}/f-api/v1/flashcard`, {
        //await axios.post(`/f-api/v1/flashcard`, {
        // await axios.post(`/f-api/v1/text-parser-words`, {
        //   userId: userId,
        //   difficulty,
        //   collectionName: collectionName,
        //   vocabulary_original: currentQuestion.vocabulary_original,
        //   p_tag,
        //   s_tag,
        // });

        console.log("Updating existing document via PATCH");
        await axios.patch(`/f-api/v1/text-parser-words/${currentQuestion.id}`, {
          difficulty,
        });
      } catch (error) {
        console.log("Failed to store flashcard state:", error);
      } finally {
        setDifficulty(null);
      }
    } else {
      // Log a message if the conditions for making the POST request are not met
      console.log(
        "saveFlashcardState: Insufficient data provided (missing difficulty or currentQuestion, userId)."
      );
    }
  };

  const handleNextQuestion = () => {
    //if (difficulty && questions) { // Ensure questions is defined
    if (questions) {
      // Ensure questions is defined, lets iterate freely without setting difficulty
      // Only save state if difficulty is set
      saveFlashcardState();
      setCurrentQuestionIndex((prevIndex) =>
        prevIndex === questions.length - 1 ? 0 : prevIndex + 1
      );
    }
  };

  const handlePreviousQuestion = () => {
    if (difficulty && questions) {
      // Only save state if difficulty is set and questions are defined
      saveFlashcardState();
      setCurrentQuestionIndex((prevIndex) =>
        prevIndex === 0 ? questions.length - 1 : prevIndex - 1
      );
    } else if (questions) {
      // If only questions are defined but no difficulty is set, still allow navigating questions
      setCurrentQuestionIndex((prevIndex) =>
        prevIndex === 0 ? questions.length - 1 : prevIndex - 1
      );
    }
    // If questions are undefined, this function effectively does nothing,
    // as there are no questions to navigate between.
  };

  // -------------------------------------------------------------

  const handleDifficultySelection = async (selectedDifficulty: string) => {
    // Save the difficulty and move to next card in one action
    if (currentQuestion && userId) {
      try {
        await axios.patch(`/f-api/v1/text-parser-words/${currentQuestion.id}`, {
          difficulty: selectedDifficulty,
        });
      } catch (error) {
        console.log("Failed to store flashcard state:", error);
      }
    }

    // Reset flip and move to next card
    resetFlip();
    if (questions) {
      setCurrentQuestionIndex((prevIndex) =>
        prevIndex === questions.length - 1 ? 0 : prevIndex + 1
      );
    }
  };

  const handlePlayAudio = () => {
    if (audioRef.current) {
      audioRef.current.play();
    }
  };

  const playVocabularyAudio = () => {
    if (currentQuestion && currentQuestion.vocabulary_audio) {
      // Ensure currentQuestion and its vocabulary_audio property are defined
      const audio = new Audio(currentQuestion.vocabulary_audio);
      audio.play();
    } else {
      // Handle the case where currentQuestion or vocabulary_audio is not available
      console.log("Audio URL is missing or the current question is undefined.");
      // Optionally, you might want to alert the user or handle this case more gracefully
    }
  };

  const playSentenceAudio = (audioUrl: string): void => {
    const audio = new Audio(audioUrl);
    audio.play();
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
  }

  // ------------------------------------------------------------------------

  if (error) return <div>Failed to load</div>;

  // if (!isOpen)
  //   return (
  //     <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden m-2 transition duration-300 ease-in-out transform hover:-translate-y-1 hover:shadow-2xl flex flex-row justify-between items-center text-center sm:text-left">
  //       <div className="p-4 flex-grow">
  //         <div className="text-xs sm:text-sm md:text-md lg:text-lg font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-widest">
  //           {p_tag}
  //         </div>

  //         <a
  //            href="/flashcards"
  //           className="block mt-1 text-xs sm:text-sm md:text-md leading-tight font-semibold text-gray-800 dark:text-gray-200 hover:text-gray-600 dark:hover:text-gray-400"
  //           aria-label={`Kanji with one reading ${s_tag}`}
  //         >
  //           Essential vocabulary {s_tag}
  //         </a>
  //         <p className="mt-1 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
  //           Explore essential Japanese vocabulary interactively.
  //         </p>
  //         <div className="mt-2">
  //           <button
  //             type="button"
  //             onClick={openModal}
  //             className="inline-flex justify-center items-center rounded-md bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 text-gray-800 dark:text-gray-300 text-xs sm:text-sm px-3 py-1.5 transition-colors duration-150"
  //           >
  //             Open flashcard
  //           </button>
  //         </div>
  //       </div>
  //     </div>
  //   );


  if (!isOpen) {
    return (
      <ClosedFlashcard
        title="Sentence Mining"
        subtitle={s_tag}
        tags={['vocabulary', 'sentence-mining', 'verbs']} // Derive or hardcode relevant tags
        description="My vocabulary (Sentence Mining)"
        openModal={openModal}
        buttonText="Open Flashcard"
        detailLink={deckId ? `/flashcards/details/${deckId}` : `/flashcards/details/${collectionName}/${p_tag}/${s_tag}`}
      />
    );
  }














  if (!questions || questions.length === 0) return <div>Loading...</div>; // Ensure questions is loaded and has data

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
                  className="relative transform w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-2xl h-[85vh] max-h-[700px] overflow-hidden rounded-[2.5rem] bg-white p-4 sm:p-8 text-left shadow-2xl transition-all z-50 border border-slate-100"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="h-full flex flex-col">
                    {/* Close button */}
                    <button
                      onClick={() => setIsOpen(false)}
                      className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 z-10"
                    >
                      ✕
                    </button>

                    {/* -------------------- Flip Card Container ------------------- */}
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
                            <span className="text-5xl sm:text-6xl md:text-7xl font-black text-slate-900 block mb-8 truncate max-w-full px-2 italic tracking-tighter">
                              {currentQuestion.vocabulary_original}
                            </span>
                            <button
                              onClick={(e) => { e.stopPropagation(); playVocabularyAudio(); }}
                              className="w-16 h-16 rounded-3xl bg-slate-50 border border-slate-100 text-slate-400 hover:text-primary hover:border-primary/20 hover:bg-white flex items-center justify-center transition-all active:scale-90"
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
                                onClick={(e) => { e.stopPropagation(); playVocabularyAudio(); }}
                                className="w-14 h-14 rounded-2xl bg-white border border-slate-100 text-slate-400 hover:text-primary hover:border-primary/20 flex items-center justify-center transition-all active:scale-90 shadow-sm"
                              >
                                <FontAwesomeIcon
                                  icon={faPlayCircle}
                                  className="w-6 h-6"
                                />
                              </button>
                              <div className="flex-1 min-w-0">
                                <div className="text-2xl sm:text-3xl font-black text-slate-900 truncate italic tracking-tight">
                                  {currentQuestion.vocabulary_simplified}
                                </div>
                                <div className="text-sm font-bold text-slate-500 mt-1 truncate italic">
                                  {currentQuestion.vocabulary_english}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Sentences - Scrollable */}
                          <div className="flex-1 min-h-0 overflow-y-auto p-8 sm:p-10 custom-scrollbar relative z-10">
                            <SentenceSection sentences={currentQuestion.sentences} />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* -------------------- Navigation & Difficulty - Fixed bottom ------------------- */}
                    <div className="flex-shrink-0 pt-4 sm:pt-6 space-y-3">
                      {isFlipped ? (
                        <div className="flex flex-col items-center space-y-3">
                          <span className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300">
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
                              handleNextQuestion();
                            }}
                            className="text-xs sm:text-sm text-gray-400 hover:text-gray-600"
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
                      <div className="text-xs sm:text-sm text-gray-400 text-center">
                        {currentQuestionIndex + 1} / {questions?.length || 0}
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

interface Sentence {
  sentence_original: string;
  sentence_romaji: string;
  sentence_english: string;
  sentence_audio: string;
}

interface SentenceSectionProps {
  sentences: Sentence[];
}

const SentenceSection: React.FC<SentenceSectionProps> = ({ sentences }) => {
  const [visibleSentences, setVisibleSentences] = useState<Sentence[]>(
    sentences.slice(0, 2)
  );
  const [openStates, setOpenStates] = useState<{ [key: number]: boolean }>({});

  // Function to toggle sentence detail visibility
  const toggleOpenState = (index: number) => {
    setOpenStates((prevState) => ({
      ...prevState,
      [index]: !prevState[index],
    }));
  };

  // Function to play sentence audio
  const playSentenceAudio = (audioUrl: string) => {
    const audio = new Audio(audioUrl);
    audio.play();
  };

  useEffect(() => {
    const handleResize = () => {
      // Show only up to 2 sentences on small screens, more on larger screens
      const newSize = window.innerWidth < 640 ? 2 : sentences.length;
      setVisibleSentences(sentences.slice(0, newSize));
    };

    // Call resize function initially and on every window resize
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [sentences]); // Depend on `sentences` so it updates if the sentences prop changes

  return (
    <div className="flex flex-col space-y-6">
      <h3 className="text-[10px] font-black text-slate-300 uppercase tracking-widest text-left">
        Operational Contexts
      </h3>
      {visibleSentences.map((sentence, index) => (
        <div
          key={index}
          className="rounded-[2.5rem] border border-slate-100 bg-slate-50/50 p-6 shadow-sm hover:shadow-md hover:bg-white transition-all group/ex"
        >
          <div className="flex items-center justify-between gap-4">
            {/* JP Sentence */}
            <div className="text-xl font-bold text-slate-900 font-jp leading-relaxed group-hover/ex:text-primary transition-colors text-left flex-1">
              {sentence.sentence_original}
            </div>

            {/* Audio + expand button */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => playSentenceAudio(sentence.sentence_audio)}
                className="w-10 h-10 rounded-xl bg-white border border-slate-100 text-slate-300 hover:text-primary hover:border-primary/20 flex items-center justify-center transition-all shadow-sm"
              >
                <FontAwesomeIcon
                  icon={faPlayCircle}
                  className="h-5 w-5"
                />
              </button>
              <button
                onClick={() => toggleOpenState(index)}
                className="w-10 h-10 rounded-xl bg-white border border-slate-100 text-slate-300 hover:text-primary hover:border-primary/20 flex items-center justify-center transition-all shadow-sm"
              >
                {openStates[index] ? (
                  <ChevronUpIcon className="h-5 w-5" />
                ) : (
                  <ChevronDownIcon className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          {/* Romaji & English */}
          {openStates[index] && (
            <div className="mt-4 space-y-2 text-sm animate-in slide-in-from-top-2 duration-300 text-left">
              <div className="text-slate-400 font-medium italic">{sentence.sentence_romaji}</div>
              <div className="text-slate-600 font-bold italic">{sentence.sentence_english}</div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
