"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { getUserFromCookies } from "@/utils/helperFunctions";

//import TextModal from './TextModal'; // Adjust path as needed

import { useUser } from "@/context/UserContext";


const JapaneseTexts = () => {
  //const [userId, setUserId] = useState(null);
  const { user } = useUser();
  const userId = user?.id;
  const loggedIn = !!user;



  const [texts, setTexts] = useState([]);
  const [newText, setNewText] = useState({
    topic: "",
    sourceLink: "",
    actualText: "",
    p_tag: "text",
    s_tag: "text",
    userId: "", // empty user initially
    lang: "jp",
  });
  const [selectedText, setSelectedText] = useState(null);

  useEffect(() => {
    if (userId) {
      setNewText((prev) => ({ ...prev, userId: userId.toString() }));
    }
  }, [userId]);

  useEffect(() => {
    fetchTexts(userId);
  }, [userId]);

  const fetchTexts = async (userId) => {
    try {
      const response = await axios.get(`/f-api/v1/japanese-texts/${userId}`);
      setTexts(response.data);
    } catch (error) {
      console.error("Error fetching texts:", error);
    }
  };




  const handleInputChange = (e) => {
    setNewText({ ...newText, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post("/f-api/v1/japanese-texts", newText);
      setTexts([...texts, response.data]);
      setNewText({
        topic: "",
        sourceLink: "",
        actualText: "",
        p_tag: "text",
        s_tag: "text",
        userId: userId ? userId.toString() : "",
        lang: "jp",
      });
    } catch (error) {
      console.error("Error posting new text:", error);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/f-api/v1/japanese-texts/${id}`);
      setTexts(texts.filter((text) => text._id !== id));
      if (selectedText && selectedText._id === id) {
        setSelectedText(null); // Close the modal if the deleted text is currently selected
      }
    } catch (error) {
      console.error("Error deleting text:", error);
    }
  };

  const handleCardClick = (text) => {
    setSelectedText(text);
  };

  const handleCloseModal = () => {
    setSelectedText(null);
  };

  return (
    <div className="p-6 bg-brand-cream min-h-screen">
      <h1 className="text-3xl font-extrabold text-brand-dark mb-6 text-center">
        Add Custom Japanese Text
      </h1>

      <form
        onSubmit={handleSubmit}
        className="space-y-6 bg-white p-6 rounded-xl border-2 border-brand-dark shadow-hard mb-12 max-w-4xl clay-card"
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="block text-sm font-bold text-brand-dark">
              Topic
            </label>
            <input
              type="text"
              name="topic"
              value={newText.topic}
              onChange={handleInputChange}
              className="block w-full border-2 border-brand-dark rounded-xl p-3 focus:ring-brand-blue focus:border-brand-blue sm:text-sm bg-white text-brand-dark"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-bold text-brand-dark">
              Source Link
            </label>
            <input
              type="url"
              name="sourceLink"
              value={newText.sourceLink}
              onChange={handleInputChange}
              className="block w-full border-2 border-brand-dark rounded-xl p-3 focus:ring-brand-blue focus:border-brand-blue sm:text-sm bg-white text-brand-dark"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-bold text-brand-dark">
              Actual Text
            </label>
            <textarea
              name="actualText"
              value={newText.actualText}
              onChange={handleInputChange}
              className="block w-full border-2 border-brand-dark rounded-xl p-3 focus:ring-brand-blue focus:border-brand-blue sm:text-sm bg-white text-brand-dark"
              rows={5}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="block text-sm font-bold text-brand-dark">
              Parent Tag
            </label>
            <input
              type="text"
              name="p_tag"
              value={newText.p_tag}
              onChange={handleInputChange}
              className="block w-full border-2 border-brand-dark rounded-xl p-3 focus:ring-brand-blue focus:border-brand-blue sm:text-sm bg-white text-brand-dark"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-bold text-brand-dark">
              Sub Tag
            </label>
            <input
              type="text"
              name="s_tag"
              value={newText.s_tag}
              onChange={handleInputChange}
              className="block w-full border-2 border-brand-dark rounded-xl p-3 focus:ring-brand-blue focus:border-brand-blue sm:text-sm bg-white text-brand-dark"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="block text-sm font-bold text-brand-dark">
              User ID
            </label>
            <input
              type="text"
              name="userId"
              value={newText.userId}
              onChange={handleInputChange}
              className="block w-full border-2 border-brand-dark rounded-xl p-3 focus:ring-brand-blue focus:border-brand-blue sm:text-sm bg-white text-brand-dark"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-bold text-brand-dark">
              Language
            </label>
            <input
              type="text"
              name="lang"
              value={newText.lang}
              onChange={handleInputChange}
              className="block w-full border-2 border-brand-dark rounded-xl p-3 focus:ring-brand-blue focus:border-brand-blue sm:text-sm bg-white text-brand-dark"
              required
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="clay-button px-6 py-3 bg-brand-dark text-white font-bold rounded-xl hover:bg-brand-dark/80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-dark transition-all duration-200"
          >
            Add Text
          </button>
        </div>
      </form>

      <h2 className="text-2xl font-extrabold mb-6 text-brand-dark">
        Stored Japanese Texts
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {texts.map((text) => (
          <div
            key={text._id}
            className="p-4 bg-white rounded-xl border-2 border-brand-dark shadow-hard cursor-pointer hover:bg-brand-blue/10 flex flex-col justify-between clay-card transition-all duration-200"
            onClick={() => handleCardClick(text)}
          >
            <div>
              <h3 className="text-lg font-bold text-brand-dark">
                {text.topic}
              </h3>
              <p className="text-sm text-brand-dark/70">ID: {text._id}</p>
              <p className="text-brand-dark mt-2 max-h-16 overflow-hidden text-ellipsis">
                {text.actualText}
              </p>
              <p className="text-sm text-brand-dark/70 mt-2">
                Source:{" "}
                <a href={text.sourceLink} className="text-brand-blue font-bold underline hover:text-brand-dark">
                  {text.sourceLink}
                </a>
              </p>
              <p className="text-sm text-brand-dark/70 mt-1">
                Parent Tag: {text.p_tag} | Sub Tag: {text.s_tag}
              </p>
              <p className="text-sm text-brand-dark/70 mt-1">
                User ID: {text.userId} | Language: {text.lang}
              </p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation(); // Prevent the card click from triggering when delete is clicked
                handleDelete(text._id);
              }}
              className="mt-4 clay-button px-4 py-2 bg-brand-peach text-brand-dark font-bold rounded-xl hover:bg-brand-peach/80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-peach transition-all duration-200"
            >
              Delete
            </button>
          </div>
        ))}
      </div>

      {selectedText && (
        <TextModal
          textData={selectedText}
          onClose={handleCloseModal}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
};

export default JapaneseTexts;

// ----------------- components -------------------- //

//import React from 'react';

const TextModal = ({ textData, onClose, onDelete }) => {
  if (!textData) return null;

  return (
    <div className="fixed inset-0 bg-brand-dark/50 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-white rounded-xl border-2 border-brand-dark shadow-hard p-6 max-w-lg w-full clay-card">
        <h2 className="text-2xl font-extrabold mb-4 text-brand-dark">{textData.topic}</h2>
        <div className="mb-4 max-h-[50vh] overflow-y-auto custom-scrollbar">
          <p className="text-brand-dark whitespace-pre-line">
            {textData.actualText}
          </p>
        </div>
        <p className="text-sm text-brand-dark/70">ID: {textData._id}</p>
        <p className="text-sm text-brand-dark/70">
          Source:{" "}
          <a href={textData.sourceLink} className="text-brand-blue font-bold underline hover:text-brand-dark">
            {textData.sourceLink}
          </a>
        </p>
        <p className="text-sm text-brand-dark/70 mt-2">
          Parent Tag: {textData.p_tag} | Sub Tag: {textData.s_tag}
        </p>
        <p className="text-sm text-brand-dark/70 mt-1">
          User ID: {textData.userId} | Language: {textData.lang}
        </p>
        <div className="mt-6 flex justify-between">
          <button
            onClick={() => onDelete(textData._id)}
            className="clay-button px-4 py-2 bg-brand-peach text-brand-dark font-bold rounded-xl hover:bg-brand-peach/80 transition-all duration-200"
          >
            Delete
          </button>
          <button
            onClick={onClose}
            className="clay-button px-4 py-2 bg-brand-dark text-white font-bold rounded-xl hover:bg-brand-dark/80 transition-all duration-200"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

//  export default TextModal;
