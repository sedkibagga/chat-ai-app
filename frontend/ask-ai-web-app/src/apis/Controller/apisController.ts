import axios from "axios";
import type { ChatMessages, loginUserResponse } from "../DataResponse/responses";
import type { loginDto } from "../DataParam/dtos";

const BaseUrl = 'http://localhost:8080/';

export const findChatMessages = async (
    senderId: string,
    recipientId: string,
    token: string
): Promise<ChatMessages[]> => {
    try {
        const res = await axios.get(
            `${BaseUrl}findChatMessages/${senderId}/${recipientId}`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        return res.data;
    } catch (error: any) {
        console.error('Error fetching chat messages:', error);
        throw error;
    }
}

export const login = async (user: loginDto): Promise<loginUserResponse> => {
    try {
        const response = await axios.post(`${BaseUrl}api/login`, user);
        return response.data;
    } catch (error) {
        console.error('Error logging in:', error);
        throw error;
    }
};