"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import axios from "axios";
import { useUser } from "@/context/UserContext";
import { Plus, Headphones, User, ChevronDown, Trash2 } from "lucide-react";
import { useGlobalAuth } from "@/context/GlobalAuthContext";

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
    <div className="mb-10 last:mb-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex justify-between items-center w-full text-left p-6 bg-card rounded-2xl  border border-border hover: transition-all focus:outline-none group/btn"
      >
        <span className="flex items-center gap-4 text-xl font-black text-foreground font-display">
          <div className={`p-3 rounded-xl bg-muted/50 group-hover/btn:bg-primary/10 group-hover/btn:text-primary transition-colors`}>
            {icon}
          </div>
          {title}
          <span className="text-xs font-black text-neutral-ink uppercase tracking-widest ml-2">({videos.length})</span>
        </span>
        <ChevronDown className={`w-6 h-6 text-muted-foreground transition-transform duration-500 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 py-8 animate-in fade-in slide-in-from-top-4 duration-500">
          {videos.map((video) => (
            <div key={video.id} className="group relative bg-card rounded-2xl overflow-hidden border border-border  hover:  transition-all duration-500">
              <Link href={video.internalLink}>
                <div className="relative aspect-video overflow-hidden">
                  <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover group- transition-transform duration-700" />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-all" />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center ">
                      <Headphones size={24} />
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-sm font-black text-foreground mb-2 line-clamp-2 font-display leading-tight group-hover:text-primary transition-colors">{video.title}</h3>
                  <p className="text-xs font-bold text-muted-foreground line-clamp-2 leading-relaxed">{video.description}</p>
                </div>
              </Link>
              {onDelete && (
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete(video.id); }}
                  className="absolute top-3 right-3 p-2.5 bg-destructive text-destructive-foreground rounded-xl opacity-0 group-hover:opacity-100 transition-all  "
                  title="Remove Video"
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



// ... (keep previous lines)

export default function PodcastsPage() {
  const { user } = useUser();
  const { openAuth } = useGlobalAuth();
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
    <div className="min-h-screen bg-background p-6 md:p-12">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div>
            <h1 className="text-4xl md:text-5xl font-black text-foreground mb-3 font-display tracking-tight">
              Podcasts & <span className="text-primary">Videos</span>
            </h1>
            <p className="text-muted-foreground font-bold text-sm">Japanese listening practice from YouTube</p>
          </div>
          <button
            onClick={() => {
              if (isGuest) {
                openAuth('REGISTER', {
                  flowType: 'LIBRARY',
                  title: 'Personal Video Library',
                  description: 'Add your own YouTube videos to your personal learning library.'
                });
              } else {
                setShowAddForm(!showAddForm);
              }
            }}
            className="flex items-center gap-3 px-8 py-4 bg-foreground text-background font-black rounded-2xl hover:opacity-90 active:scale-95 transition-all  font-display uppercase tracking-widest text-[11px]"
          >
            <Plus size={20} />
            Add Your Video
          </button>
        </div>

        {/* Add Video Form */}
        {showAddForm && !isGuest && (
          <div className="bg-card p-10 rounded-2xl border border-border  animate-in zoom-in-95 duration-300">
            <h2 className="text-2xl font-black text-foreground mb-8 font-display">Add Custom YouTube Video</h2>
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="space-y-3">
                <label className="block text-[10px] font-black text-neutral-ink uppercase tracking-[0.2em] font-display ml-4">YouTube URL</label>
                <input
                  type="text"
                  value={newVideo.url}
                  onChange={(e) => setNewVideo({ ...newVideo, url: e.target.value })}
                  className="w-full p-6 bg-muted/30 border-none rounded-2xl focus:ring-4 focus:ring-primary/10 font-bold placeholder:text-neutral-ink "
                  placeholder="https://www.youtube.com/watch?v=..."
                  required
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="block text-[10px] font-black text-neutral-ink uppercase tracking-[0.2em] font-display ml-4">Title (optional)</label>
                  <input
                    type="text"
                    value={newVideo.customTitle}
                    onChange={(e) => setNewVideo({ ...newVideo, customTitle: e.target.value })}
                    className="w-full p-6 bg-muted/30 border-none rounded-2xl focus:ring-4 focus:ring-primary/10 font-bold placeholder:text-neutral-ink "
                    placeholder="Custom title"
                  />
                </div>
                <div className="space-y-3">
                  <label className="block text-[10px] font-black text-neutral-ink uppercase tracking-[0.2em] font-display ml-4">Description (optional)</label>
                  <input
                    type="text"
                    value={newVideo.customDescription}
                    onChange={(e) => setNewVideo({ ...newVideo, customDescription: e.target.value })}
                    className="w-full p-6 bg-muted/30 border-none rounded-2xl focus:ring-4 focus:ring-primary/10 font-bold placeholder:text-neutral-ink "
                    placeholder="Short description"
                  />
                </div>
              </div>
              <div className="flex gap-4 pt-4">
                <button type="submit" className="px-10 py-4 bg-primary text-primary-foreground font-black rounded-2xl hover:opacity-90  font-display uppercase tracking-widest text-xs">
                  Add Video
                </button>
                <button type="button" onClick={() => setShowAddForm(false)} className="px-10 py-4 bg-muted text-muted-foreground font-black rounded-2xl hover:bg-muted/80 font-display uppercase tracking-widest text-xs">
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
        <div className="bg-card p-8 rounded-2xl border border-border ">
          <h2 className="text-[10px] font-black text-neutral-ink uppercase tracking-[0.2em] mb-6 font-display ml-2">Recommended YouTube Channels</h2>
          <div className="flex flex-wrap gap-3">
            {youtubeChannels.map((channel) => (
              <a
                key={channel.name}
                href={channel.url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-2 bg-muted/50 text-muted-foreground text-xs font-black rounded-full hover:bg-primary hover:text-white transition-all font-display uppercase tracking-widest "
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
  );
}

