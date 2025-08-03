// src/apis/apiFunctions.ts
import type { ChatMessages, loginUserResponse } from "../DataResponse/responses";
import type { loginDto } from "../DataParam/dtos";
import api from "../Interceptors/axiosInstance";

export const login = async (user: loginDto): Promise<loginUserResponse> => {
  try {
    const response = await api.post("/api/login", user);

    const token = response.data.token;

    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

    const userData:loginUserResponse = {
      id: response.data.id,
      firstName: response.data.firstName,
      lastName: response.data.lastName,
      email: response.data.email,
      cin: response.data.cin,
      role: response.data.role,
      tel: response.data.tel
    }
    return userData; 
  } catch (error) {
    console.error("Error logging in:", error);
    throw error;
  }
};

export const findChatMessages = async (
  senderId: string,
  recipientId: string
): Promise<ChatMessages[]> => {
  try {
    const res = await api.get(`/findChatMessages/${senderId}/${recipientId}`);
    return res.data;
  } catch (error: any) {
    console.error("Error fetching chat messages:", error);
    throw error;
  }
};
