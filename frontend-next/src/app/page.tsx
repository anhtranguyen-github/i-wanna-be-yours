import { redirect } from 'next/navigation';

// Root route now redirects to chat (the main app)
export default function Home() {
  redirect('/chat');
}
