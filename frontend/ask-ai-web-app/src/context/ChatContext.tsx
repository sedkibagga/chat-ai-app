import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { webSocketService } from '../services/WebSocketService';
import type { ChatMessages, loginUserResponse, MessageToSpeakResponse } from '../apis/DataResponse/responses';
import { findChatMessages } from '../apis/Controller/apisController';
import type { CreateMessageDto } from '../apis/DataParam/dtos';
import api from '../apis/Interceptors/axiosInstance';
interface ChatContextType {
  currentUser: loginUserResponse | null;
  setCurrentUser: (currentUser: loginUserResponse | null) => void;
  connect: (user: loginUserResponse) => void;
  messages: string[];
  setMessages: (messages: string[]) => void;
  chatMessages: ChatMessages[];
  setChatMessages: (chatMessages: ChatMessages[]) => void;
  disconnect: () => void;
  sendChatMessage: (content: string) => void;
  error: string | null;
  setError: (error: string | null) => void;
  fetchChatMessages: (senderId: string, recipientId: string) => Promise<void>;
  loadUser: () => Promise<void>;
  sendPrivateMessage: (createMessageDto: CreateMessageDto) => void;
  spokenText: MessageToSpeakResponse|null;
  setSpokenText: (spokenText: MessageToSpeakResponse|null) => void;
}

const ChatContext = createContext<ChatContextType | null>(null);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<loginUserResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<string[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessages[]>([]);
  const [spokenText, setSpokenText] = useState<MessageToSpeakResponse|null>(null);
  const connect = async (user: loginUserResponse) => {
    setCurrentUser(user);
    console.log("Connecting user:", user);
    webSocketService.connect(
      user,
      (message) => setMessages(prev => [...prev, message]),
      (spokenText) => setSpokenText(spokenText),
      (chatMessage) => {
        console.log('Received notification:', chatMessage);
        setChatMessages(prev => {
          const newMessages = [...prev, {
            id: chatMessage.id,
            chatId: chatMessage.chatId,
            senderId: chatMessage.senderId,
            recipientId: chatMessage.recipientId,
            content: chatMessage.content,
            timestamp: chatMessage.timestamp
          }];
          console.log('Updated messages:', newMessages);
          return newMessages;
        });
      }
    );
  };

  const disconnect = () => {
    webSocketService.disconnect();
    setCurrentUser(null);
  };

  const sendChatMessage = (content: string) => {
    if (!currentUser) return;
    webSocketService.sendChatMessage(content);
  };

  const sendPrivateMessage = (createMessageDto: CreateMessageDto) => {
    if (!currentUser) return;
    webSocketService.sendPrivateMessage(createMessageDto);

  };




  const fetchChatMessages = useCallback(async (senderId: string, recipientId: string) => {
    try {
      const response = await findChatMessages(senderId, recipientId);
      setChatMessages(prev => {
        // Merge new messages with existing ones, avoiding duplicates
        const newMessages = response.filter(newMsg =>
          !prev.some(existingMsg => existingMsg.id === newMsg.id)
        );
        console.log('New messages:', newMessages);
        return [...prev, ...newMessages];
      });
    } catch (error) {
      console.error('Failed to fetch chat messages:', error);
    }
  }, []);



  useEffect(() => {
    return () => {
      webSocketService.disconnect();
    };
  }, []);
  const loadUser = async () => {
    try {
      
      const res = await api.get("/api/me");
      setCurrentUser(res.data);
    } catch (error) {
      console.error("Failed to fetch current user", error);
      setCurrentUser(null);
    }
  };


  useEffect(() => {

    loadUser();


  }, []);

  useEffect(() => {
    if (currentUser) {
      connect(currentUser);
    }
  }, [currentUser]);


  return (
    <ChatContext.Provider value={{
      currentUser,
      setCurrentUser,
      messages,
      setMessages,
      connect,
      disconnect,
      sendChatMessage,
      error,
      setError,
      chatMessages,
      setChatMessages,
      fetchChatMessages,
      loadUser,
      sendPrivateMessage,
      spokenText,
      setSpokenText

    }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};