import React, { useState, useRef } from 'react';
import axios from 'axios';
import Lottie, { type LottieRefCurrentProps } from 'lottie-react';  // <-- Import type
import talkingAvatar from '../assets/Talking Character.json';

function TestAudioPage() {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [spokenText, setSpokenText] = useState('');
  const [speed, setSpeed] = useState(1);
  const [isTalking, setIsTalking] = useState(false);

  // Fix: specify type and initialize with null
  const lottieRef = useRef<LottieRefCurrentProps | null>(null);

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
      audio.playbackRate = speed;

      setIsTalking(true);
      lottieRef.current?.play();
      audio.play();

      audio.onended = () => {
        setIsTalking(false);
        lottieRef.current?.pause();
      };

      setSpokenText(text);
    } catch (error) {
      console.error('Error fetching audio:', error);
      alert('Failed to get audio from TTS service');
      setIsTalking(false);
      lottieRef.current?.pause();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded shadow-md text-center">
      <div className="w-48 h-48 mx-auto mb-4">
        <Lottie
          lottieRef={lottieRef}
          animationData={talkingAvatar}
          loop={true}
          autoplay={false}
          style={{ width: '100%', height: '100%' }}
        />
      </div>

      {spokenText && (
        <p className="mb-6 text-gray-700 italic select-text">{spokenText}</p>
      )}

      <textarea
        rows={4}
        className="w-full p-3 border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Type something..."
      />

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
