import React, { useEffect, useRef, useState } from "react";
import { FiPaperclip, FiMic, FiSend, FiX, } from "react-icons/fi";
import talkingAvatar from '../assets/Talking Character.json';
import Lottie, { type LottieRefCurrentProps } from 'lottie-react';
import axios from 'axios';
import { Howl } from 'howler';
import { useChat } from "../context/ChatContext";
import type { CreateMessageDto } from "../apis/DataParam/dtos";
import type { ChatMessages } from "../apis/DataResponse/responses";
import { extractTextFromFile } from "../apis/Controller/apisController";
import voiceMessage from '../assets/Audio&Voice-A-002.json';
function ChatAssistantComponent() {
    const [message, setMessage] = useState('');
    const [speed, setSpeed] = useState(1);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [isTalking, setIsTalking] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [conversationMessages, setConversationMessages] = useState<ChatMessages[]>([]);
    const { fetchChatMessages, chatMessages, currentUser, sendPrivateMessage, spokenText } = useChat();
    const [audio, setAudio] = useState<Howl | null>(null);
    const lottieRef = useRef<LottieRefCurrentProps | null>(null);
    const [userSpeachedText, setUserSpeachedText] = useState<string | null>(null);
    console.log('speachedText:', userSpeachedText);

    // Handle spoken text changes
    useEffect(() => {
        if (spokenText && spokenText.spokenText) {
            const handleTextToSpeech = async () => {
                try {
                    // Stop any currently playing audio
                    if (audio) {
                        audio.stop();
                        audio.unload();
                    }

                    // Convert text to speech
                    const response = await axios.post(
                        'http://localhost:8080/api/tts',
                        new URLSearchParams({ text: spokenText.spokenText }),
                        { responseType: 'blob', headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
                    );

                    const audioBlob = response.data;
                    const audioUrl = URL.createObjectURL(audioBlob);

                    // Create new Howl instance
                    const newAudio = new Howl({
                        src: [audioUrl],
                        format: ['mp3', 'wav'],
                        rate: speed,
                        onplay: () => {
                            setIsTalking(true);
                            lottieRef.current?.play();
                        },
                        onend: () => {
                            setIsTalking(false);
                            lottieRef.current?.pause();
                        },
                        onstop: () => {
                            setIsTalking(false);
                            lottieRef.current?.pause();
                        }
                    });

                    setAudio(newAudio);
                    newAudio.play();
                } catch (error) {
                    console.error('Error handling text to speech:', error);
                    setIsTalking(false);
                    lottieRef.current?.pause();
                }
            };

            handleTextToSpeech();
        }

        return () => {
            // Cleanup audio when component unmounts
            if (audio) {
                audio.unload();
            }
        };
    }, [spokenText]);

    // Update speed of current audio
    useEffect(() => {
        if (audio) {
            audio.rate(speed);
        }
    }, [speed, audio]);

    const toggleDrawer = () => {
        setIsDrawerOpen(!isDrawerOpen);
    };

    const handleSendMessage = async () => {
        // Early return if no user or empty message (but allow empty message if file is attached)
        if (!currentUser || !currentUser.id || !currentUser.token ||
            (!message.trim() && !selectedFile && !userSpeachedText)) {
            return;
        }

        if (selectedFile) {
            const reader = new FileReader();
            reader.onload = async () => {
                try {
                    const textExtracted = await extractTextFromFile(selectedFile);
                    // Send combined message if both text and voice input exist
                    const finalMessage = userSpeachedText
                        ? `${message} (Voice: ${userSpeachedText}) (File: ${textExtracted})`
                        : `${message} (File: ${textExtracted})`;

                    sendMessageNow(finalMessage, textExtracted, selectedFile.name);
                    setSelectedFile(null);
                    setUserSpeachedText(null);
                } catch (error) {
                    console.error("Error processing file:", error);
                }
            };
            reader.readAsDataURL(selectedFile);
        } else {
            // Handle non-file messages (text + optional voice)
            const finalMessage = userSpeachedText
                ? `${message} (Voice: ${userSpeachedText})`
                : message;

            sendMessageNow(finalMessage);
            setUserSpeachedText(null);
        }
    };

    const sendMessageNow = (content: string, fileContent?: string, fileName?: string) => {
        const messageDto: CreateMessageDto = {
            message: content,
            senderId: currentUser!.id,
            recipientId: 'bot-1',
            fileContent,
            fileName
        };

        const newMessage: ChatMessages = {
            id: `temp-${Date.now()}`,
            chatId: '',
            senderId: currentUser!.id,
            recipientId: 'bot-1',
            content: content,
            timestamp: new Date().toISOString()
        };

        setConversationMessages(prev => [...prev, newMessage]);
        sendPrivateMessage(messageDto);
        fetchChatMessages(currentUser!.id, 'bot-1');
        setMessage('');
        setSelectedFile(null);
    };
    const handleVoiceInput = () => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

        if (!SpeechRecognition) {
            alert('Speech Recognition API not supported in your browser.');
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.lang = 'en-US'; // Change to 'fr-FR', 'ar-TN', etc. as needed
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
            console.log('🎙️ Voice recording started...');
        };

        recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            console.log('🗣️ Transcript:', transcript);
            setUserSpeachedText(transcript);
        };

        recognition.onerror = (event: any) => {
            console.error('Speech recognition error', event.error);
            alert('Speech recognition error: ' + event.error);
        };

        recognition.onend = () => {
            console.log('🛑 Voice recording ended.');
        };

        recognition.start();
    };


    useEffect(() => {
        if (currentUser) {
            setConversationMessages((prevMessages) => {
                const tempMessagesMap = new Map();
                prevMessages.forEach(msg => {
                    if (msg.id.startsWith('temp-')) {
                        const key = `${msg.content}-${msg.timestamp}`;
                        tempMessagesMap.set(key, msg);
                    }
                });

                const merged = [...chatMessages];
                prevMessages.forEach(prevMsg => {
                    if (prevMsg.id.startsWith('temp-')) {
                        const exists = chatMessages.some(serverMsg =>
                            serverMsg.content === prevMsg.content &&
                            Math.abs(new Date(serverMsg.timestamp).getTime() - new Date(prevMsg.timestamp).getTime()) < 1000
                        );
                        if (!exists) {
                            merged.push(prevMsg);
                        }
                    }
                });

                return merged.sort(
                    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
                );
            });
        }
    }, [chatMessages, currentUser]);

    useEffect(() => {
        const fetchData = async () => {
            if (!currentUser?.token) return;
            try {
                await fetchChatMessages(currentUser.id, 'bot-1');
            } catch (error) {
                console.error('Failed to fetch messages:', error);
            }
        };
        fetchData();
    }, [currentUser?.token]);

    return (
        <div className="flex flex-col flex-1 h-screen bg-gray-800 relative">

            {isDrawerOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden" onClick={toggleDrawer} />
            )}

            <div
                className={`fixed left-0 top-0 h-full w-[280px] sm:w-80 bg-gray-900 transform transition-transform duration-300 ease-in-out z-50 lg:hidden flex flex-col overflow-hidden ${isDrawerOpen ? 'translate-x-0' : '-translate-x-full'}`}
            >
                <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-700 flex-shrink-0">
                    <h2 className="text-base sm:text-lg font-semibold text-white truncate">Avatar Assistant</h2>
                    <button onClick={toggleDrawer} className="text-gray-400 hover:text-white p-1 flex-shrink-0">
                        <FiX size={20} className="sm:w-6 sm:h-6" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-4">
                    <div className="w-full bg-gray-800 rounded-lg p-4 sm:p-6 text-center">
                        <div className="w-full max-w-[200px] mx-auto mb-4">
                            <Lottie
                                lottieRef={lottieRef}
                                animationData={talkingAvatar}
                                loop={true}
                                autoplay={isTalking}
                                style={{ width: '100%', height: '100%' }}
                            />
                        </div>
                        {spokenText && (
                            <p className="mb-4 sm:mb-6 text-gray-300 italic select-text text-xs sm:text-sm leading-relaxed break-words">
                                {spokenText.spokenText}
                            </p>
                        )}
                        <label className="block mb-3 sm:mb-4 text-xs sm:text-sm font-medium text-gray-300">
                            Speed: {speed.toFixed(1)}x
                            <input
                                type="range"
                                min="0.5"
                                max="2"
                                step="0.1"
                                value={speed}
                                onChange={(e) => setSpeed(parseFloat(e.target.value))}
                                className="w-full mt-1 sm:mt-2"
                            />
                        </label>
                        <p className="text-white font-medium text-sm sm:text-base">Avatar Assistant</p>
                        <p className="text-gray-400 text-xs sm:text-sm mt-1">Ready to help you</p>

                        <div className="mt-4 sm:mt-6 space-y-3 sm:space-y-4 text-left">
                            <div className="bg-gray-700 p-2.5 sm:p-3 rounded">
                                <h4 className="text-white font-medium mb-1 sm:mb-2 text-xs sm:text-sm">Recent Activity</h4>
                                <p className="text-gray-300 text-xs break-words">Last conversation: 2 hours ago</p>
                            </div>
                            <div className="bg-gray-700 p-2.5 sm:p-3 rounded">
                                <h4 className="text-white font-medium mb-1 sm:mb-2 text-xs sm:text-sm">Settings</h4>
                                <p className="text-gray-300 text-xs break-words">Voice enabled, Speed: {speed}x</p>
                            </div>
                            <div className="bg-gray-700 p-2.5 sm:p-3 rounded">
                                <h4 className="text-white font-medium mb-1 sm:mb-2 text-xs sm:text-sm">Tips</h4>
                                <p className="text-gray-300 text-xs break-words">Try asking me about any topic or upload a PDF file for analysis.</p>
                            </div>
                            <div className="bg-gray-700 p-2.5 sm:p-3 rounded">
                                <h4 className="text-white font-medium mb-1 sm:mb-2 text-xs sm:text-sm">Features</h4>
                                <ul className="text-gray-300 text-xs space-y-0.5 sm:space-y-1">
                                    <li className="break-words">• Voice synthesis with speed control</li>
                                    <li className="break-words">• PDF file upload and analysis</li>
                                    <li className="break-words">• Real-time conversation</li>
                                    <li className="break-words">• Animated avatar responses</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex flex-row px-4 py-4 items-center justify-between w-full bg-gradient-to-r from-gray-800 to-blue-800 shadow-lg">
                <button
                    onClick={toggleDrawer}
                    className="w-6 h-6 text-white lg:hidden hover:text-gray-300 transition-colors"
                    aria-label="Open menu"
                >
                    <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <path stroke="currentColor" strokeLinecap="round" strokeWidth="2" d="M5 7h14M5 12h14M5 17h14" />
                    </svg>
                </button>
                <h1 className="text-xl md:text-2xl font-bold text-white text-center flex-1 lg:flex-none">
                    Welcome to Chat Assistant
                </h1>
                <div className="w-6 lg:hidden"></div>
            </div>


            <div className="flex flex-row flex-1 overflow-hidden">

                <div className="hidden lg:flex lg:flex-col lg:w-1/4 xl:w-1/5 bg-gray-900 border-r border-gray-700 overflow-hidden">
                    <div className="p-4 border-b border-gray-700 flex-shrink-0">
                        <h2 className="text-lg font-semibold text-white mb-4 truncate">Avatar Assistant</h2>
                    </div>
                    <div className="p-4 overflow-y-auto overflow-x-hidden flex-1">
                        <div className="w-full bg-gray-800 rounded-lg p-6 text-center">
                            <div className="w-full  mx-auto mb-6 ">
                                <Lottie
                                    lottieRef={lottieRef}
                                    animationData={talkingAvatar}
                                    loop={true}
                                    autoplay={isTalking}
                                    className="w-full h-full"
                                />
                            </div>
                            {spokenText && (
                                <p className="mb-6 text-gray-300 italic select-text text-sm leading-relaxed break-words">
                                    {spokenText.spokenText}
                                </p>
                            )}
                            <label className="block mb-2 text-sm font-medium text-gray-300">
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
                            <p className="text-white font-medium">Avatar Assistant</p>
                            <p className="text-gray-400 text-sm mt-1">Ready to help you</p>
                        </div>
                    </div>
                </div>


                <div className="flex flex-col flex-1 bg-gradient-to-br from-gray-900 via-blue-900 to-gray-800 overflow-hidden">
                    {conversationMessages.length === 0 ? (
                        <div className="flex justify-center items-center h-full p-4">
                            <div className="text-center w-full max-w-xs sm:max-w-md mx-auto px-2">
                                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                                    <svg className="w-6 h-6 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
                                    </svg>
                                </div>
                                <h2 className="text-base sm:text-lg md:text-xl font-bold text-white mb-2">Start a conversation</h2>
                                <p className="text-gray-300 text-xs sm:text-sm break-words leading-relaxed">Type your message below to begin chatting with your AI assistant</p>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 overflow-y-auto overflow-x-hidden">
                            <div className="flex flex-col space-y-2 sm:space-y-3 p-2 sm:p-3 md:p-4 min-h-full">
                                {conversationMessages.map((msg) => {
                                    const isCurrentUser = msg.senderId === currentUser?.id;
                                    return (
                                        <div key={msg.id} className={`flex w-full ${isCurrentUser ? 'justify-end' : 'justify-start'} px-1`}>
                                            <div className={`
                                relative max-w-[85%] sm:max-w-[80%] md:max-w-[70%] lg:max-w-md
                                p-2 sm:p-2.5 md:p-3 rounded-lg
                                break-words hyphens-auto
                                ${isCurrentUser
                                                    ? 'bg-blue-600 text-white rounded-br-none'
                                                    : 'bg-gray-700 text-white rounded-bl-none'
                                                }
                            `}>
                                                <div className="break-words overflow-wrap-break-word">
                                                    <p className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap" style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                                                        {msg.content}
                                                    </p>
                                                </div>
                                                <p className="text-xs mt-1 sm:mt-1.5 text-gray-300 opacity-75 text-right flex-shrink-0">
                                                    {new Date(msg.timestamp).toLocaleTimeString([], {
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>


            {selectedFile && (
                <div className="mx-2 sm:mx-4 mb-2">
                    <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 bg-gradient-to-r from-yellow-900/30 to-amber-900/30 border border-yellow-600/30 rounded-xl backdrop-blur-sm">
                        {/* File Icon */}
                        <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                            <svg
                                className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                            >
                                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                            </svg>
                        </div>

                        {/* File Info */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                                <span className="text-xs sm:text-sm font-medium text-yellow-300 truncate">
                                    {selectedFile.name}
                                </span>
                                <span className="text-xs text-yellow-400/70 bg-yellow-500/10 px-2 py-0.5 rounded-full flex-shrink-0">
                                    PDF
                                </span>
                            </div>
                            <p className="text-xs text-yellow-400/70 mt-0.5">
                                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB • Ready to upload
                            </p>
                        </div>

                        {/* Remove Button */}
                        <button
                            onClick={() => setSelectedFile(null)}
                            className="flex-shrink-0 w-6 h-6 sm:w-7 sm:h-7 text-yellow-400 hover:text-yellow-300 hover:bg-yellow-500/10 rounded-full flex items-center justify-center transition-all duration-200 touch-manipulation"
                            aria-label="Remove attached file"
                        >
                            <FiX size={14} className="sm:w-4 sm:h-4" />
                        </button>
                    </div>
                </div>
            )}

            {userSpeachedText && (
                <div className="mx-2 sm:mx-4 mb-2">
                    <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 bg-gradient-to-r from-blue-900/30 to-indigo-900/30 border border-blue-600/30 rounded-xl backdrop-blur-sm">
                        {/* Voice Animation */}
                        <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 bg-blue-500/20 rounded-lg flex items-center justify-center overflow-hidden">
                            <Lottie
                                animationData={voiceMessage}
                                loop={true}
                                autoplay={true}
                                style={{ width: '24px', height: '24px' }}
                                className="sm:w-7 sm:h-7"
                            />
                        </div>

                        {/* Voice Content */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                                <div className="flex items-center gap-1">
                                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                                    <span className="text-xs sm:text-sm font-medium text-blue-300">
                                        Voice Input
                                    </span>
                                </div>
                                <span className="text-xs text-blue-400/70 bg-blue-500/10 px-2 py-0.5 rounded-full">
                                    Recognized
                                </span>
                            </div>
                            <p className="text-xs sm:text-sm text-blue-200 line-clamp-2 leading-relaxed">
                                "{userSpeachedText}"
                            </p>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex-shrink-0 flex items-center gap-1">
                            {/* Use Voice Text Button */}
                            <button
                                onClick={() => {
                                    setMessage(userSpeachedText);
                                    setUserSpeachedText(null);
                                }}
                                className="w-8 h-8 sm:w-9 sm:h-9 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded-full flex items-center justify-center transition-all duration-200 touch-manipulation"
                                aria-label="Use voice text"
                                title="Use this text"
                            >
                                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                </svg>
                            </button>

                            {/* Remove Voice Text Button */}
                            <button
                                onClick={() => setUserSpeachedText(null)}
                                className="w-8 h-8 sm:w-9 sm:h-9 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded-full flex items-center justify-center transition-all duration-200 touch-manipulation"
                                aria-label="Clear voice input"
                                title="Clear voice input"
                            >
                                <FiX size={14} className="sm:w-4 sm:h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-gradient-to-r from-gray-800 via-blue-800 to-gray-800 p-2 sm:p-3 md:p-4 border-t border-gray-700">
                <div className="w-full max-w-4xl mx-auto">
                    <div className="relative flex items-end">
                        {/* Mobile-optimized input buttons */}
                        <div className="absolute left-2 sm:left-3 bottom-2 sm:bottom-3 flex gap-1 text-gray-400 z-10">
                            <button
                                className="hover:text-white p-1 transition-colors touch-manipulation"
                                title="Attach File"
                                aria-label="Attach file"
                                onClick={() => document.getElementById('fileInput')?.click()}
                            >
                                <FiPaperclip size={14} className="sm:w-4 sm:h-4 md:w-[18px] md:h-[18px]" />
                            </button>
                            <input
                                type="file"
                                id="fileInput"
                                accept=".pdf"
                                style={{ display: 'none' }}
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file && file.type === 'application/pdf') {
                                        setSelectedFile(file);
                                    } else {
                                        alert('Please upload a valid PDF file.');
                                    }
                                }}
                            />
                            <button
                                className="hover:text-white p-1 transition-colors touch-manipulation"
                                title="Voice Message"
                                aria-label="Voice message"
                                onClick={handleVoiceInput}
                            >
                                <FiMic size={14} className="sm:w-4 sm:h-4 md:w-[18px] md:h-[18px] " />
                            </button>
                        </div>

                        {/* Mobile-optimized textarea */}
                        <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            className="w-full p-2  sm:p-2.5 md:p-3 
                          pl-12 sm:pl-14 md:pl-16 lg:pl-20 
                          pr-10 sm:pr-12 md:pr-14 
                          border border-gray-600 rounded-xl sm:rounded-2xl 
                          bg-gray-700 text-white placeholder-gray-400 
                          resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent 
                          transition-all min-h-[40px] sm:min-h-[44px] max-h-24 sm:max-h-32 
                          text-xs sm:text-sm md:text-base
                          leading-tight sm:leading-normal"
                            placeholder="Type your message here..."
                            rows={1}
                            style={{
                                wordBreak: 'break-word',
                                overflowWrap: 'anywhere'
                            }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSendMessage();
                                }
                            }}
                        />


                        <button
                            type="button"
                            onClick={handleSendMessage}
                            disabled={!message.trim() && !selectedFile && !userSpeachedText}
                            className="absolute right-1.5 sm:right-2 bottom-1.5 sm:bottom-2 
                          text-white bg-blue-600 hover:bg-blue-700 
                          disabled:bg-gray-600 disabled:cursor-not-allowed 
                          focus:ring-2 sm:focus:ring-4 focus:outline-none focus:ring-blue-300 
                          font-medium rounded-full text-sm 
                          p-1.5 sm:p-2 transition-all duration-200 
                          transform hover:scale-105 disabled:hover:scale-100
                          touch-manipulation"
                            aria-label="Send message"
                        >
                            <FiSend size={12} className="sm:w-3.5 sm:h-3.5 md:w-4 md:h-4" />
                            <span className="sr-only">Send message</span>
                        </button>
                    </div>


                    <div className="flex justify-between items-center mt-1.5 sm:mt-2 text-xs text-gray-400 px-1">
                        <span className="hidden xs:inline text-xs">Press Enter to send</span>
                        <span className="xs:hidden text-xs">Tap to send</span>
                        <span className={`text-xs flex-shrink-0 ${message.length > 500 ? 'text-yellow-400' : ''} ${message.length > 800 ? 'text-red-400' : ''}`}>
                            {message.length}/1000
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ChatAssistantComponent;