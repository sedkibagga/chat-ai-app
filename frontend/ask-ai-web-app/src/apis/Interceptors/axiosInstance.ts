// axiosInstance.ts
import axios from 'axios';
export const BaseUrl = 'http://localhost:8080/';

const api = axios.create({
  baseURL: BaseUrl,
  withCredentials: true
});



api.interceptors.response.use(
  res => res,
  async error => {
    const originalRequest = error.config;
    if (originalRequest._retry) {
      return Promise.reject(error);
    }
    if ((error.response?.status === 401 || error.response?.status === 403) && !originalRequest._retry && !originalRequest.url.includes('/api/refresh')) {
      originalRequest._retry = true;
      try {
        const { data } = await api.post('/api/refresh');
        console.log('data', data);
        return api(originalRequest);
      } catch (err) {
        return Promise.reject(err);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
