"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import axios from "axios";
import { getUserFromCookies } from "@/utils/helperFunctions";

import { useUser } from "@/context/UserContext";


const Home = () => {
  const [customVideos, setCustomVideos] = useState([]);
  const [newVideo, setNewVideo] = useState({
    url: "",
    customTitle: "",
    customDescription: "",
    userId: "", // empty userId initially
    p_tag: "youtube", // New field
    s_tag: "video", // New field
    lang: "jp", // New field with default value
  });

  const { user } = useUser();
  const userId = user?.id ? String(user.id) : "";
  const loggedIn = !!user;


  useEffect(() => {
    //const { userId, jwt } = getUserFromCookies();
    setNewVideo((prev) => ({ ...prev, userId }));
    //axios.defaults.headers.common['Authorization'] = `Bearer ${jwt}`;
  }, []);

  useEffect(() => {
    // Fetch custom videos from backend
    fetchCustomVideos();
  }, []);

  const fetchCustomVideos = async () => {
    try {
      const response = await axios.get("/f-api/v1/custom-videos");
      setCustomVideos(response.data.map(getVideoData));
    } catch (error) {
      console.error("Error fetching custom videos:", error);
    }
  };

  const handleInputChange = (e) => {
    setNewVideo({ ...newVideo, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post("/f-api/v1/custom-videos", newVideo);
      setCustomVideos([...customVideos, getVideoData(response.data)]);

      // Reset specific fields
      setNewVideo((prevState) => ({
        ...prevState, // retain previous values
        url: "", // reset URL
        customTitle: "", // reset title
        customDescription: "", // reset description
        // userId, p_tag, s_tag, and lang can be retained or reset based on your needs
      }));
    } catch (error) {
      console.error("Error posting new video:", error);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/f-api/v1/custom-videos/${id}`);
      setCustomVideos(customVideos.filter((video) => video.id !== id));
    } catch (error) {
      console.error("Error deleting video:", error);
    }
  };

  return (
    <div className="bg-brand-cream min-h-screen p-4">
      <div className="container mx-auto">
        {/* Form to add new custom video */}
        <h1 className="text-3xl font-extrabold mb-8 text-brand-dark text-center">Add Your Custom YouTube Video</h1>
        <form onSubmit={handleSubmit} className="mb-12 bg-white p-6 rounded-xl border-2 border-brand-dark shadow-hard clay-card max-w-2xl mx-auto">
          {/* YouTube Video URL */}
          <div className="mb-4">
            <label className="block text-brand-dark font-bold mb-2">YouTube Video URL:</label>
            <input
              type="text"
              name="url"
              value={newVideo.url}
              onChange={handleInputChange}
              className="mt-1 p-3 w-full border-2 border-brand-dark rounded-xl focus:ring-brand-blue focus:border-brand-blue bg-white text-brand-dark"
              required
            />
          </div>
          {/* Custom Title */}
          <div className="mb-4">
            <label className="block text-brand-dark font-bold mb-2">Custom Title:</label>
            <input
              type="text"
              name="customTitle"
              value={newVideo.customTitle}
              onChange={handleInputChange}
              className="mt-1 p-3 w-full border-2 border-brand-dark rounded-xl focus:ring-brand-blue focus:border-brand-blue bg-white text-brand-dark"
            />
          </div>
          {/* Custom Description */}
          <div className="mb-4">
            <label className="block text-brand-dark font-bold mb-2">Custom Description:</label>
            <textarea
              name="customDescription"
              value={newVideo.customDescription}
              onChange={handleInputChange}
              className="mt-1 p-3 w-full border-2 border-brand-dark rounded-xl focus:ring-brand-blue focus:border-brand-blue bg-white text-brand-dark"
              rows={3}
            />
          </div>
          {/* Submit Button */}
          <button type="submit" className="clay-button bg-brand-blue text-white font-bold p-3 rounded-xl w-full hover:bg-brand-blue/80 transition-all duration-200">
            Add Video
          </button>
        </form>

        {/* Custom Videos Section */}
        <h1 className="text-3xl font-extrabold mb-8 text-brand-dark text-center">Custom YouTube Videos</h1>
        <VideoSection
          title="Custom Videos"
          videos={customVideos}
          onDelete={handleDelete}
        />
      </div>
    </div>
  );
};

export default Home;

// Helper functions
const getVideoId = (url) => {
  const urlObj = new URL(url);
  return urlObj.searchParams.get("v");
};

const getVideoData = (video) => {
  const videoId = getVideoId(video.url);
  return {
    id: video._id || videoId, // Ensure the ID is coming from MongoDB (_id)
    title: video.customTitle || "Untitled Video",
    description: video.customDescription || "",
    thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
    internalLink: `/text-parser?type=youtube&url=https://www.youtube.com/watch?v=${videoId}`,
  };
};

// VideoSection Component
const VideoSection = ({
  title,
  videos,
  onDelete = null,
  initialOpen = true,
}) => {
  const [isOpen, setIsOpen] = useState(initialOpen);

  return (
    <div className="mb-8">
      {/* Collapsible Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="clay-button flex justify-between items-center w-full text-left text-xl font-bold mb-4 p-4 bg-white border-2 border-brand-dark rounded-xl hover:bg-brand-blue/10 focus:outline-none text-brand-dark"
      >
        <span>{title}</span>
        <svg
          className={`w-6 h-6 transform transition-transform duration-200 ${isOpen ? "rotate-180" : ""
            }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Collapsible Content */}
      {isOpen && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {videos.map((video) => (
            <div
              key={video.id}
              className="bg-white rounded-xl border-2 border-brand-dark shadow-hard overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-200 clay-card"
            >
              <Link href={video.internalLink}>
                <div>
                  <img
                    src={video.thumbnail}
                    alt={video.title}
                    className="w-full h-48 object-cover"
                  />
                  <div className="p-4">
                    <h3 className="text-lg font-bold text-brand-dark">{video.title}</h3>
                    <p className="text-brand-dark/70">{video.description}</p>
                  </div>
                </div>
              </Link>
              {onDelete && (
                <div className="p-4">
                  <button
                    onClick={() => onDelete(video.id)}
                    className="mt-2 clay-button bg-brand-peach text-brand-dark font-bold p-2 rounded-xl w-full hover:bg-brand-peach/80 transition-all duration-200"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// CollapsibleSection Component
const CollapsibleSection = ({ title, children, initialOpen = false }) => {
  const [isOpen, setIsOpen] = useState(initialOpen);

  return (
    <div className="mb-8">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex justify-between items-center w-full text-left text-2xl font-bold mt-5 mb-5 p-4 bg-gray-100 hover:bg-gray-200 rounded-md focus:outline-none"
      >
        <span>{title}</span>
        <svg
          className={`w-6 h-6 transform transition-transform duration-200 ${isOpen ? "rotate-180" : ""
            }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Collapsible Content */}
      {isOpen && <div>{children}</div>}
    </div>
  );
};