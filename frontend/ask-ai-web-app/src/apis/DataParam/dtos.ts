export type CreateMessageDto = {
    message: string;
    fileName?: string;
    fileContent?: string;
    senderId: string;
    recipientId: string;
};

export type loginDto = {
    email: string;
    password: string;
}