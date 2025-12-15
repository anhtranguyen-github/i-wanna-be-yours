"use client";

import useSWR from "swr";
import { FC, useState, useRef, Fragment, useCallback } from "react";
import { useEffect } from "react";
import { Dialog, Transition } from "@headlessui/react";
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
import { ChevronDownIcon, ChevronUpIcon, XMarkIcon, Cog6ToothIcon } from "@heroicons/react/24/solid";
import ClosedFlashcard from "@/components/ClosedFlashcard";
import { ProgressBar, CompletionScreen, SessionStats } from "@/components/flashcards/ProgressTracker";

interface Question {
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
  deckTitle?: string;
  deckDescription?: string;
  prefetchedData?: Question[];
}

const ComplexFlashcardModal: FC<ComplexFlashcardModalProps> = ({
  userId,
  collectionName,
  p_tag,
  s_tag,
  deckId,
  deckTitle,
  deckDescription,
  prefetchedData
}) => {

  const [count, setCount] = useState<number>(0);
  let [isOpen, setIsOpen] = useState(false);
  const [shouldFetchData, setShouldFetchData] = useState(false);
  const [isFetching, setIsFetching] = useState(false);

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [difficulty, setDifficulty] = useState<string | null>(null);

  // Progress tracking state
  const [sessionStats, setSessionStats] = useState({ easy: 0, medium: 0, hard: 0 });
  const [reviewedCards, setReviewedCards] = useState<Set<number>>(new Set());
  const [isComplete, setIsComplete] = useState(false);

  // Settings State
  const [settings, setSettings] = useState({
    mode: 'learn' as 'basic' | 'learn',
    shuffle: false,
    defaultSide: 'front' as 'front' | 'back',
  });
  const [showSettings, setShowSettings] = useState(false);
  const [displayQuestions, setDisplayQuestions] = useState<Question[]>([]);

  const audioRef = useRef<HTMLAudioElement>(null);

  let apiUrl;

  // Adjust URLs based on the presence of userId
  if (userId) {
    apiUrl = `/f-api/v1/combine-flashcard-data-${collectionName}?userId=${userId}&collectionName=${collectionName}&p_tag=${p_tag}&s_tag=${s_tag}`;
  } else {
    apiUrl = `/e-api/v1/${collectionName}?p_tag=${p_tag}&s_tag=${s_tag}`;
  }


  const fetcher = (url: string) =>
    fetch(url)
      .then((res) => res.json())
      .then((data) => data.words); // Extract the words array from the response

  //const { data: questions, error } = useSWR<Question[]>(apiUrl, fetcher);
  const { data: questions, error } = useSWR<Question[]>(
    shouldFetchData && !prefetchedData ? apiUrl : null,
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
    const sourceData = prefetchedData || questions;

    if (sourceData) {
      let q = [...sourceData];
      if (settings.shuffle) {
        // Fisher-Yates shuffle
        for (let i = q.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [q[i], q[j]] = [q[j], q[i]];
        }
      }
      setDisplayQuestions(q);
      setCurrentQuestionIndex(0); // Reset to start when questions/shuffle changes
    }
  }, [questions, prefetchedData, settings.shuffle]);


  const currentQuestion = displayQuestions?.[currentQuestionIndex];

  console.log("------------------------------------------");
  console.log(currentQuestion);

  /* ----------------- State ------------------ */
  const [isFlipped, setIsFlipped] = useState(false); // State to track card flip
  const [hasRevealed, setHasRevealed] = useState(false); // Track if answer has been revealed for current card

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

  // Re-apply default side when setting changes or index changes
  useEffect(() => {
    setIsFlipped(settings.defaultSide === 'back');
    // We do NOT reset hasRevealed here generally, unless index changed.
    // Actually typically resetFlip is called on index change.
  }, [settings.defaultSide]);

  // Handle index change explicitly if needed for hasRevealed, but usually done in handlers
  useEffect(() => {
    setHasRevealed(false);
  }, [currentQuestionIndex]);


  // Function to save flashcard state to the backend
  const saveFlashcardState = async () => {
    // Ensure userId exists before proceeding
    if (!userId) {
      console.error("saveFlashcardState: No userId provided.");
      return; // Exit the function early if userId is not provided
    }

    if (difficulty && currentQuestion && userId) {
      try {
        console.log("mocking saving post call");
        //await axios.post(`${baseUrl}/f-api/v1/flashcard`, {
        await axios.post(`/f-api/v1/flashcard`, {
          userId: userId,
          difficulty,
          collectionName: collectionName,
          vocabulary_original: currentQuestion.vocabulary_original,
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
        "saveFlashcardState: Insufficient data provided (missing difficulty or currentQuestion, userId)."
      );
    }
  };

  const handleNextQuestion = () => {
    //if (difficulty && questions) { // Ensure questions is defined
    if (displayQuestions && displayQuestions.length > 0) {
      // Ensure questions is defined, lets iterate freely without setting difficulty
      // Only save state if difficulty is set
      saveFlashcardState();

      // If basic mode, mark as reviewed when manually stepping
      if (settings.mode === 'basic') {
        setReviewedCards(prev => new Set(prev).add(currentQuestionIndex));
      }

      setCurrentQuestionIndex((prevIndex) =>
        prevIndex === displayQuestions.length - 1 ? 0 : prevIndex + 1
      );
      // hasRevealed reset by useEffect on currentQuestionIndex
    }
  };

  const handlePreviousQuestion = () => {
    if (displayQuestions && displayQuestions.length > 0) {
      // Only save state if difficulty is set and questions are defined
      saveFlashcardState();
      setCurrentQuestionIndex((prevIndex) =>
        prevIndex === 0 ? displayQuestions.length - 1 : prevIndex - 1
      );
    }
    // If questions are undefined, this function effectively does nothing,
    // as there are no questions to navigate between.
  };

  // -------------------------------------------------------------

  const handleDifficultySelection = async (selectedDifficulty: string) => {
    // Save the difficulty and move to next card
    if (currentQuestion && userId) {
      try {
        await axios.post(`/f-api/v1/flashcard`, {
          userId: userId,
          difficulty: selectedDifficulty,
          collectionName: collectionName,
          vocabulary_original: currentQuestion.vocabulary_original,
          p_tag,
          s_tag,
        });
      } catch (error) {
        console.log("Failed to store flashcard state:", error);
      }
    }

    // Update session stats
    setSessionStats(prev => ({
      ...prev,
      [selectedDifficulty]: prev[selectedDifficulty as keyof typeof prev] + 1
    }));

    // Track reviewed cards
    setReviewedCards(prev => new Set(prev).add(currentQuestionIndex));

    // Reset flip and move to next card
    resetFlip();
    if (displayQuestions) {
      const nextIndex = currentQuestionIndex + 1;

      // Check if all cards have been reviewed
      if (reviewedCards.size + 1 >= displayQuestions.length) {
        setIsComplete(true);
      } else {
        // Find next unreviewed card or loop back
        setCurrentQuestionIndex(nextIndex >= displayQuestions.length ? 0 : nextIndex);
      }
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
    setShouldFetchData(false);
  }

  function openModal() {
    setIsOpen(true);
    setShouldFetchData(true);
    setIsFetching(true);
    // Reset progress when opening
    setSessionStats({ easy: 0, medium: 0, hard: 0 });
    setReviewedCards(new Set());
    setIsComplete(false);
    setCurrentQuestionIndex(0);
  }

  // Restart deck study
  const handleRestart = () => {
    setSessionStats({ easy: 0, medium: 0, hard: 0 });
    setReviewedCards(new Set());
    setIsComplete(false);
    setCurrentQuestionIndex(0);
    resetFlip();
  };

  const toggleSettings = () => setShowSettings(!showSettings);

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
        title={deckTitle || p_tag.replace(/_/g, " ")} // Make title readable
        subtitle={s_tag}
        tags={[collectionName === 'words' ? 'vocabulary' : collectionName, 'essential']} // Pass appropriate tags
        description={deckDescription || "Essential Japanese vocabulary."}
        openModal={openModal}
        onMouseEnter={() => setShouldFetchData(true)}
        buttonText="Start Session"
        detailLink={deckId ? `/flashcards/details/${deckId}` : `/flashcards/details/${collectionName}/${p_tag}/${s_tag}`} // Generated Link
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
                  className="relative transform w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-2xl h-[85vh] max-h-[700px] overflow-hidden rounded-2xl bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 text-left shadow-xl transition-all z-50"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Completion Screen */}
                  {isComplete ? (
                    <CompletionScreen
                      totalCards={questions?.length || 0}
                      sessionStats={{ reviewed: reviewedCards.size, ...sessionStats }}
                      onRestart={handleRestart}
                      onClose={closeModal}
                      deckTitle={`${p_tag} ${s_tag}`}
                    />
                  ) : (
                    <div className="h-full flex flex-col">
                      {/* Header Controls */}
                      <div className="flex justify-between items-center mb-4 z-10">
                        <button
                          onClick={() => setIsOpen(false)}
                          className="text-sm font-bold text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                        >
                          Close Deck
                        </button>

                        <div className="flex items-center gap-4">
                          {/* Settings Button */}
                          <button
                            onClick={toggleSettings}
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1"
                          >
                            <FontAwesomeIcon icon={faGear} className="w-5 h-5" />
                          </button>
                        </div>
                      </div>

                      {/* Settings Panel */}
                      {showSettings && (
                        <div className="absolute top-12 right-4 z-20 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-4 animate-in fade-in slide-in-from-top-5">
                          <h3 className="font-bold text-gray-800 dark:text-gray-200 mb-3 border-b pb-2 dark:border-gray-700">Detailed Settings</h3>

                          <div className="space-y-4">
                            {/* Mode Toggle */}
                            <div className="flex flex-col gap-1">
                              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Mode</label>
                              <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                                <button
                                  onClick={() => setSettings(s => ({ ...s, mode: 'basic' }))}
                                  className={`flex-1 text-sm py-1 rounded-md transition-all ${settings.mode === 'basic' ? 'bg-white dark:bg-gray-600 shadow text-brand-salmon' : 'text-gray-500 dark:text-gray-400'}`}
                                >
                                  Basic
                                </button>
                                <button
                                  onClick={() => setSettings(s => ({ ...s, mode: 'learn' }))}
                                  className={`flex-1 text-sm py-1 rounded-md transition-all ${settings.mode === 'learn' ? 'bg-white dark:bg-gray-600 shadow text-brand-salmon' : 'text-gray-500 dark:text-gray-400'}`}
                                >
                                  SR
                                </button>
                              </div>
                            </div>

                            {/* Shuffle Toggle */}
                            <div className="flex items-center justify-between">
                              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                <FontAwesomeIcon icon={faShuffle} className="text-gray-400" />
                                Shuffle
                              </label>
                              <button
                                onClick={() => setSettings(s => ({ ...s, shuffle: !s.shuffle }))}
                                className={`w-10 h-5 rounded-full relative transition-colors ${settings.shuffle ? 'bg-brand-salmon' : 'bg-gray-300 dark:bg-gray-600'}`}
                              >
                                <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${settings.shuffle ? 'left-5.5' : 'left-0.5'}`} style={{ left: settings.shuffle ? '1.35rem' : '0.15rem' }}></div>
                              </button>
                            </div>

                            {/* Default Side Toggle */}
                            <div className="flex flex-col gap-1">
                              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Start Side</label>
                              <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                                <button
                                  onClick={() => setSettings(s => ({ ...s, defaultSide: 'front' }))}
                                  className={`flex-1 text-sm py-1 rounded-md transition-all ${settings.defaultSide === 'front' ? 'bg-white dark:bg-gray-600 shadow text-brand-salmon' : 'text-gray-500 dark:text-gray-400'}`}
                                >
                                  Def
                                </button>
                                <button
                                  onClick={() => setSettings(s => ({ ...s, defaultSide: 'back' }))}
                                  className={`flex-1 text-sm py-1 rounded-md transition-all ${settings.defaultSide === 'back' ? 'bg-white dark:bg-gray-600 shadow text-brand-salmon' : 'text-gray-500 dark:text-gray-400'}`}
                                >
                                  Rev
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
                            className="absolute inset-0 w-full h-full dark:bg-gray-800 bg-white rounded-xl shadow-md flex flex-col items-center justify-center p-4 sm:p-6"
                            style={{ backfaceVisibility: 'hidden' }}
                          >
                            <div className="text-center max-w-full">
                              <div className="text-xs sm:text-sm text-gray-400 uppercase tracking-wider mb-3 sm:mb-4">
                                Tap to reveal answer
                              </div>
                              <span className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold dark:text-gray-200 text-gray-700 block mb-3 sm:mb-4 truncate max-w-full px-2">
                                {currentQuestion.vocabulary_original}
                              </span>
                              <button
                                onClick={(e) => { e.stopPropagation(); playVocabularyAudio(); }}
                                className="mt-2 sm:mt-4 p-2 sm:p-3 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                              >
                                <FontAwesomeIcon
                                  icon={faPlayCircle}
                                  className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600 dark:text-white"
                                />
                              </button>
                            </div>
                          </div>

                          {/* ===== BACK SIDE - Fixed size with scroll ===== */}
                          <div
                            className="absolute inset-0 w-full h-full dark:bg-gray-800 bg-white rounded-xl shadow-md flex flex-col overflow-hidden"
                            style={{
                              backfaceVisibility: 'hidden',
                              transform: 'rotateY(180deg)',
                            }}
                          >
                            {/* Header - Fixed */}
                            <div className="flex-shrink-0 p-4 sm:p-6 border-b border-gray-100 dark:border-gray-700">
                              <div className="flex items-center space-x-3">
                                <button
                                  onClick={(e) => { e.stopPropagation(); playVocabularyAudio(); }}
                                  className="flex-shrink-0 p-2 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
                                >
                                  <FontAwesomeIcon
                                    icon={faPlayCircle}
                                    className="w-5 h-5 sm:w-6 sm:h-6 text-gray-800 dark:text-white"
                                  />
                                </button>
                                <div className="flex-1 min-w-0 text-center">
                                  <div className="text-lg sm:text-xl md:text-2xl font-bold dark:text-white text-gray-800 truncate">
                                    {currentQuestion.vocabulary_simplified}
                                  </div>
                                  <span className="text-2xl sm:text-3xl md:text-4xl font-bold dark:text-gray-200 text-gray-600 block truncate">
                                    {currentQuestion.vocabulary_original}
                                  </span>
                                  <div className="text-base sm:text-lg md:text-xl dark:text-gray-300 text-gray-600 mt-1 truncate">
                                    {currentQuestion.vocabulary_english}
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Sentences - Scrollable */}
                            <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6">
                              <SentenceSection sentences={currentQuestion.sentences} />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* -------------------- Navigation & Difficulty - Fixed bottom ------------------- */}
                      {/* Navigation & Difficulty */}
                      <div className="flex-shrink-0 pt-4 sm:pt-6 space-y-3">
                        {settings.mode === 'basic' ? (
                          <div className="flex flex-col items-center space-y-3">
                            <div className="flex justify-center gap-4 w-full">
                              <button
                                onClick={(e) => { e.stopPropagation(); handlePreviousQuestion(); }}
                                className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
                              >
                                <FontAwesomeIcon icon={faArrowLeft} /> Prev
                              </button>

                              {!isFlipped ? (
                                <button
                                  onClick={(e) => { e.stopPropagation(); flipCard(); }}
                                  className="flex-1 px-4 py-2 bg-brand-salmon text-white font-bold rounded-xl shadow-md hover:bg-brand-salmon/90 transition-colors"
                                >
                                  Show Answer
                                </button>
                              ) : (
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleNextQuestion(); }}
                                  className="flex-1 px-4 py-2 bg-blue-500 text-white font-bold rounded-xl shadow-md hover:bg-blue-600 transition-colors"
                                >
                                  Next Card <FontAwesomeIcon icon={faArrowRight} className="ml-2" />
                                </button>
                              )}

                              <button
                                onClick={(e) => { e.stopPropagation(); handleNextQuestion(); }}
                                className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
                              >
                                <FontAwesomeIcon icon={faArrowRight} />
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


                        {/* Progress bar with stats */}
                        <ProgressBar
                          current={currentQuestionIndex}
                          total={displayQuestions?.length || 0}
                          reviewed={reviewedCards.size}
                        />

                        {/* Session stats */}
                        <div className="flex justify-center">
                          <SessionStats
                            reviewed={reviewedCards.size}
                            easy={sessionStats.easy}
                            medium={sessionStats.medium}
                            hard={sessionStats.hard}
                          />
                        </div>
                      </div>
                    </div>
                  )}
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
    <div className="text-center space-y-6">
      <div className="py-6 space-y-4">
        {/* Header for "Example Sentence(s):" */}
        <div className="text-base font-semibold dark:text-gray-200 text-gray-700">
          Example Sentence(s):
        </div>
        {visibleSentences.map((sentence, index) => (
          <div key={index} className="space-y-2">
            <div className="flex items-center space-x-2">
              {/* Play Button for Sentence Audio */}
              <button
                onClick={() => playSentenceAudio(sentence.sentence_audio)}
                className="flex-shrink-0"
                aria-label="Play Sentence Audio"
              >
                <FontAwesomeIcon
                  icon={faPlayCircle}
                  className="w-5 h-5 text-gray-800 dark:text-white"
                />
              </button>
              {/* Sentence Text and Toggle Button */}
              <div className="flex-grow flex justify-between items-center">
                <div className="text-lg dark:text-white text-gray-800">
                  {sentence.sentence_original}
                </div>
                <button
                  onClick={() => toggleOpenState(index)}
                  className="flex-shrink-0"
                >
                  {openStates[index] ? (
                    <ChevronUpIcon className="w-5 h-5" />
                  ) : (
                    <ChevronDownIcon className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
            {/* Conditional rendering for Sentence Details */}
            {openStates[index] && (
              <div className="space-y-1 text-left">
                <div className="text-sm dark:text-gray-200 text-gray-700">
                  {sentence.sentence_romaji}
                </div>
                <div className="text-md italic dark:text-gray-400 text-gray-600">
                  {sentence.sentence_english}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
