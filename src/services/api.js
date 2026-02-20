import axios from "axios";
import { API_BASE_URL } from "../utils/constants";
import { getToken, removeToken, removeUser } from "../utils/helpers";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

const TARGET_LOGO_MAX_BYTES = 900 * 1024;
const ABSOLUTE_LOGO_MAX_BYTES = 5 * 1024 * 1024;
const MAX_LOGO_DIMENSION = 1600;

const readImageDimensions = (file) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve({ width: image.width, height: image.height, image });
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to read selected image'));
    };

    image.src = objectUrl;
  });

const canvasToBlob = (canvas, type, quality) =>
  new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Failed to process image before upload'));
        return;
      }
      resolve(blob);
    }, type, quality);
  });

const prepareOlympiadLogoFile = async (logoFile) => {
  if (!(logoFile instanceof File)) {
    return logoFile;
  }

  if (!logoFile.type || !logoFile.type.startsWith('image/')) {
    throw new Error('Logo must be an image file (PNG, JPG, GIF, WEBP).');
  }

  if (logoFile.size <= TARGET_LOGO_MAX_BYTES) {
    return logoFile;
  }

  const { width, height, image } = await readImageDimensions(logoFile);
  const scale = Math.min(1, MAX_LOGO_DIMENSION / Math.max(width, height));
  const targetWidth = Math.max(1, Math.round(width * scale));
  const targetHeight = Math.max(1, Math.round(height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const context = canvas.getContext('2d');

  if (!context) {
    throw new Error('Failed to process image before upload');
  }

  context.drawImage(image, 0, 0, targetWidth, targetHeight);

  const mimeType = logoFile.type === 'image/png' ? 'image/png' : 'image/jpeg';
  const qualitySteps = mimeType === 'image/png' ? [undefined] : [0.88, 0.8, 0.72, 0.64, 0.56];

  let bestBlob = null;
  for (const quality of qualitySteps) {
    const blob = await canvasToBlob(canvas, mimeType, quality);
    if (!bestBlob || blob.size < bestBlob.size) {
      bestBlob = blob;
    }
    if (blob.size <= TARGET_LOGO_MAX_BYTES) {
      break;
    }
  }

  if (!bestBlob || bestBlob.size > ABSOLUTE_LOGO_MAX_BYTES) {
    throw new Error('Logo is too large. Please choose a smaller image (up to 5MB).');
  }

  const extension = mimeType === 'image/png' ? '.png' : '.jpg';
  const safeName = (logoFile.name || 'logo').replace(/\.[^.]+$/, '');

  return new File([bestBlob], `${safeName}${extension}`, {
    type: mimeType,
    lastModified: Date.now(),
  });
};

// Request interceptor to add token
api.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // If FormData, remove Content-Type header so axios can set it with boundary
    if (config.data instanceof FormData) {
      delete config.headers["Content-Type"];
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      removeToken();
      removeUser();
      // Only redirect if we're not already on an auth page
      if (!window.location.pathname.startsWith('/auth')) {
        window.location.href = "/auth";
      }
    }
    return Promise.reject(error);
  }
);

