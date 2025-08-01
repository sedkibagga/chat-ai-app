import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
// import type { ChatMessage, ChatNotification } from '../types/Types';
import type { ChatMessages, loginUserResponse } from '../apis/DataResponse/responses';
import type { AskGeminiMessageDto } from '../apis/DataParam/askGeminiMessageDto';

class WebSocketService {
  private stompClient: Client | null = null;
  private currentUser: loginUserResponse | null = null;
  connect(
    user: loginUserResponse,
    // onUserListUpdated: (users: loginUserResponse[]) => void,
    onMessagesList : (message:string) => void,
    onChatMessagesList : (chatMessage:ChatMessages) => void
  ) {
    this.currentUser = user;

    const socket = new SockJS('http://localhost:8080/ws');

    this.stompClient = new Client({
      webSocketFactory: () => socket,
      reconnectDelay: 5000,
      debug: (str) => console.log('[WS]', str),
      connectHeaders: {
        'username': user.fullName
      }
    });

    this.stompClient.onConnect = () => {
      console.log('Connected to WebSocket');


      // this.stompClient?.publish({
      //   destination: '/app/addUser/user.addUser',
      //   body: JSON.stringify(user)
      // });


      this.stompClient?.subscribe('/topic/public', (message) => {
        console.log('Subscribed to /topic/public');
        console.log("Received messages", message.body);
        onMessagesList(message.body);
        // const updatedUsers = JSON.parse(message.body) as loginUserResponse[];
        // onUserListUpdated(updatedUsers);
      });

      ///chat/ask-ai-assistant

     
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

    // Send disconnect notification first
    // try {
    //   console.log('Sending disconnect message for user:', this.currentUser);
    //   this.stompClient.publish({
    //     destination: '/app/disconnect/user.disconnectUser',
    //     body: JSON.stringify(this.currentUser)
    //   });
    //   console.log('Disconnect message sent successfully');
    // } catch (e) {
    //   console.error('Error sending disconnect message:', e);
    // }

    // Then disconnect
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

  // sendPrivateMessage(recipient: string, content: string) {
  //   if (this.stompClient && this.currentUser) {
  //     this.stompClient.publish({
  //       destination: '/app/user.private',
  //       body: JSON.stringify({
  //         fullName: recipient,
  //         nickName: content
  //       })
  //     });
  //   }
  // }

  sendChatMessage(content: string) {
    // console.log("receive from chatcontext:", recipientId, "with content:", content);
    console.log("this.currentUser:", this.currentUser);
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
      // const chatMessage: ChatMessage = { //ymkn ysir prob fil chatId 
      //   senderId: this.currentUser.id,
      //   recipientId,
      //   content,
      //   timestamp: new Date()
      // };
      // console.log("Sending chat message:", chatMessage);

      // this.stompClient.publish({
      //   destination: '/app/chat/privateMessage',
      //   body: JSON.stringify(chatMessage),
      // });
    }
  }
  
 
}

export const webSocketService = new WebSocketService();