export type loginUserResponse = {
    id: string;
    nickName: string;
    fullName: string;
    email: string;
    status: 'ONLINE' | 'OFFLINE';
}

export type ChatMessages = {
    id: string;
    chatId: string;
    senderId: string;
    recipientId: string;
    content: string;
    timestamp: string;
}

