import axios from 'axios';

const API_BASE = '/api';

export const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json'
  }
});

export async function uploadFiles(files) {
  const formData = new FormData();
  files.forEach(file => {
    formData.append('files', file);
  });

  try {
    const response = await axios.post(`${API_BASE}/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress: (progressEvent) => {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        return percentCompleted;
      }
    });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Upload failed');
  }
}

export async function getSession(sessionId) {
  try {
    const response = await api.get(`/session/${sessionId}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Failed to fetch session');
  }
}

export async function completeSession(sessionId) {
  try {
    const response = await api.post(`/session/${sessionId}/complete`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Failed to complete session');
  }
}
