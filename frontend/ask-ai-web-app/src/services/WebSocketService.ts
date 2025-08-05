import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
// import type { ChatMessage, ChatNotification } from '../types/Types';
import type { ChatMessages, loginUserResponse, MessageToSpeakResponse } from '../apis/DataResponse/responses';
import type { AskGeminiMessageDto } from '../apis/DataParam/askGeminiMessageDto';
import type { CreateMessageDto } from '../apis/DataParam/dtos';

class WebSocketService {
  private stompClient: Client | null = null;
  private currentUser: loginUserResponse | null = null;
  connect(
    user: loginUserResponse,
    onMessagesList : (message:string) => void,
    onSpokenText:(spokenText:MessageToSpeakResponse|null) => void,
    onChatMessagesList : (chatMessage:ChatMessages) => void
  ) {
    this.currentUser = user;

    const socket = new SockJS('http://localhost:8080/ws');

    this.stompClient = new Client({
      webSocketFactory: () => socket,
      reconnectDelay: 5000,
      debug: (str) => console.log('[WS]', str),
      connectHeaders: {
        'username': user.firstName
      }
    });

    this.stompClient.onConnect = () => {
      console.log('Connected to WebSocket');



      this.stompClient?.subscribe('/topic/public', (message) => {
        console.log('Subscribed to /topic/public');
        console.log("Received messages", message.body);
        onMessagesList(message.body);
      });

     

     
      this.stompClient?.subscribe(`/user/${user.id}/queue/messages/ask-ai-assistant` , (message) => {
       console.log(`Subscribed to /user/${user.id}/queue/messages/ask-ai-assistant`);
        console.log("Received messages", message.body);
        try {
          const notification = JSON.parse(message.body) as ChatMessages;
          console.log("Received notification", notification);
          onChatMessagesList(notification);
          
        }catch(error:any){
          console.error("failed to parse message",error);
        }
        
        
      });
     

      this.stompClient?.subscribe(`/user/${user.id}/queue/messages/ai-asistant-spoken` , (message) => {
        console.log(`Subscribed to /user/${user.id}/queue/messages/ai-asistant-spoken`);
        console.log("Received messages", message.body);
        try {
          const notification = JSON.parse(message.body) as MessageToSpeakResponse;
          console.log("Received notification", notification);
          onSpokenText(notification);
          
        }catch(error:any){
          console.error("failed to parse message",error);
        }
        
      });
      this.stompClient?.watchForReceipt('message-receipt', (frame) => {
        console.log('Subscription confirmed:', frame);
      });
      
    };

    this.stompClient.onWebSocketClose = (event) => {
      console.log('WebSocket closed:', event);
    };

    this.stompClient.onWebSocketError = (event) => {
      console.error('WebSocket error:', event);
    };

    this.stompClient.onStompError = (frame) => {
      console.error('STOMP error:', frame.headers.message);
    };

    this.stompClient.activate();
  }

  disconnect(): Promise<void> {
  return new Promise((resolve) => {
    if (!this.stompClient || !this.currentUser) {
      console.warn('WebSocket client or current user not initialized, skipping disconnect');
      resolve();
      return;
    }

  
    this.stompClient.deactivate().then(() => {
      console.log('WebSocket fully disconnected');
      this.stompClient = null;
      this.currentUser = null;
      resolve();
    }).catch(err => {
      console.error('Error during deactivation:', err);
      resolve();
    });
  });
}



  sendPrivateMessage(createMessageDto:CreateMessageDto) {
     console.log("this.currentUser:", this.currentUser);
    console.log("this.stompClient:", this.stompClient);
    console.log("createMessageDto in websocket:", createMessageDto);
    if (this.stompClient && this.currentUser) {
      console.log("currentUser in sendPrivateMessage:", this.currentUser);
      this.stompClient.publish({
        destination: '/app/chat/ask-ai-assistant',
        body: JSON.stringify(createMessageDto),
      });
    }
  }

  sendChatMessage(content: string) {
    console.log("this.stompClient:", this.stompClient);
    if (this.stompClient && this.currentUser) {
      console.log("currentUser in sendChatMessage:", this.currentUser);
      const messageDto : AskGeminiMessageDto = {
        message: content
      }
      console.log("messageDto:", messageDto);
      this.stompClient.publish({
        destination: '/app/ask-gemini',
        body: JSON.stringify(messageDto),
      });
     
    }
  }
  
 
}

export const webSocketService = new WebSocketService();