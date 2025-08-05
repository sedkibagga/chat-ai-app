import React, { useEffect, useRef, useState } from "react";
import { FiPaperclip, FiMic, FiSend, FiX } from "react-icons/fi";
import talkingAvatar from '../assets/Talking Character.json';
import Lottie, { type LottieRefCurrentProps } from 'lottie-react';
import axios from 'axios';
import { Howl } from 'howler';
import { useChat } from "../context/ChatContext";
import type { CreateMessageDto } from "../apis/DataParam/dtos";
import type { ChatMessages } from "../apis/DataResponse/responses";
import { extractTextFromFile } from "../apis/Controller/apisController";

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
        if (!currentUser || !currentUser.id || !currentUser.token || !message.trim()) return;

        if (selectedFile) {
            const reader = new FileReader();
            reader.onload = async () => {
                const textExtracted = await extractTextFromFile(selectedFile);
                sendMessageNow(textExtracted, undefined);
                setSelectedFile(null);
            };
            reader.readAsDataURL(selectedFile);
        } else {
            sendMessageNow(undefined, undefined);
        }
    };

    const sendMessageNow = (fileContent?: string, fileName?: string) => {
        const messageDto: CreateMessageDto = {
            message: message + (fileContent ? ` (Attached: ${fileContent})` : ''),
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
            content: message,
            timestamp: new Date().toISOString()
        };

        setConversationMessages(prev => [...prev, newMessage]);
        sendPrivateMessage(messageDto);
        fetchChatMessages(currentUser!.id, 'bot-1');
        setMessage('');
        setSelectedFile(null);
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
                className={`fixed left-0 top-0 h-full w-80 bg-gray-900 transform transition-transform duration-300 ease-in-out z-50 lg:hidden flex flex-col ${isDrawerOpen ? 'translate-x-0' : '-translate-x-full'}`}
            >

                <div className="flex items-center justify-between p-4 border-b border-gray-700 flex-shrink-0">
                    <h2 className="text-lg font-semibold text-white">Avatar Assistant</h2>
                    <button onClick={toggleDrawer} className="text-gray-400 hover:text-white p-1">
                        <FiX size={24} />
                    </button>
                </div>


                <div className="flex-1 overflow-y-auto p-4">
                    <div className="w-full bg-gray-800 rounded-lg p-6 text-center">
                        <Lottie
                            lottieRef={lottieRef}
                            animationData={talkingAvatar}
                            loop={true}
                            autoplay={isTalking}
                            style={{ width: '100%', height: '100%' }}
                        />
                        {spokenText && (
                            <p className="mb-6 text-gray-300 italic select-text">{spokenText.spokenText}</p>
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


                        <div className="mt-6 space-y-4 text-left">
                            <div className="bg-gray-700 p-3 rounded">
                                <h4 className="text-white font-medium mb-2">Recent Activity</h4>
                                <p className="text-gray-300 text-sm">Last conversation: 2 hours ago</p>
                            </div>
                            <div className="bg-gray-700 p-3 rounded">
                                <h4 className="text-white font-medium mb-2">Settings</h4>
                                <p className="text-gray-300 text-sm">Voice enabled, Speed: {speed}x</p>
                            </div>
                            <div className="bg-gray-700 p-3 rounded">
                                <h4 className="text-white font-medium mb-2">Tips</h4>
                                <p className="text-gray-300 text-sm">Try asking me about any topic or upload a PDF file for analysis.</p>
                            </div>
                            <div className="bg-gray-700 p-3 rounded">
                                <h4 className="text-white font-medium mb-2">Features</h4>
                                <ul className="text-gray-300 text-xs space-y-1">
                                    <li>• Voice synthesis with speed control</li>
                                    <li>• PDF file upload and analysis</li>
                                    <li>• Real-time conversation</li>
                                    <li>• Animated avatar responses</li>
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

                <div className="hidden lg:flex lg:flex-col lg:w-1/4 xl:w-1/5 bg-gray-900 border-r border-gray-700 overflow-y-auto">
                    <div className="p-4 border-b border-gray-700">
                        <h2 className="text-lg font-semibold text-white mb-4">Avatar Assistant</h2>
                    </div>
                    <div className="p-4">
                        <div className="w-full bg-gray-800 rounded-lg p-6 text-center">
                            <Lottie
                                lottieRef={lottieRef}
                                animationData={talkingAvatar}
                                loop={true}
                                autoplay={isTalking}
                                style={{ width: '100%', height: '100%' }}
                            />
                            {spokenText && (
                                <p className="mb-6 text-gray-300 italic select-text">{spokenText.spokenText}</p>
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


                <div className="flex flex-col flex-1 overflow-y-auto bg-gradient-to-br from-gray-900 via-blue-900 to-gray-800 p-4">
                    {conversationMessages.length === 0 ? (
                        <div className="flex justify-center items-center h-full">
                            <div className="text-center max-w-md">
                                <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
                                    </svg>
                                </div>
                                <h2 className="text-xl md:text-2xl font-bold text-white mb-2">Start a conversation</h2>
                                <p className="text-gray-300 text-sm md:text-base">Type your message below to begin chatting with your AI assistant</p>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col space-y-2 overflow-y-auto">
                            {conversationMessages.map((msg) => {
                                const isCurrentUser = msg.senderId === currentUser?.id;
                                return (
                                    <div key={msg.id} className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-xs md:max-w-sm p-3 rounded-lg ${isCurrentUser
                                            ? 'bg-blue-600 text-white rounded-br-none'
                                            : 'bg-gray-700 text-white rounded-bl-none'}`}>
                                            <p className="text-sm">{msg.content}</p>
                                            <p className="text-xs mt-1 text-gray-300 text-right">
                                                {new Date(msg.timestamp).toLocaleTimeString()}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>


            {selectedFile && (
                <div className="text-sm text-yellow-300 mt-2">
                    Attached file: {selectedFile.name}
                </div>
            )}


            <div className="bg-gradient-to-r from-gray-800 via-blue-800 to-gray-800 p-3 md:p-4 border-t border-gray-700">
                <div className="max-w-4xl mx-auto">
                    <div className="relative flex items-end">
                        <div className="absolute left-3 bottom-3 flex gap-1 md:gap-2 text-gray-400 z-10">
                            <button
                                className="hover:text-white p-1 transition-colors"
                                title="Attach File"
                                aria-label="Attach file"
                                onClick={() => document.getElementById('fileInput')?.click()}
                            >
                                <FiPaperclip size={16} className="md:w-[18px] md:h-[18px]" />
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
                                className="hover:text-white p-1 transition-colors"
                                title="Voice Message"
                                aria-label="Voice message"
                            >
                                <FiMic size={16} className="md:w-[18px] md:h-[18px]" />
                            </button>
                        </div>

                        <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            className="w-full p-3 pl-16 md:pl-20 pr-12 md:pr-14 border border-gray-600 rounded-2xl bg-gray-700 text-white placeholder-gray-400 resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all min-h-[44px] max-h-32 text-sm md:text-base"
                            placeholder="Type your message here..."
                            rows={1}
                        />

                        <button
                            type="button"
                            onClick={handleSendMessage}
                            disabled={!message.trim()}
                            className="absolute right-2 bottom-2 text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-full text-sm p-2 transition-all duration-200 transform hover:scale-105 disabled:hover:scale-100"
                            aria-label="Send message"
                        >
                            <FiSend size={14} className="md:w-4 md:h-4" />
                            <span className="sr-only">Send message</span>
                        </button>
                    </div>

                    <div className="flex justify-between items-center mt-2 text-xs text-gray-400">
                        <span className="hidden sm:inline">Press Enter to send, Shift+Enter for new line</span>
                        <span className="sm:hidden">Enter to send</span>
                        <span className={`${message.length > 500 ? 'text-yellow-400' : ''} ${message.length > 800 ? 'text-red-400' : ''}`}>
                            {message.length}/1000
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ChatAssistantComponent;