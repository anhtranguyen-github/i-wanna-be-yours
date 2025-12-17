"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import axios from "axios";
import { useUser } from "@/context/UserContext";
import { Plus, Headphones, User, ChevronDown, Trash2 } from "lucide-react";
import { useAuthPrompt } from "@/components/auth/AuthPromptModal";

// ============================================
// Types
// ============================================

interface Video {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  internalLink: string;
}

interface CustomVideoInput {
  url: string;
  customTitle: string;
  customDescription: string;
  userId: string;
  p_tag: string;
  s_tag: string;
  lang: string;
}

// ============================================
// Helper Functions
// ============================================

const getVideoId = (url: string): string | null => {
  try {
    const urlObj = new URL(url);
    return urlObj.searchParams.get("v");
  } catch {
    return null;
  }
};

const getVideoData = (video: any): Video => {
  const videoId = getVideoId(video.url);
  return {
    id: video._id || videoId || Math.random().toString(),
    title: video.customTitle || "Untitled Video",
    description: video.customDescription || "",
    thumbnail: videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : "",
    internalLink: videoId ? `/tools/text-parser?type=youtube&url=https://www.youtube.com/watch?v=${videoId}` : "#",
  };
};

// ============================================
// Static Podcast Data
// ============================================

const podcasts = [
  { url: "https://www.youtube.com/watch?v=-cbuS40rNSw", customTitle: "BSJ Podcast) 仕事", customDescription: "Bite Size Japanese podcast about work" },
  { url: "https://www.youtube.com/watch?v=UQ05S65tKPc", customTitle: "BSJ Podcast) 外国人", customDescription: "Bite Size Japanese podcast" },
];

const commonSituations = [
  { url: "https://www.youtube.com/watch?v=ihRjDwIyxk0", customTitle: "【日本語の会話】飲食店で注文", customDescription: "Ordering at restaurants" },
  { url: "https://www.youtube.com/watch?v=X9auVKiZgsM", customTitle: "ホテルに泊まる時使う日本語", customDescription: "Hotel vocabulary" },
  { url: "https://www.youtube.com/watch?v=eShOGfMx9FI", customTitle: "市場で買い物するときの日本語", customDescription: "Shopping at markets" },
  { url: "https://www.youtube.com/watch?v=faKYinAtlIo", customTitle: "Helpful Japanese at Restaurants", customDescription: "Restaurant vocabulary" },
  { url: "https://www.youtube.com/watch?v=r20IdWOSBFE", customTitle: "Cafe Conversation", customDescription: "Ordering at cafes" },
];

const youtubeChannels = [
  { name: "Bite Size Japanese", url: "https://www.youtube.com/@the_bitesize_japanese_podcast", category: "Podcasts" },
  { name: "Yoshie Wasabi Listening", url: "https://www.youtube.com/@Wasabito.Listening.Japanese", category: "Podcasts" },
  { name: "YUYU日本語Podcast", url: "https://www.youtube.com/@yuyunihongopodcast", category: "Podcasts" },
  { name: "Akane Nihongo", url: "https://www.youtube.com/@Akane-JapaneseClass", category: "Daily Situations" },
  { name: "Japanese Listening Shower", url: "https://www.youtube.com/@Japanese-Listening-Shower", category: "Long Form" },
  { name: "Nihongo No Mori", url: "https://www.youtube.com/@nihongonomori2013", category: "Grammar" },
  { name: "Game Gengo", url: "https://www.youtube.com/@GameGengo", category: "Grammar" },
];

// ============================================
// Components
// ============================================

interface VideoSectionProps {
  title: string;
  videos: Video[];
  onDelete?: (id: string) => void;
  icon?: React.ReactNode;
  defaultOpen?: boolean;
}

