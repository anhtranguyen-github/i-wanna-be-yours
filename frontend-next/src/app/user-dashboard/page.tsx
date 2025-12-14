"use client";

import { useState } from "react";
import { useEffect } from "react";
import { useUser } from "@/context/UserContext";
import { useRouter } from "next/navigation";

// import LoginStreakGraph from "@/components/LoginStreakGraph";
// import LearningProgressFlask from "@/components/LearningProgressFlask";

import MotivationForm from "@/components/MotivationForm";

import { getUserFromCookies } from "@/utils/helperFunctions";

import dynamic from "next/dynamic";

const LoginStreakGraph = dynamic(
  () => import("@/components/LoginStreakGraph"),
  {
    ssr: false,
  }
);

const LearningProgressFlask = dynamic(
  () => import("@/components/LearningProgressFlask"),
  {
    ssr: false,
  }
);

interface LoginData {
  date: string;
  count: number;
}

interface LoginResponse {
  message?: string;
  error?: string;
}

const loginData = [
  { date: "2024-02-01", count: 1 },
  { date: "2024-02-02", count: 2 },
  { date: "2024-02-03", count: 3 },
  { date: "2024-02-04", count: 4 },
  { date: "2024-02-05", count: 5 },
  // Add more data points here
];

export default function Home() {
  const { user, loading } = useUser();
  const router = useRouter();

  const [loginStreakData, setLoginStreakData] = useState<LoginData[]>([]);
  const [loginHistory, setLoginHistory] = useState<LoginData[]>([]);
  const [longestStreak, setLongestStreak] = useState(0);

  const [showKanjiGraphs, setShowKanjiGraphs] = useState(false);
  const [showEssentialVerbs, setShowEssentialVerbs] = useState(false);
  const [showEssentialSuruVerbs, setShowEssentialSuruVerbs] = useState(false);
  const [showGrammar, setShowGrammar] = useState(false);

  const userId = user?.id?.toString(); // Adapt to existing component expectations

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    // Exit the hook if userId is null, undefined, or an empty string
    if (!userId) {
      return;
    }

    const fetchLoginStreakData = async () => {
      try {
        const response = await fetch(`/f-api/v1/get-logins/${userId}`, {
          method: "GET",
        });
        const data = await response.json();
        console.log(data);
        setLoginStreakData(data);
      } catch (error) {
        console.error("Error fetching login streak data:", error);
      }
    };

    fetchLoginStreakData();
  }, [userId]); // This effect depends on 'userId', so it will re-run when 'userId' changes

  // const fetchLoginHistory = async () => {
  //   const userId = "testUser"; // Dynamically set this to the logged-in user's userId
  //   try {
  //     const response = await fetch(`/f-api/v1/get-logins/${userId}`, {
  //       method: "GET",
  //     });
  //     const data = await response.json();
  //     console.log(data);
  //     setLoginHistory(data);
  //     // Use the data as needed
  //   } catch (error) {
  //     console.error("Error fetching login history:", error);
  //   }
  // };

  // const fetchLongestStreak = async () => {
  //   const userId = "testUser"; // Adjust according to your app logic
  //   try {
  //     const response = await fetch(`/f-api/v1/streak/${userId}`, {
  //       method: "GET",
  //     });
  //     const data = await response.json();
  //     if (data.longest_streak !== undefined) {
  //       setLongestStreak(data.longest_streak);
  //     } else {
  //       console.error("Could not fetch the longest streak", data.error);
  //     }
  //   } catch (error) {
  //     console.error("Error fetching the longest streak:", error);
  //   }
  // };

  if (loading) return <div>Loading...</div>;
  if (!user) return null;

  return (
    <div className="bg-brand-cream text-brand-dark min-h-screen">
      <div className="bg-brand-cream min-h-screen relative p-10">
        {/* <br />
        <button onClick={fetchLoginHistory}>Show Login History</button>
        <div>
          {loginHistory.map((login, index) => (
            <div key={index}>{`date: ${login.date}, count: ${login.count}`}</div>
          ))}
        </div>
        <br />
        <div>
          <button onClick={fetchLongestStreak}>Show Longest Streak</button>
          {longestStreak > 0 && <p>Longest Streak: {longestStreak} days</p>}
        </div>
        <br />
        <br /> */}

        <div className="flex flex-col items-center px-2 py-4">
          <h1 className="text-lg font-bold mb-2">User Login Streak</h1>
          <div className="w-full">
            <LoginStreakGraph data={loginStreakData} />
          </div>
        </div>

        <MotivationForm />

        <div className="flex flex-col items-center px-2 py-4">
          <h1 className="text-lg font-bold mb-4">Deck Learning Progress</h1>

          {/* Kanji Section */}
          <div className="w-full">
            <button
              onClick={() => setShowKanjiGraphs(!showKanjiGraphs)}
              className="clay-button w-full text-left px-4 py-2 bg-white hover:bg-brand-blue/20 focus:outline-none focus:ring-2 focus:ring-brand-blue"
            >
              <span className="text-xl font-bold text-brand-dark">Kanji</span>
              <span className="float-right text-brand-dark">{showKanjiGraphs ? "▲" : "▼"}</span>
            </button>

            <a
              href="/flashcards"
              className="text-brand-blue hover:text-brand-dark font-bold transition duration-300 p-2 block mt-2"
            >
              Flashcards - Kanji
            </a>

            {showKanjiGraphs && (
              <div className="flex flex-wrap justify-center gap-4 p-4 w-full">
                {[
                  "part_1",
                  "part_2",
                  "part_3",
                  "part_4",
                  "part_5",
                  "part_6",
                ].map((part, index) => (
                  <div
                    key={index}
                    className="w-full max-w-xs p-2 bg-white clay-card"
                  >
                    <LearningProgressFlask
                      userId={userId}
                      collectionName="kanji"
                      p_tag="JLPT_N3"
                      s_tag={part}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Vocabulary Section */}
          <div className="w-full mt-4">
            <button
              onClick={() => setShowEssentialVerbs(!showEssentialVerbs)}
              className="clay-button w-full text-left px-4 py-2 bg-white hover:bg-brand-blue/20 focus:outline-none focus:ring-2 focus:ring-brand-blue"
            >
              <span className="text-xl font-bold text-brand-dark">Essential Verbs</span>
              <span className="float-right text-brand-dark">
                {showEssentialVerbs ? "▲" : "▼"}
              </span>
            </button>

            <a
              href="/flashcards"
              className="text-brand-blue hover:text-brand-dark font-bold transition duration-300 p-2 block mt-2"
            >
              Flashcards - Essential Verbs
            </a>

            {showEssentialVerbs && (
              <div className="flex flex-wrap justify-center gap-4 p-4 w-full">
                {[
                  "verbs-1",
                  "verbs-2",
                  "verbs-3",
                  "verbs-4",
                  "verbs-5",
                  "verbs-6",
                  "verbs-7",
                  "verbs-8",
                ].map((part, index) => (
                  <div
                    key={index}
                    className="w-full max-w-xs p-2 bg-white clay-card"
                  >
                    <LearningProgressFlask
                      userId={userId}
                      collectionName="words"
                      p_tag="essential_600_verbs"
                      s_tag={part}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Essential Suru Verbs Section */}
          <div className="w-full mt-4">
            <button
              onClick={() => setShowEssentialSuruVerbs(!showEssentialSuruVerbs)}
              className="clay-button w-full text-left px-4 py-2 bg-white hover:bg-brand-blue/20 focus:outline-none focus:ring-2 focus:ring-brand-blue"
            >
              <span className="text-xl font-bold text-brand-dark">Essential Suru Verbs</span>
              <span className="float-right text-brand-dark">
                {showEssentialSuruVerbs ? "▲" : "▼"}
              </span>
            </button>

            <a
              href="/flashcards"
              className="text-brand-blue hover:text-brand-dark font-bold transition duration-300 p-2 block mt-2"
            >
              Flashcards - Essential Suru Verbs
            </a>

            {showEssentialSuruVerbs && (
              <div className="flex flex-wrap justify-center gap-4 p-4 w-full">
                {[
                  "verbs-1",
                  "verbs-2",
                  "verbs-3",
                  "verbs-4",
                  "verbs-5",
                  "verbs-6",
                ].map((part, index) => (
                  <div
                    key={index}
                    className="w-full max-w-xs p-2 bg-white clay-card"
                  >
                    <LearningProgressFlask
                      userId={userId}
                      collectionName="words"
                      p_tag="suru_essential_600_verbs"
                      s_tag={part}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>


          {/* Grammar Section */}
          <div className="w-full mt-4">
            <button
              onClick={() => setShowGrammar(!showGrammar)}
              className="clay-button w-full text-left px-4 py-2 bg-white hover:bg-brand-blue/20 focus:outline-none focus:ring-2 focus:ring-brand-blue"
            >
              <span className="text-xl font-bold text-brand-dark">Grammar JLPT</span>
              <span className="float-right text-brand-dark">{showGrammar ? "▲" : "▼"}</span>
            </button>

            <a
              href="/japanese/flashcards"
              className="text-brand-blue hover:text-brand-dark font-bold transition duration-300 p-2 block mt-2"
            >
              Flashcards - JLPT Grammar
            </a>

            {showGrammar && (
              <div className="flex flex-wrap justify-center gap-4 p-4 w-full">
                {["JLPT_N5", "JLPT_N4", "JLPT_N3", "JLPT_N2", "JLPT_N1",].map((part, index) => (
                  <div
                    key={index}
                    className="w-full max-w-xs p-2 bg-white clay-card"
                  >
                    <LearningProgressFlask
                      userId={userId}
                      collectionName="grammars"
                      p_tag={part}
                      s_tag="all"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>










        </div>
      </div>
    </div>
  );
}

// ---------------------- OLD CODE -----------------------------

// const handleLogin = () => {
//   // Simulate login process, here you'd usually authenticate user credentials
//   const user = "testUser";
//
//   // Set logged in user to cookies
//   localStorage.setItem("loggedInUser", user);
//   setLoggedIn(true);
//   setuserId(user);
// };

// const loginData = [
//     { date: '2024-01-01', count: 5 },
//     { date: '2024-01-02', count: 4 },
//     { date: '2024-01-03', count: 2 },
//     { date: '2024-01-04', count: 5 },
//     { date: '2024-01-05', count: 3 },
//     { date: '2024-01-06', count: 4 },
//     { date: '2024-01-07', count: 0 },
//     { date: '2024-01-08', count: 4 },
//     { date: '2024-01-09', count: 5 },
//     { date: '2024-01-10', count: 3 },
//     { date: '2024-01-11', count: 1 },
//     { date: '2024-01-12', count: 1 },
//     { date: '2024-01-13', count: 5 },
//     { date: '2024-01-19', count: 1 },
//     { date: '2024-01-20', count: 2 },
//     { date: '2024-01-21', count: 1 },
//     { date: '2024-01-22', count: 4 },
//     { date: '2024-01-23', count: 1 },
//     { date: '2024-01-24', count: 4 },
//     { date: '2024-01-25', count: 2 },
//     { date: '2024-01-26', count: 1 },
//     { date: '2024-01-27', count: 0 },
//     { date: '2024-01-28', count: 5 },
//     { date: '2024-01-29', count: 2 },
//     { date: '2024-01-30', count: 1 }
//   ];
