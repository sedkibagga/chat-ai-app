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
    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const { data } = await api.post('/api/refresh');
        api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
        originalRequest.headers['Authorization'] = `Bearer ${data.token}`;
        return api(originalRequest);
      } catch (err) {
        return Promise.reject(err);
      }
    }
    return Promise.reject(error);
  }
);

export default api;