function VideoSection({ title, videos, onDelete, icon, defaultOpen = true }: VideoSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="mb-8">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex justify-between items-center w-full text-left text-xl font-display font-bold mb-4 p-4 bg-white rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all focus:outline-none text-brand-dark"
      >
        <span className="flex items-center gap-3">
          {icon}
          {title}
          <span className="text-sm font-normal text-slate-400">({videos.length})</span>
        </span>
        <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {videos.map((video) => (
            <div key={video.id} className="clay-card overflow-hidden cursor-pointer hover:-translate-y-1 bg-white relative group">
              <Link href={video.internalLink}>
                <div className="relative">
                  <img src={video.thumbnail} alt={video.title} className="w-full h-40 object-cover" />
                  <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-all" />
                </div>
                <div className="p-4">
                  <h3 className="text-sm font-bold text-brand-dark leading-tight mb-1 line-clamp-2">{video.title}</h3>
                  <p className="text-xs text-gray-500 line-clamp-2">{video.description}</p>
                </div>
              </Link>
              {onDelete && (
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete(video.id); }}
                  className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================
// Main Component
// ============================================

export default function PodcastsPage() {
  const { user } = useUser();
  const { showAuthPrompt, AuthPrompt } = useAuthPrompt();
  const userId = user?.id ? String(user.id) : "";
  const isGuest = !user;

  const [customVideos, setCustomVideos] = useState<Video[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newVideo, setNewVideo] = useState<CustomVideoInput>({
    url: "",
    customTitle: "",
    customDescription: "",
    userId: "",
    p_tag: "youtube",
    s_tag: "video",
    lang: "jp",
  });

  // Static videos
  const podcastVideos = podcasts.map(getVideoData);
  const situationVideos = commonSituations.map(getVideoData);

  useEffect(() => {
    setNewVideo((prev) => ({ ...prev, userId }));
    fetchCustomVideos();
  }, [userId]);

  const fetchCustomVideos = async () => {
    try {
      const response = await axios.get("/f-api/v1/custom-videos");
      setCustomVideos(response.data.map(getVideoData));
    } catch (error) {
      console.error("Error fetching custom videos:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await axios.post("/f-api/v1/custom-videos", newVideo);
      setCustomVideos([...customVideos, getVideoData(response.data)]);
      setNewVideo((prev) => ({ ...prev, url: "", customTitle: "", customDescription: "" }));
      setShowAddForm(false);
    } catch (error) {
      console.error("Error posting new video:", error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await axios.delete(`/f-api/v1/custom-videos/${id}`);
      setCustomVideos(customVideos.filter((video) => video.id !== id));
    } catch (error) {
      console.error("Error deleting video:", error);
    }
  };

  return (
    <>
      <AuthPrompt />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-brand-cream/30">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-display font-extrabold text-brand-dark mb-2">
                Podcasts & Videos
              </h1>
              <p className="text-gray-500">Japanese listening practice from YouTube</p>
            </div>
            <button
              onClick={() => {
                if (isGuest) {
                  showAuthPrompt(
                    'Personal Video Library',
                    'Add your own YouTube videos to your personal learning library.'
                  );
                } else {
                  setShowAddForm(!showAddForm);
                }
              }}
              className="flex items-center gap-2 px-4 py-2 bg-brand-green text-white font-bold rounded-xl hover:bg-brand-green/90 transition-all shadow-sm"
            >
              <Plus size={20} />
              Add Your Video
            </button>
          </div>

          {/* Add Video Form */}
          {showAddForm && !isGuest && (
            <div className="clay-card p-6 mb-8 bg-white">
              <h2 className="text-xl font-bold text-brand-dark mb-4">Add Custom YouTube Video</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-brand-dark font-medium mb-1 text-sm">YouTube URL</label>
                  <input
                    type="text"
                    value={newVideo.url}
                    onChange={(e) => setNewVideo({ ...newVideo, url: e.target.value })}
                    className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-green focus:border-brand-green"
                    placeholder="https://www.youtube.com/watch?v=..."
                    required
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-brand-dark font-medium mb-1 text-sm">Title (optional)</label>
                    <input
                      type="text"
                      value={newVideo.customTitle}
                      onChange={(e) => setNewVideo({ ...newVideo, customTitle: e.target.value })}
                      className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-green focus:border-brand-green"
                      placeholder="Custom title"
                    />
                  </div>
                  <div>
                    <label className="block text-brand-dark font-medium mb-1 text-sm">Description (optional)</label>
                    <input
                      type="text"
                      value={newVideo.customDescription}
                      onChange={(e) => setNewVideo({ ...newVideo, customDescription: e.target.value })}
                      className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-green focus:border-brand-green"
                      placeholder="Short description"
                    />
                  </div>
                </div>
                <div className="flex gap-3">
                  <button type="submit" className="px-6 py-2 bg-brand-green text-white font-bold rounded-xl hover:bg-brand-green/90">
                    Add Video
                  </button>
                  <button type="button" onClick={() => setShowAddForm(false)} className="px-6 py-2 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* My Videos Section */}
          {customVideos.length > 0 && (
            <VideoSection
              title="My Videos"
              videos={customVideos}
              onDelete={handleDelete}
              icon={<User className="w-5 h-5 text-brand-green" />}
            />
          )}

          {/* Recommended Channels */}
          <div className="mb-8 p-6 bg-white rounded-2xl border border-slate-100">
            <h2 className="text-lg font-bold text-brand-dark mb-4">Recommended YouTube Channels</h2>
            <div className="flex flex-wrap gap-2">
              {youtubeChannels.map((channel) => (
                <a
                  key={channel.name}
                  href={channel.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-slate-50 text-slate-600 text-sm font-medium rounded-lg hover:bg-brand-blue hover:text-white transition-all"
                >
                  {channel.name}
                </a>
              ))}
            </div>
          </div>

          {/* Curated Videos */}
          <VideoSection
            title="Podcasts"
            videos={podcastVideos}
            icon={<Headphones className="w-5 h-5 text-brand-blue" />}
          />

          <VideoSection
            title="Common Situations"
            videos={situationVideos}
            icon={<Headphones className="w-5 h-5 text-brand-peach" />}
            defaultOpen={false}
          />
        </div>
      </div>
    </>
  );
}
