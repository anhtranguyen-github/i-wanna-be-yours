'use client';

import React, { useState } from 'react';
import { useUser } from '@/context/UserContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { UserIcon } from './icons';

const LoginButton = () => {
  const { user, logout } = useUser();
  const [showDropdown, setShowDropdown] = useState(false);
  const router = useRouter();

  if (user) {
    return (
      <div className="flex items-center space-x-4">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
          Welcome back ! {user.email}
        </span>
        <button
          onClick={() => logout()}
          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
        >
          Log out
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-4">
      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
        not log in
      </span>
      <Link
        href="/login"
        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-full font-medium transition-colors"
      >
        Log in
      </Link>
    </div>
  );
};

export default LoginButton;
