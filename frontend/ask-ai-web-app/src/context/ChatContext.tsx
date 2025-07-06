import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { webSocketService } from '../services/WebSocketService';
import type { loginUserResponse } from '../apis/DataResponse/responses';
interface ChatContextType {
  currentUser: loginUserResponse | null;
  setCurrentUser:(currentUser: loginUserResponse | null) => void;
  connect: (user: loginUserResponse) => void;
  messages: string[];
  setMessages: (messages: string[]) => void;
  disconnect: () => void;
  sendChatMessage: (content: string) => void;
  error: string | null;
  setError: (error: string | null) => void;
 
}

const ChatContext = createContext<ChatContextType | null>(null);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<loginUserResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<string[]>([]);
  const connect = async (user: loginUserResponse) => {
    setCurrentUser(user);
    console.log("Connecting user:", user);
    //  if (user.id && selectedUser?.id) {
    //   const existingMessages = await apisController.findChatMessages(user.id, selectedUser.id);
    //   setChatMessages(existingMessages);
    //   console.log("Fetched existing messages:", existingMessages);
    // }
    webSocketService.connect(
      user,
      // (updatedUsers) => setUsers(updatedUsers),
      (message) => setMessages(prev => [...prev, message]),
      // (notification) => {
      //   console.log('Received notification:', notification);
      //   setChatMessages(prev => {
      //     const newMessages = [...prev, {
      //       id: notification.id,
      //       chatId: notification.chatId,
      //       senderId: notification.senderId,
      //       recipientId: notification.recipientId,
      //       content: notification.content,
      //       timestamp: new Date()
      //     }];
      //     console.log('Updated messages:', newMessages);
      //     return newMessages;
      //   });
      // },
      // onError: (error) => setError(error)
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


  

  // const fetchChatMessages = useCallback(async (senderId: string, recipientId: string) => {
  //   try {
  //     const response = await apisController.findChatMessages(senderId, recipientId);
  //     setChatMessages(prev => {
  //       // Merge new messages with existing ones, avoiding duplicates
  //       const newMessages = response.filter(newMsg => 
  //         !prev.some(existingMsg => existingMsg.id === newMsg.id)
  //       );
  //       return [...prev, ...newMessages];
  //     });
  //   } catch (error) {
  //     console.error('Failed to fetch chat messages:', error);
  //   }
  // }, []);
  
  

  useEffect(() => {
    return () => {
      webSocketService.disconnect();
    };
  }, []);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const storedUser = await localStorage.getItem('userData');
        if (storedUser) {
          setCurrentUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.error('Failed to load user data:', error);
      }
    };

    loadUser();
    // fetchUsers();
    // fetchChatMessages(senderId, recipientId); 

  }, []);
   
//   useEffect(() => {
//   if (currentUser) {
//     connect(currentUser);
//   }
// }, [currentUser]);


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