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

interface Question {
  kanji: string;
  onYomi: string;
  kunYomi: string;
  reading: string;
  k_audio: string;
  exampleWord: string;
  exampleReading: string;
  translation: string;
  audio: string;
}

interface ComplexFlashcardProps {
  questions: Question[];
}

interface ComplexFlashcardModalProps {
  p_tag: string;
  s_tag: string;
}

const ComplexFlashcardModal: FC<ComplexFlashcardModalProps> = ({
  p_tag,
  s_tag,
}) => {
  const [count, setCount] = useState<number>(0);
  let [isOpen, setIsOpen] = useState(false);

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [difficulty, setDifficulty] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement>(null);

  const fetcher = (...args: Parameters<typeof fetch>) =>
    fetch(...args).then((res) => res.json());

  //const apiUrl = "http://localhost:8000/api/kanji?p_tag=JLPT_N3&s_tag=part_1";
  //////// const apiUrl = `http://localhost:8000/e-api/v1/kanji?p_tag=${p_tag}&s_tag=${s_tag}`;


  const apiUrl = `/e-api/v1/kanji?p_tag=${p_tag}&s_tag=${s_tag}`;








  //const { data: questions, error } = useSWR(apiUrl, fetcher);
  const { data: questions, error } = useSWR<Question[]>(apiUrl, fetcher);

  console.log(questions);

  //const currentQuestion = questions[currentQuestionIndex];
  const currentQuestion = questions?.[currentQuestionIndex];

  console.log("------------------------------------------");
  console.log(currentQuestion);

  const [isFlipped, setIsFlipped] = useState(false); // State to track card flip

  // ... existing function declarations

  const flipCard = () => {
    setIsFlipped(!isFlipped);
  };

  // Function to save flashcard state
  const saveFlashcardState = async () => {
    // if (difficulty) {
    try {
      console.log('mocking saving post call');
      // await axios.post("http://localhost:8000/api/flashcard", {
      //   userId: "user123", // Replace with the appropriate user ID
      //   count,
      //   currentQuestionIndex,
      //   difficulty,
      //   kanji: currentQuestion.kanji,
      //   reading: currentQuestion.reading,
      //   exampleWord: currentQuestion.exampleWord,
      //   exampleReading: currentQuestion.exampleReading,
      // });
    } catch (error) {
      console.log("Failed to store flashcard state:", error);
    } finally {
      setDifficulty(null);
    }
    // }
  };


  const handleNextQuestion = () => {
    //if (difficulty && questions) { // Ensure questions is defined
    if (questions) { // Ensure questions is defined, lets iterate freely without setting difficulty
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

  const handleDifficultySelection = (selectedDifficulty: string) => {
    setDifficulty(selectedDifficulty);
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


  // Example array of kanji characters
  //const kanjis = ["漢", "字", "学", "校", "日", "本", "語"];
  const kanjis = [
    "漢", // Kan (China, Chinese)
    "字", // Ji (Character)
    "学", // Gaku (Study, Learning)
    "校", // Kō (School)
    "日", // Hi/Nichi (Day, Sun)
    "本", // Hon (Book, Origin)
    "語", // Go (Language)
    "愛", // Ai (Love)
    "和", // Wa (Harmony, Peace)
    "光", // Hikari (Light)
    "力", // Chikara (Power, Strength)
    "夢", // Yume (Dream)
    "美", // Bi (Beauty)
    "勇", // Yū (Courage, Bravery)
    "静", // Shizu (Quiet, Calm)
    "笑", // Wara (Smile, Laugh)
    "希", // Ki (Hope, Wish)
    "神", // Kami (God, Deity)
    "龍", // Ryū (Dragon)
    "水", // Mizu (Water)
    "火", // Hi (Fire)
    "風", // Kaze (Wind)
    "地", // Chi (Earth)
    "空", // Sora (Sky)
    "海", // Umi (Sea)
    "心", // Kokoro (Heart, Mind)
    "星"  // Hoshi (Star)
  ];



  // Function to get a random kanji
  const getRandomKanji = () => {
    const randomIndex = Math.floor(Math.random() * kanjis.length);
    return kanjis[randomIndex];
  };




  function closeModal() {
    setIsOpen(false);
  }

  function openModal() {
    setIsOpen(true);
  }

  // ------------------------------------------------------------------------

  if (error) return <div>Failed to load</div>;

  //if (!questions) return <div>Loading...</div>;
  if (!questions || questions.length === 0) return <div>Loading...</div>; // Ensure questions is loaded and has data

  if (!currentQuestion) {
    // Render a loading state or nothing until the data is available
    return <div>Loading...</div>;
  }

  return (
    <>

      {/* <div className="bg-white dark:bg-gray-800 rounded-lg  overflow-hidden m-4 transition duration-300 ease-in-out transform hover:-translate-y-1 hover:">
  <div className="p-6">
    <div className="text-xs font-semibold text-neutral-ink dark:text-neutral-ink uppercase tracking-widest">
      Level: {p_tag}
    </div>
    <a
      href="#"
      className="block mt-2 text-lg leading-tight font-semibold text-neutral-ink dark:text-neutral-ink hover:text-neutral-ink dark:hover:text-neutral-ink"
      aria-label={`Kanji with one reading ${s_tag}`}
    >
      Kanji with one reading {s_tag}
    </a>
    <p className="mt-3 text-neutral-ink dark:text-neutral-ink">
      Explore the kanji readings and levels interactively.
    </p>
  </div>
  <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700">
    <button
      type="button"
      onClick={openModal}
      className="w-full inline-flex justify-center items-center rounded-md bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 text-neutral-ink dark:text-neutral-ink text-sm px-4 py-2 transition-colors duration-150"
    >
      Open dialog
    </button>
  </div>
</div> */}


      {/* <div className="bg-white dark:bg-gray-800 rounded-lg  overflow-hidden m-2 transition duration-300 ease-in-out transform hover:-translate-y-1 hover: flex flex-col md:flex-row justify-between items-center text-center md:text-left">
  <div className="p-4 flex-grow">
    <div className="text-xs font-semibold text-neutral-ink dark:text-neutral-ink uppercase tracking-widest">
      Level: {p_tag}
    </div>
    <a
      href="#"
      className="block mt-2 text-md leading-tight font-semibold text-neutral-ink dark:text-neutral-ink hover:text-neutral-ink dark:hover:text-neutral-ink"
      aria-label={`Kanji with one reading ${s_tag}`}
    >
      Kanji with one reading {s_tag}
    </a>
    <p className="mt-2 text-neutral-ink dark:text-neutral-ink">
      Explore the kanji readings and levels interactively.
    </p>
    <div className="mt-3">
      <button
        type="button"
        onClick={openModal}
        className="inline-flex justify-center items-center rounded-md bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 text-neutral-ink dark:text-neutral-ink text-sm px-4 py-2 transition-colors duration-150"
      >
        Open dialog
      </button>
    </div>
  </div>
  <div className="md:flex hidden justify-center items-center p-4 md:w-1/4 lg:w-1/5">
    <span className="text-neutral-ink dark:text-neutral-ink font-bold text-5xl">
      {getRandomKanji()}
    </span>
  </div>
</div> */}




      {/* <div className="bg-white dark:bg-gray-800 rounded-lg  overflow-hidden m-2 transition duration-300 ease-in-out transform hover:-translate-y-1 hover: flex flex-col md:flex-row justify-between items-center text-center md:text-left">
  <div className="p-4 flex-grow">
    <div className="text-sm md:text-lg font-semibold text-neutral-ink dark:text-neutral-ink uppercase tracking-widest">
      Level: {p_tag}
    </div>
    <a
      href="#"
      className="block mt-2 text-md leading-tight font-semibold text-neutral-ink dark:text-neutral-ink hover:text-neutral-ink dark:hover:text-neutral-ink"
      aria-label={`Kanji with one reading ${s_tag}`}
    >
      Kanji with one reading {s_tag}
    </a>
    <p className="mt-2 text-neutral-ink dark:text-neutral-ink">
      Explore the kanji readings and levels interactively.
    </p>
    <div className="mt-3">
      <button
        type="button"
        onClick={openModal}
        className="inline-flex justify-center items-center rounded-md bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 text-neutral-ink dark:text-neutral-ink text-sm px-4 py-2 transition-colors duration-150"
      >
        Open dialog
      </button>
    </div>
  </div>
  <div className="md:flex hidden justify-end items-center md:pr-8 lg:pr-12 xl:pr-16 md:w-1/4 lg:w-1/5">
    <span className="text-neutral-ink dark:text-neutral-ink font-bold text-5xl">
      {getRandomKanji()}
    </span>
  </div>
</div> */}


      <div className="bg-white dark:bg-gray-800 rounded-lg  overflow-hidden m-2 transition duration-300 ease-in-out transform hover:-translate-y-1 hover: flex flex-row justify-between items-center text-center sm:text-left">
        <div className="p-4 flex-grow">
          <div className="text-xs sm:text-sm md:text-md lg:text-lg font-semibold text-neutral-ink dark:text-neutral-ink uppercase tracking-widest">
            Level: {p_tag}
          </div>
          <a
            href="/japanese/flashcards-kanji/#"
            className="block mt-1 text-xs sm:text-sm md:text-md leading-tight font-semibold text-neutral-ink dark:text-neutral-ink hover:text-neutral-ink dark:hover:text-neutral-ink"
            aria-label={`Kanji with one reading ${s_tag}`}
          >
            Kanji with one reading {s_tag}
          </a>
          <p className="mt-1 text-xs sm:text-sm text-neutral-ink dark:text-neutral-ink">
            Explore the kanji readings and levels interactively.
          </p>
          <div className="mt-2">
            <button
              type="button"
              onClick={openModal}
              className="inline-flex justify-center items-center rounded-md bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 text-neutral-ink dark:text-neutral-ink text-xs sm:text-sm px-3 py-1.5 transition-colors duration-150"
            >
              Open flashcard
            </button>
          </div>
        </div>
        <div className="flex justify-center items-center pr-2 sm:pr-4 md:pr-8 lg:pr-12">
          <span className="text-neutral-ink dark:text-neutral-ink font-bold text-3xl sm:text-4xl md:text-5xl">
            {getRandomKanji()}
          </span>
        </div>
      </div>












      <Transition.Root show={isOpen} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-30"
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

          <div className="fixed inset-0 z-30 overflow-y-auto">
            <div className="flex min-h-screen items-center justify-center p-4 z-20">
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
                  className="relative transform w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-2xl h-[85vh] max-h-[700px] overflow-hidden rounded-[2.5rem] bg-white p-4 sm:p-8 text-left  transition-all z-20 border border-slate-100"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="bg-white flex flex-col items-center h-full relative z-20">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2" />

                    <div className="bg-white rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-slate-100 p-10 w-full flex-1 flex flex-col md:flex-row gap-10 items-center relative z-20">
                      <div className="flex-1 flex justify-center items-center">
                        <span className="text-8xl sm:text-9xl font-black text-neutral-ink font-jp tracking-tighter italic">
                          {currentQuestion.kanji}
                        </span>
                      </div>

                      {/* Card Content Section */}
                      <div className="flex-1 text-center md:text-left space-y-8">
                        <div className="space-y-2">
                          <div className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em] font-display italic">Spectral Signature</div>
                          <div className="text-4xl font-black flex items-center justify-center md:justify-start gap-4">
                            <span className="text-neutral-ink italic tracking-tight">
                              {currentQuestion.kanji}
                            </span>
                            <button
                              onClick={playKanjiAudio}
                              className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 text-neutral-ink hover:text-primary hover:border-primary/20 flex items-center justify-center transition-all "
                            >
                              <FontAwesomeIcon icon={faPlayCircle} className="w-5 h-5" />
                            </button>
                          </div>
                          <div className="text-xl font-bold text-neutral-ink italic">
                            {currentQuestion.reading}
                          </div>
                        </div>

                        <div className="space-y-6 pt-6 border-t border-slate-50">
                          <div className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em] font-display">Compound Pattern</div>
                          <div className="bg-slate-50 rounded-[2rem] p-6 border border-slate-100  space-y-4">
                            <div className="flex items-center justify-between">
                              <div className="text-2xl font-black text-neutral-ink italic tracking-tight font-jp">
                                {currentQuestion.exampleWord}
                              </div>
                              <button
                                onClick={handlePlayAudio}
                                className="w-10 h-10 rounded-xl bg-white border border-slate-100 text-neutral-ink hover:text-primary flex items-center justify-center transition-all "
                              >
                                <FontAwesomeIcon icon={faPlayCircle} className="w-4 h-4" />
                              </button>
                            </div>
                            <audio
                              ref={audioRef}
                              src={currentQuestion.audio}
                              preload="auto"
                            ></audio>
                            <div className="text-sm font-bold text-neutral-ink italic">
                              {currentQuestion.exampleReading}
                            </div>
                            <div className="text-base font-medium text-slate-600 italic">
                              {currentQuestion.translation}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between items-center w-full mt-10 px-6 relative z-20">
                      <button
                        className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 text-neutral-ink hover:text-primary hover:border-primary/20 flex items-center justify-center transition-all "
                        onClick={handlePreviousQuestion}
                      >
                        <FontAwesomeIcon icon={faArrowLeft} className="w-5 h-5" />
                      </button>

                      <div className="flex bg-slate-50 rounded-2xl p-1.5 border border-slate-100">
                        {["easy", "medium", "hard"].map((level, idx) => (
                          <button
                            key={idx}
                            className={`py-2 px-6 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all
                              ${difficulty === level
                                ? "bg-primary text-white  scale-105"
                                : "text-neutral-ink hover:text-slate-600"
                              }`}
                            onClick={() => handleDifficultySelection(level)}
                          >
                            {level}
                          </button>
                        ))}
                      </div>

                      <button
                        className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 text-neutral-ink hover:text-primary hover:border-primary/20 flex items-center justify-center transition-all "
                        onClick={handleNextQuestion}
                      >
                        <FontAwesomeIcon icon={faArrowRight} className="w-5 h-5" />
                      </button>
                    </div>

                    <button
                      onClick={() => setIsOpen(false)}
                      className="mt-8 text-[10px] font-black text-slate-300 uppercase tracking-[0.4em] hover:text-primary transition-all font-display italic"
                    >
                      Termination Signal
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition.Root>
    </>
  );
};

export default ComplexFlashcardModal;








// ------------------------ OLD CODE ------------------------------


{/* <div className="bg-white dark:bg-gray-800 rounded-lg  ">
        <div className="p-4">
          <div className="uppercase tracking-wide text-sm text-neutral-ink dark:text-neutral-ink font-semibold">
            Level: {p_tag}
          </div>
          <a
            href="#"
            className="block mt-1 text-lg leading-tight font-medium text-black dark:text-white"
          >
            Kanji with one reading {s_tag}
          </a>
          <p className="mt-2 text-neutral-ink dark:text-neutral-ink">
            Explore the kanji readings and levels interactively.
          </p>
          <div className="mt-4 flex items-center justify-center">
            <button
              type="button"
              onClick={openModal}
              className="mt-3 w-full inline-block rounded-md bg-gray-200 hover:bg-gray-300 focus:bg-gray-400 text-neutral-ink dark:bg-gray-700 dark:hover:bg-gray-600 dark:focus:bg-gray-500 dark:text-neutral-ink text-sm px-4 py-2 focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-600"
            >
              Open dialog
            </button>
          </div>
        </div>
      </div> */}





{/* <div className="bg-white dark:bg-gray-800 rounded-lg  m-4">
  <div className="p-4">
    <div className="uppercase tracking-wide text-sm text-neutral-ink dark:text-neutral-ink font-semibold">
      Level: {p_tag}
    </div>
    <a
      href="#"
      className="block mt-1 text-lg leading-tight font-medium text-black dark:text-white"
    >
      Kanji with one reading {s_tag}
    </a>
    <p className="mt-2 text-neutral-ink dark:text-neutral-ink">
      Explore the kanji readings and levels interactively.
    </p>
    <div className="mt-4 flex items-center justify-center">
      <button
        type="button"
        onClick={openModal}
        className="mt-3 w-full inline-block rounded-md bg-gray-200 hover:bg-gray-300 focus:bg-gray-400 text-neutral-ink dark:bg-gray-700 dark:hover:bg-gray-600 dark:focus:bg-gray-500 dark:text-neutral-ink text-sm px-4 py-2 focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-600"
      >
        Open dialog
      </button>
    </div>
  </div>
</div> */}


{/* <div className="bg-white dark:bg-gray-900 rounded-lg shadow overflow-hidden m-4 transition duration-500 ease-in-out transform hover:-translate-y-1 hover:">
  <div className="p-6">
    <div className="text-xs font-semibold text-neutral-ink dark:text-neutral-ink uppercase tracking-wide">
      Level: {p_tag}
    </div>
    <a
      href="#"
      className="block mt-2 text-lg leading-tight font-medium text-neutral-ink dark:text-white hover:text-blue-500 dark:hover:text-blue-400 hover:underline"
      aria-label={`Kanji with one reading ${s_tag}`}
    >
      Kanji with one reading {s_tag}
    </a>
    <p className="mt-3 text-neutral-ink dark:text-neutral-ink">
      Explore the kanji readings and levels interactively.
    </p>
  </div>
  <div className="px-6 py-4 bg-gray-100 dark:bg-gray-800">
    <button
      type="button"
      onClick={openModal}
      className="w-full inline-flex justify-center items-center rounded-md bg-blue-500 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 text-white text-sm px-4 py-2 transition-colors duration-150"
    >
      Open dialog
    </button>
  </div>
</div> */}