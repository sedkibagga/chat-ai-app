import React, { useState } from 'react';
import axios from 'axios';

function TestAudioPage() {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [spokenText, setSpokenText] = useState('');
  const [speed, setSpeed] = useState(1); // normal speed

  const playAudio = async () => {
    if (!text.trim()) return alert('Please enter text');

    try {
      setLoading(true);
      const response = await axios.post(
        'http://localhost:8080/api/tts',
        new URLSearchParams({ text }),
        { responseType: 'blob', headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
      );

      const audioBlob = response.data;
      const audioUrl = window.URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);

      audio.playbackRate = speed; // set playback speed here
      audio.play();

      setSpokenText(text); // show the text below the image after playing
    } catch (error) {
      console.error('Error fetching audio:', error);
      alert('Failed to get audio from TTS service');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded shadow-md text-center">
      {/* Image */}
      <img
        src="https://images.unsplash.com/photo-1501594907352-04cda38ebc29?auto=format&fit=crop&w=400&q=80"
        alt="Speech Bubble"
        className="mx-auto mb-4 rounded-lg shadow-md"
      />

      {/* Show text below image only after play */}
      {spokenText && (
        <p className="mb-6 text-gray-700 italic select-text">{spokenText}</p>
      )}

      {/* Textarea */}
      <textarea
        rows={4}
        className="w-full p-3 border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Type something..."
      />

      {/* Speed control */}
      <label className="block mb-2 text-sm font-medium text-gray-700">
        Speed: {speed.toFixed(1)}x
        <input
          type="range"
          min="0.5"
          max="2"
          step="0.1"
          value={speed}
          onChange={(e) => setSpeed(parseFloat(e.target.value))}
          className="w-full mt-1"
        />
      </label>

      {/* Button */}
      <button
        onClick={playAudio}
        disabled={loading}
        className={`w-full py-2 rounded-md text-white ${
          loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
        } transition-colors duration-200`}
      >
        {loading ? 'Loading...' : 'Play Audio'}
      </button>
    </div>
  );
}

export default TestAudioPage;
