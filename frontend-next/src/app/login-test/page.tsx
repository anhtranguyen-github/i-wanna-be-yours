'use client';

import React from "react";
import LoginButton from "@/components/LoginButton";
import UserDisplay from "@/components/UserDisplay";

import { useUser } from "@/context/UserContext";

const HomePage: React.FC = () => {
  // Access user context
  const { user } = useUser();
  const userId = user?.id;
  const loggedIn = !!user;

  return (
    <>
      <LoginButton />
      <UserDisplay />
      <div className="mt-4 text-center">
        {loggedIn ? (
          <p className="text-lg font-bold text-brand-green">
            User ID: {userId}
          </p>
        ) : (
          <p className="text-lg font-bold text-brand-peach">
            No User ID Available
          </p>
        )}
      </div>
    </>
  );
};

export default HomePage;
