export type loginUserResponse = {
    id: string;
    token?: string;
    refreshToken?: string;
    firstName: string;
    lastName: string;
    email: string;
    cin: string;
    role: string;
    tel: string;
}


export type ChatMessages = {
    id: string;
    chatId: string;
    senderId: string;
    recipientId: string;
    content: string;
    timestamp: string;
}

