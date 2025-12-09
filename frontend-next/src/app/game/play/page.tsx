import React from "react";

export default function PlayGames() {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-5">Play Games (Coming Soon!)</h2>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="border rounded bg-gray-50 dark:bg-gray-100 p-5 flex flex-col items-center">
          <span className="text-3xl mb-2">🎮</span>
          <div className="font-bold text-lg mb-1">Kanji Match</div>
          <p className="text-gray-600 text-center">Match kanji with their meanings in a fun memory game. Improve your quick recognition and test your knowledge!</p>
        </div>
        <div className="border rounded bg-gray-50 dark:bg-gray-100 p-5 flex flex-col items-center">
          <span className="text-3xl mb-2">🀄</span>
          <div className="font-bold text-lg mb-1">JLPT Quiz Demo</div>
          <p className="text-gray-600 text-center">Take a sample JLPT-style challenge with instant feedback. Coming Soon!</p>
        </div>
      </div>
    </div>
  );
}
