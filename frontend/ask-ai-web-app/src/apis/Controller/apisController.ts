// src/apis/apiFunctions.ts
import type { ChatMessages, loginUserResponse } from "../DataResponse/responses";
import type { loginDto } from "../DataParam/dtos";
import api, { BaseUrl } from "../Interceptors/axiosInstance";
export const login = async (user: loginDto): Promise<loginUserResponse> => {

  try {
    const response = await api.post("/api/login", user);

    const token = response.data.token;
    console.log("Received token:", token);
   
    const userData: loginUserResponse = {
      id: response.data.id,
      firstName: response.data.firstName,
      lastName: response.data.lastName,
      email: response.data.email,
      cin: response.data.cin,
      role: response.data.role,
      tel: response.data.tel,
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
    console.log("Fetched chat messages:", res.data);
    return res.data;
  } catch (error: any) {
    console.error("Error fetching chat messages:", error);
    throw error;
  }
};


export const extractTextFromFile = async (file: File): Promise<string> => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post(BaseUrl + 'api/pdf/extract-text', formData , {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error extracting text from file:', error);
    throw error; 
  }
};