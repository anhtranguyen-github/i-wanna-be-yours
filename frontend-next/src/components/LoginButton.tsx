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
        <span className="text-sm font-bold text-brand-dark">
          Welcome back ! {user.email}
        </span>
        <button
          onClick={() => logout()}
          className="clay-button bg-brand-peach hover:bg-brand-peach/90 text-brand-dark px-4 py-2 text-sm font-bold"
        >
          Log out
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-4">
      <span className="text-sm font-bold text-brand-dark/60">
        not log in
      </span>
      <Link
        href="/login"
        className="clay-button bg-brand-green hover:bg-brand-green/90 text-brand-dark px-6 py-2 font-bold"
      >
        Log in
      </Link>
    </div>
  );
};

export default LoginButton;
