"use client";

import useSWR from "swr";
import { FC, useState, useRef, Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react"; // https://headlessui.com/react/dialog
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlayCircle,
  faArrowLeft,
  faArrowRight,
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
}

const ComplexFlashcardModal: FC<ComplexFlashcardModalProps> = ({
  userId,
  collectionName,
  p_tag,
  s_tag,
}) => {
  const [count, setCount] = useState<number>(0);
  let [isOpen, setIsOpen] = useState(false);
  const [shouldFetchData, setShouldFetchData] = useState(false);
  const [isFetching, setIsFetching] = useState(false); // To track fetching status

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [difficulty, setDifficulty] = useState<string | null>(null);

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
  }

  // ------------------------------------------------------------------------

  if (error) return <div>Failed to load</div>;

  // if (!isOpen)
  //   return (
  //     <div className=" p-2 bg-white dark:bg-gray-800 rounded-lg shadow transition-shadow duration-300 ease-in-out hover:shadow-xl">
  //       <div className="text-sm md:text-md lg:text-lg font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-widest">
  //         Level: {p_tag}
  //       </div>
  //       <p>Kanji with one reading {s_tag}</p>
  //       <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
  //         Explore the kanji readings interactively.
  //       </p>
  //       <button
  //         type="button"
  //         onClick={openModal}
  //         className="mt-2 inline-flex items-center justify-center rounded-md bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-gray-500 dark:focus:ring-gray-600 text-gray-800 dark:text-gray-300 text-sm px-3 py-1.5 transition-colors duration-150"
  //       >
  //         Open flashcard
  //       </button>
  //     </div>
  //   );


  if (!isOpen) {
    return (
      <ClosedFlashcard
        p_tag={p_tag}
        s_tag={s_tag}
        badgeText="Kanji"
        badgeColor="bg-rose-100 text-rose-800" // Specify badge color here
        description="Explore kanji readings."
        openModal={openModal}
        buttonText="Open Flashcard"
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
                <Dialog.Panel
                  className="bg-blue-100 relative transform w-11/12 h-5/6 overflow-hidden rounded-lg bg-white p-8 text-left shadow-xl transition-all text-gray-900 dark:bg-gray-800 dark:text-white z-50"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="bg-gray-100 dark:bg-gray-900 flex flex-col items-center py-6 space-y-6 z-50">
                    {/* -------------------- Flip Card Container ------------------- */}
                    <div
                      className="perspective-1000 w-full max-w-2xl cursor-pointer"
                      onClick={!isFlipped ? flipCard : undefined}
                      style={{ perspective: '1000px' }}
                    >
                      <div
                        className="relative w-full transition-transform duration-500"
                        style={{
                          transformStyle: 'preserve-3d',
                          transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                          minHeight: '350px'
                        }}
                      >
                        {/* ===== FRONT SIDE - Just Kanji ===== */}
                        <div
                          className="absolute w-full dark:bg-gray-800 bg-white rounded-lg shadow-md p-8 flex flex-col items-center justify-center"
                          style={{
                            backfaceVisibility: 'hidden',
                            minHeight: '350px'
                          }}
                        >
                          <div className="text-center">
                            <div className="text-sm text-gray-400 uppercase tracking-wider mb-6">
                              Tap to reveal answer
                            </div>
                            <span className="text-9xl font-bold dark:text-gray-200 text-gray-700 block font-noto-sans-jp">
                              {currentQuestion.kanji}
                            </span>
                            <button
                              onClick={(e) => { e.stopPropagation(); playKanjiAudio(); }}
                              className="mt-6 p-3 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                            >
                              <FontAwesomeIcon
                                icon={faPlayCircle}
                                className="w-6 h-6 text-gray-600 dark:text-white"
                              />
                            </button>
                          </div>
                        </div>

                        {/* ===== BACK SIDE - Full Details ===== */}
                        <div
                          className="absolute w-full dark:bg-gray-800 bg-white rounded-lg shadow-md p-8 flex"
                          style={{
                            backfaceVisibility: 'hidden',
                            transform: 'rotateY(180deg)',
                            minHeight: '350px'
                          }}
                        >
                          <div className="flex-1 flex justify-center items-center">
                            <span className="text-8xl font-bold dark:text-gray-200 text-gray-600 font-noto-sans-jp">
                              {currentQuestion.kanji}
                            </span>
                          </div>

                          <div className="flex-1 text-center space-y-4">
                            <div className="space-y-2">
                              <div className="text-3xl font-bold flex items-center justify-center space-x-2">
                                <span className="dark:text-white text-gray-800">
                                  {currentQuestion.kanji}
                                </span>
                                <button
                                  onClick={(e) => { e.stopPropagation(); playKanjiAudio(); }}
                                  className="focus:outline-none dark:text-gray-300 text-gray-500 hover:dark:text-gray-200 hover:text-gray-600"
                                >
                                  <FontAwesomeIcon icon={faPlayCircle} size="xs" />
                                </button>
                              </div>
                              <div className="text-xl dark:text-gray-300 text-gray-600">
                                {currentQuestion.reading}
                              </div>
                            </div>

                            <div className="border-t border-b border-gray-300 py-4 space-y-3">
                              <div className="text-sm font-semibold dark:text-gray-200 text-gray-700">
                                Example:
                              </div>
                              <div className="text-lg flex items-center justify-center space-x-2">
                                <span className="text-xl dark:text-white text-gray-800">
                                  {currentQuestion.exampleWord}
                                </span>
                                <button
                                  onClick={(e) => { e.stopPropagation(); handlePlayAudio(); }}
                                  className="focus:outline-none dark:text-gray-300 text-gray-500"
                                >
                                  <FontAwesomeIcon icon={faPlayCircle} size="sm" />
                                </button>
                              </div>
                              <audio
                                ref={audioRef}
                                src={currentQuestion.audio}
                                preload="auto"
                              ></audio>
                              <div className="text-sm dark:text-gray-200 text-gray-700">
                                {currentQuestion.exampleReading}
                              </div>
                              <div className="text-base italic dark:text-gray-400 text-gray-600">
                                {currentQuestion.translation}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* -------------------- Navigation & Difficulty ------------------- */}
                    {isFlipped ? (
                      <div className="flex flex-col items-center space-y-4">
                        <span className="text-sm font-semibold text-gray-700">
                          How well did you know this?
                        </span>
                        <div className="flex space-x-3">
                          <button
                            className="py-3 px-6 rounded-xl font-bold text-sm bg-red-100 hover:bg-red-200 text-red-700 transition-colors"
                            onClick={() => handleDifficultySelection("hard")}
                          >
                            😓 Hard
                          </button>
                          <button
                            className="py-3 px-6 rounded-xl font-bold text-sm bg-yellow-100 hover:bg-yellow-200 text-yellow-700 transition-colors"
                            onClick={() => handleDifficultySelection("medium")}
                          >
                            🤔 Medium
                          </button>
                          <button
                            className="py-3 px-6 rounded-xl font-bold text-sm bg-green-100 hover:bg-green-200 text-green-700 transition-colors"
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
                          className="text-sm text-gray-400 hover:text-gray-600 mt-2"
                        >
                          Skip without rating
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={flipCard}
                        className="px-8 py-3 bg-brand-salmon hover:bg-brand-salmon/90 text-white font-bold rounded-xl transition-colors"
                      >
                        Show Answer
                      </button>
                    )}

                    <div className="text-sm text-gray-400">
                      {currentQuestionIndex + 1} / {questions?.length || 0}
                    </div>

                    <button
                      onClick={() => setIsOpen(false)}
                      className="w-full max-w-xs justify-center rounded-md bg-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-300 focus:outline-none"
                    >
                      Close
                    </button>
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
