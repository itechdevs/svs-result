import axios from "axios";

export const apiClient = axios.create({
  baseURL: "/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Response interceptor to extract the standard data and throw clean messages on error
apiClient.interceptors.response.use(
  (response) => {
    // If our standard response has success: true, return the inner data
    if (response.data && response.data.success === true) {
      return response.data.data;
    }
    return response.data;
  },
  (error) => {
    const message =
      error.response?.data?.error ||
      error.response?.data?.message ||
      error.message ||
      "An unexpected error occurred";
    
    // Attach error details if validation failed
    const details = error.response?.data?.details || null;
    
    const formattedError = new Error(message) as Error & { details?: any; status?: number };
    formattedError.details = details;
    formattedError.status = error.response?.status;
    
    return Promise.reject(formattedError);
  }
);