// Auth endpoints
export const authAPI = {
  register: (data) => {
    // If data is FormData, use multipart/form-data headers
    if (data instanceof FormData) {
      return api.post("/auth/register", data, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
    }
    return api.post("/auth/register", data);
  },
  login: (data) => api.post("/auth/login", data),
  loginWithGoogle: (data) => api.post("/auth/google", data),
  getMe: () => api.get("/auth/me"),
  getBalance: () => api.get("/auth/balance"),
  updateProfile: (data) => {
    // Interceptor will handle FormData Content-Type automatically
    return api.put("/auth/profile", data);
  },
  uploadLogo: (logoFile) => {
    const formData = new FormData();
    formData.append("logo", logoFile);
    return api.post("/auth/upload-logo", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },
  updateCookieConsent: (data) => {
    return api.post("/auth/cookie-consent", data);
  },
  setPassword: (data) => api.post("/auth/set-password", data),
  verifyEmail: (data) => api.post("/auth/verify-email", data),
  resendVerificationCode: (data) =>
    api.post("/auth/resend-verification-code", data),
  requestPasswordResetCode: (data) =>
    api.post("/auth/request-password-reset-code", data),
  verifyPasswordResetCode: (data) =>
    api.post("/auth/verify-password-reset-code", data),
  resetPasswordWithCode: (data) =>
    api.post("/auth/reset-password-with-code", data),
};

// Payment endpoints
export const paymentAPI = {
  createPayme: (data) => api.post("/payment/create-payme", data),
  createClick: (data) => api.post("/payment/create-click", data),
};

// Olympiad endpoints
export const olympiadAPI = {
  getAll: () => api.get("/olympiads"),
  getById: (id) => api.get(`/olympiads/${id}`),
  submit: (id, data) => api.post(`/olympiads/${id}/submit`, data),
  // Anti-cheat endpoints
  startAttempt: (id, data) => api.post(`/olympiads/${id}/start`, data),
  getAttempt: (id) => api.get(`/olympiads/${id}/attempt`),
  getQuestion: (id, questionIndex) => api.get(`/olympiads/${id}/question/${questionIndex}`),
  submitAnswer: (id, data) => api.post(`/olympiads/${id}/answer`, data),
  skipQuestion: (id, data) => api.post(`/olympiads/${id}/skip`, data),
  reportViolation: (id, data) => api.post(`/olympiads/${id}/violation`, data),
  getResults: (olympiadId, userId = null) => {
    // Backend expects /api/olympiads/results?olympiadId=...
    const params = new URLSearchParams();
    if (olympiadId) params.append("olympiadId", olympiadId);
    if (userId) params.append("userId", userId);
    const query = params.toString();

    return api.get(`/olympiads/results${query ? `?${query}` : ""}`);
  },
  uploadCameraCapture: (formData) => {
    // formData should include: olympiadId, captureType ('camera' | 'screen'), image (File)
    return api.post("/olympiads/camera-capture", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },
  uploadBatchCaptures: (formData) => {
    // formData should include: olympiadId, images (multiple File objects)
    // Backend expects batch upload of accumulated images
    return api.post("/olympiads/camera-capture/batch", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },
  uploadVideo: (formData, onUploadProgress) => {
    // formData should include: olympiadId, video (File object)
    // Upload the recorded video file to backend
    return api.post("/olympiads/upload-video", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      onUploadProgress: (progressEvent) => {
        if (onUploadProgress && progressEvent.total) {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onUploadProgress(percentCompleted);
        }
      },
    });
  },
  stopRecording: (olympiadId) => {
    // Notify backend to convert accumulated images to MP4 video
    return api.post(`/olympiads/${olympiadId}/stop-recording`);
  },
  uploadExitScreenshot: (formData) => {
    // formData should include: olympiadId, cameraImage, screenImage, exitType (tab_switch/close/navigate)
    // Used when user leaves the page - captures last frame before exit
    return api.post("/olympiads/exit-screenshot", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },
  saveDraft: (id, answers) => {
    // Save draft answers in real-time
    return api.post(`/olympiads/${id}/save-draft`, { answers });
  },
  getDraft: (id) => {
    // Get saved draft answers
    return api.get(`/olympiads/${id}/get-draft`);
  },
};

// Admin endpoints
export const adminAPI = {
  // Olympiad management
  getAllOlympiads: (params = {}) => {
    const query = new URLSearchParams();
    if (params.page) query.append("page", params.page);
    if (params.limit) query.append("limit", params.limit);
    if (params.search) query.append("search", params.search);
    if (params.status) query.append("status", params.status);
    if (params.subject) query.append("subject", params.subject);
    if (params.startDate) query.append("startDate", params.startDate);
    if (params.endDate) query.append("endDate", params.endDate);
    const queryString = query.toString();
    return api.get(`/admin/olympiads${queryString ? `?${queryString}` : ""}`);
  },
  getOlympiadById: (id) => api.get(`/admin/olympiads/${id}`),
  createOlympiad: (data) => {
    if (data instanceof FormData) {
      return api.post("/admin/olympiads", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    }
    return api.post("/admin/olympiads", data);
  },
  updateOlympiad: (id, data) => {
    if (data instanceof FormData) {
      return api.put(`/admin/olympiads/${id}`, data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    }
    return api.put(`/admin/olympiads/${id}`, data);
  },
  deleteOlympiad: (id) => api.delete(`/admin/olympiads/${id}`),

  // Upload olympiad logo
  uploadOlympiadLogo: async (logoFile, olympiadId = null) => {
    const preparedLogoFile = await prepareOlympiadLogoFile(logoFile);
    const formData = new FormData();
    formData.append("photo", preparedLogoFile);

    // Add olympiadId to form data (backend requires it)
    // Send empty string if null (for new olympiads)
    formData.append("olympiadId", olympiadId || "");

    // Also add as query parameter if provided
    let url = "/admin/olympiads/upload-logo";
    if (olympiadId) {
      url += `?olympiadId=${olympiadId}`;
    }

    return api.post(url, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },

  // Question management
  getQuestions: (olympiadId) => {
    const url = olympiadId
      ? `/admin/questions?olympiadId=${olympiadId}`
      : "/admin/questions";
    return api.get(url);
  },
  addQuestion: (data) => api.post("/admin/questions", data),
  updateQuestion: (id, data) => api.put(`/admin/questions/${id}`, data),
  deleteQuestion: (id) => api.delete(`/admin/questions/${id}`),

  // User management
  getUsers: (params = {}) => {
    const query = new URLSearchParams();
    if (params.page) query.append("page", params.page);
    if (params.limit) query.append("limit", params.limit);
    if (params.search) query.append("search", params.search);
    if (params.role) query.append("role", params.role);
    if (params.startDate) query.append("startDate", params.startDate);
    if (params.endDate) query.append("endDate", params.endDate);
    const queryString = query.toString();
    return api.get(`/admin/users${queryString ? `?${queryString}` : ""}`);
  },

  // Submissions
  getSubmissions: (olympiadId, userId) => {
    const params = new URLSearchParams();
    if (olympiadId) params.append("olympiadId", olympiadId);
    if (userId) params.append("userId", userId);
    const query = params.toString();
    return api.get(`/admin/submissions${query ? `?${query}` : ""}`);
  },

  // Camera captures
  getCameraCaptures: (olympiadId, params = {}) => {
    const query = new URLSearchParams();
    if (params.userId) query.append("userId", params.userId);
    if (params.captureType) query.append("captureType", params.captureType);
    if (params.fileType) query.append("fileType", params.fileType);
    if (params.page) query.append("page", params.page);
    if (params.limit) query.append("limit", params.limit);
    const queryString = query.toString();
    return api.get(
      `/admin/camera-captures/${olympiadId}${
        queryString ? `?${queryString}` : ""
      }`
    );
  },
};

// Owner endpoints
export const ownerAPI = {
  getDashboardSummary: () => api.get("/owner/dashboard"),
  getMetrics: (params = {}) => {
    const query = new URLSearchParams();
    if (params.startDate) query.append("startDate", params.startDate);
    if (params.endDate) query.append("endDate", params.endDate);
    const queryString = query.toString();
    return api.get(`/owner/metrics${queryString ? `?${queryString}` : ""}`);
  },
  exportUsers: (params = {}) => {
    const query = new URLSearchParams();
    if (params.search) query.append("search", params.search);
    if (params.role) query.append("role", params.role);
    if (params.startDate) query.append("startDate", params.startDate);
    if (params.endDate) query.append("endDate", params.endDate);
    const queryString = query.toString();
    return api.get(`/owner/exports/users${queryString ? `?${queryString}` : ""}`, {
      responseType: "blob",
    });
  },
  exportOlympiads: (params = {}) => {
    const query = new URLSearchParams();
    if (params.search) query.append("search", params.search);
    if (params.status) query.append("status", params.status);
    if (params.subject) query.append("subject", params.subject);
    if (params.startDate) query.append("startDate", params.startDate);
    if (params.endDate) query.append("endDate", params.endDate);
    const queryString = query.toString();
    return api.get(`/owner/exports/olympiads${queryString ? `?${queryString}` : ""}`, {
      responseType: "blob",
    });
  },
  exportAuditLogs: (params = {}) => {
    const query = new URLSearchParams();
    if (params.action) query.append("action", params.action);
    if (params.actorId) query.append("actorId", params.actorId);
    if (params.targetType) query.append("targetType", params.targetType);
    if (params.startDate) query.append("startDate", params.startDate);
    if (params.endDate) query.append("endDate", params.endDate);
    if (params.limit) query.append("limit", params.limit);
    const queryString = query.toString();
    return api.get(`/owner/exports/audit-logs${queryString ? `?${queryString}` : ""}`, {
      responseType: "blob",
    });
  },
  exportMetrics: (params = {}) => {
    const query = new URLSearchParams();
    if (params.startDate) query.append("startDate", params.startDate);
    if (params.endDate) query.append("endDate", params.endDate);
    const queryString = query.toString();
    return api.get(`/owner/exports/metrics${queryString ? `?${queryString}` : ""}`, {
      responseType: "blob",
    });
  },
  getAuditLogs: (params = {}) => {
    const query = new URLSearchParams();
    if (params.page) query.append("page", params.page);
    if (params.limit) query.append("limit", params.limit);
    if (params.action) query.append("action", params.action);
    if (params.actorId) query.append("actorId", params.actorId);
    if (params.targetType) query.append("targetType", params.targetType);
    if (params.startDate) query.append("startDate", params.startDate);
    if (params.endDate) query.append("endDate", params.endDate);
    const queryString = query.toString();
    return api.get(`/owner/audit-logs${queryString ? `?${queryString}` : ""}`);
  },
  getSystemControls: () => api.get('/owner/system-controls'),
  updateSystemControls: (data) => api.put('/owner/system-controls', data),
  getAnalytics: () => api.get("/owner/analytics"),
  changeUserRole: (userId, role) =>
    api.put(`/owner/users/${userId}/role`, { role }),
  getReports: (olympiadId) => {
    const url = olympiadId
      ? `/owner/reports?olympiadId=${olympiadId}`
      : "/owner/reports";
    return api.get(url);
  },
};

// Resolter endpoints
export const resolterAPI = {
  // View all results for a specific olympiad
  getResults: (olympiadId) => {
    const params = new URLSearchParams();
    if (olympiadId) params.append("olympiadId", olympiadId);
    const query = params.toString();
    return api.get(`/resolter/results${query ? `?${query}` : ""}`);
  },

  // View all results across all olympiads
  getAllResults: (olympiadId = null, userId = null) => {
    const params = new URLSearchParams();
    if (olympiadId) params.append("olympiadId", olympiadId);
    if (userId) params.append("userId", userId);
    const query = params.toString();
    return api.get(`/resolter/all-results${query ? `?${query}` : ""}`);
  },

  // Grade/edit essay submission
  gradeSubmission: (submissionId, data) => {
    return api.put(`/resolter/submissions/${submissionId}/grade`, data);
  },

  // Edit result directly
  editResult: (resultId, data) => {
    return api.put(`/resolter/results/${resultId}/edit`, data);
  },

  // Change result status
  changeResultStatus: (resultId, status) => {
    return api.put(`/resolter/results/${resultId}/status`, { status });
  },

  // Toggle result visibility
  toggleResultVisibility: (resultId, visible) => {
    return api.put(`/resolter/results/${resultId}/visibility`, { visible });
  },
  getCameraCaptures: (olympiadId, params = {}) => {
    const query = new URLSearchParams();
    if (params.userId) query.append("userId", params.userId);
    if (params.captureType) query.append("captureType", params.captureType);
    if (params.fileType) query.append("fileType", params.fileType);
    if (params.page) query.append("page", params.page);
    if (params.limit) query.append("limit", params.limit);
    const queryString = query.toString();
    return api.get(
      `/admin/camera-captures/${olympiadId}${
        queryString ? `?${queryString}` : ""
      }`
    );
  },

  // Make all results visible for an olympiad
  makeAllResultsVisible: (olympiadId = null) => {
    const params = new URLSearchParams();
    if (olympiadId) params.append("olympiadId", olympiadId);
    const query = params.toString();
    return api.put(
      `/resolter/results/visibility/all${query ? `?${query}` : ""}`,
      { visible: true }
    );
  },
};

// School Teacher endpoints
export const schoolTeacherAPI = {
  // Get results for students from teacher's school
  getSchoolResults: (olympiadId = null) => {
    const params = new URLSearchParams();
    if (olympiadId) params.append("olympiadId", olympiadId);
    const query = params.toString();
    return api.get(`/school-teacher/results${query ? `?${query}` : ""}`);
  },

  // Get active students from teacher's school (currently taking olympiads)
  getActiveStudents: () => {
    return api.get("/school-teacher/active-students");
  },

  // Get real-time captures for a specific student
  getStudentCaptures: (studentId, olympiadId) => {
    return api.get(
      `/school-teacher/captures/${studentId}?olympiadId=${olympiadId}`
    );
  },

  // Get all real-time captures from school students
  getAllSchoolCaptures: (olympiadId = null) => {
    const params = new URLSearchParams();
    if (olympiadId) params.append("olympiadId", olympiadId);
    const query = params.toString();
    return api.get(`/school-teacher/captures${query ? `?${query}` : ""}`);
  },
};

// Checker endpoints
export const checkerAPI = {};

// University endpoints
export const universityAPI = {

  // Olympiad management for universities
  getAllOlympiads: () => api.get("/university/olympiads"),
  getOlympiadById: (id) => api.get(`/university/olympiads/${id}`),
  createOlympiad: (data) => {
    if (data instanceof FormData) {
      return api.post("/university/olympiads", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    }
    return api.post("/university/olympiads", data);
  },
  updateOlympiad: (id, data) => {
    if (data instanceof FormData) {
      return api.put(`/university/olympiads/${id}`, data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    }
    return api.put(`/university/olympiads/${id}`, data);
  },
  deleteOlympiad: (id) => api.delete(`/university/olympiads/${id}`),
  uploadOlympiadLogo: async (logoFile, olympiadId = null) => {
    const preparedLogoFile = await prepareOlympiadLogoFile(logoFile);
    const formData = new FormData();
    formData.append("photo", preparedLogoFile);
    formData.append("olympiadId", olympiadId || "");
    let url = "/university/olympiads/upload-logo";
    if (olympiadId) {
      url += `?olympiadId=${olympiadId}`;
    }
    return api.post(url, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },
  getQuestions: (olympiadId) => {
    const url = olympiadId
      ? `/university/questions?olympiadId=${olympiadId}`
      : "/university/questions";
    return api.get(url);
  },
  addQuestion: (data) => api.post("/university/questions", data),
  updateQuestion: (id, data) => api.put(`/university/questions/${id}`, data),
  deleteQuestion: (id) => api.delete(`/university/questions/${id}`),

  // Get results for university's olympiads
  getOlympiadResults: (olympiadId) =>
    api.get(`/university/olympiads/${olympiadId}/results`),
  getAllOlympiadResults: () => api.get("/university/olympiads/results"),
};

export default api;
