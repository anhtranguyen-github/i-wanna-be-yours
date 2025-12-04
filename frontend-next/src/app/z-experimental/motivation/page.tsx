// 'use client';

// pages/index.js

import type { Metadata } from 'next';
import MotivationForm from '@/components/MotivationForm';

export const metadata: Metadata = {
  title: 'Japanese Learning Dashboard',
};

export default function Home() {
  return (
    <div>


      <main>
        <MotivationForm />
      </main>
    </div>
  );
}

// ----------------------------- //






