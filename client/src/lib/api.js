// src/lib/api.js
import { supabase } from './supabase';

const API_BASE = (
  import.meta.env.VITE_API_BASE_URL || '/api/v1'
).replace(/\/+$/, '');

async function getAccessToken() {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) {
    console.error('[API] Failed to get session:', error.message);
    throw new Error('Unable to verify your session. Please log in again.');
  }

  if (!session?.access_token) {
    throw new Error('Your session has expired. Please log out and log in again.');
  }

  return session.access_token;
}

function jsonBody(data) {
  return JSON.stringify(data);
}

function queryString(params = {}) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      if (Array.isArray(value)) {
        value.forEach((item) => searchParams.append(key, String(item)));
      } else {
        searchParams.set(key, String(value));
      }
    }
  });

  return searchParams.toString();
}

function getErrorMessage(body, fallback) {
  return (
    body?.error?.message ||
    body?.message ||
    (typeof body?.error === 'string' ? body.error : null) ||
    fallback
  );
}

function createApiError(body, status, fallback) {
  const err = new Error(getErrorMessage(body, fallback));

  err.status = status;
  err.code =
    typeof body?.error === 'object'
      ? body.error?.code
      : body?.code;
  err.fieldErrors = body?.error?.fieldErrors;
  err.response = body;

  return err;
}

async function request(path, options = {}) {
  const token = await getAccessToken();
  const headers = new Headers(options.headers || {});

  headers.set('Authorization', `Bearer ${token}`);

  if (
    options.body &&
    !(options.body instanceof FormData) &&
    !headers.has('Content-Type')
  ) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    const err = createApiError(
      body,
      response.status,
      `Request failed (${response.status})`
    );

    console.error('[API] Request failed:', {
      path,
      status: response.status,
      code: err.code,
      message: err.message,
    });

    throw err;
  }

  return body;
}

async function requestBlob(path, options = {}) {
  const token = await getAccessToken();
  const headers = new Headers(options.headers || {});

  headers.set('Authorization', `Bearer ${token}`);

  if (
    options.body &&
    !(options.body instanceof FormData) &&
    !headers.has('Content-Type')
  ) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));

    throw createApiError(
      body,
      response.status,
      `Download failed (${response.status})`
    );
  }

  return response.blob();
}

// Existing presentation upload
async function uploadGroupPpt(groupId, file) {
  if (!file) {
    throw new Error('Please select a PPT, PPTX or PDF file.');
  }

  const token = await getAccessToken();
  const formData = new FormData();

  formData.append('file', file);

  const response = await fetch(
    `${API_BASE}/groups/${encodeURIComponent(groupId)}/ppt`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    }
  );

  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw createApiError(
      body,
      response.status,
      `Upload failed (${response.status})`
    );
  }

  return body;
}

// Upload an individual group project file
async function uploadGroupFile(groupId, file) {
  if (!groupId) {
    throw new Error('Group ID is missing.');
  }

  if (!file) {
    throw new Error('Please select a file.');
  }

  const token = await getAccessToken();
  const formData = new FormData();

  formData.append('file', file);

  const response = await fetch(
    `${API_BASE}/groups/${encodeURIComponent(groupId)}/files`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    }
  );

  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw createApiError(
      body,
      response.status,
      `File upload failed (${response.status})`
    );
  }

  return body;
}

function getFileNameFromDisposition(
  disposition,
  fallback = 'project-files.zip'
) {
  if (!disposition) {
    return fallback;
  }

  const utf8Match = disposition.match(/filename\*=UTF-8''([^;]+)/i);

  if (utf8Match?.[1]) {
    try {
      return decodeURIComponent(
        utf8Match[1].replace(/["']/g, '')
      );
    } catch {
      // Fall back to the standard filename.
    }
  }

  const match = disposition.match(/filename="?([^";]+)"?/i);

  return match?.[1] || fallback;
}

// Download all files in a ZIP archive
async function downloadGroupFilesZip(groupId) {
  if (!groupId) {
    throw new Error('Group ID is missing.');
  }

  const token = await getAccessToken();

  const response = await fetch(
    `${API_BASE}/groups/${encodeURIComponent(groupId)}/files/zip`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));

    throw createApiError(
      body,
      response.status,
      `ZIP download failed (${response.status})`
    );
  }

  const blob = await response.blob();

  const filename = getFileNameFromDisposition(
    response.headers.get('Content-Disposition'),
    `group-${groupId}-files.zip`
  );

  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');

  anchor.href = objectUrl;
  anchor.download = filename;

  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  URL.revokeObjectURL(objectUrl);

  return {
    success: true,
    filename,
  };
}

export const api = {
  // Projects
  createDraft: (data) =>
    request('/projects/drafts', {
      method: 'POST',
      body: jsonBody(data),
    }),

  listProjects: () => request('/projects'),

  getProject: (id) =>
    request(`/projects/${encodeURIComponent(id)}`),

  getProjectByCode: (code) =>
    request(`/projects/lookup/${encodeURIComponent(code.trim())}`),

  lookupByCode: (code) =>
    request(`/projects/lookup/${encodeURIComponent(code.trim())}`),

  updateProject: (id, data) =>
    request(`/projects/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: jsonBody(data),
    }),

  deleteProject: (id) =>
    request(`/projects/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }),

  submitProject: (id) =>
    request(`/projects/${encodeURIComponent(id)}/submit`, {
      method: 'POST',
    }),

  saveRoster: (projectId, members) =>
    request(`/projects/${encodeURIComponent(projectId)}/roster`, {
      method: 'POST',
      body: jsonBody({ members }),
    }),

  joinByCode: (projectCode) =>
    request('/projects/join', {
      method: 'POST',
      body: jsonBody({
        project_code: projectCode.trim(),
      }),
    }),

  kickMember: (projectId, studentId) =>
    request(
      `/projects/${encodeURIComponent(projectId)}/members/${encodeURIComponent(studentId)}/remove`,
      { method: 'POST' }
    ),

  // Project invitations
  inviteMember: (projectId, data) =>
    request(`/projects/${encodeURIComponent(projectId)}/invitations`, {
      method: 'POST',
      body: jsonBody(data),
    }),

  listProjectInvitations: (projectId) =>
    request(`/projects/${encodeURIComponent(projectId)}/invitations`),

  listMyInvitations: () =>
    request('/invitations'),

  acceptInvitation: (id) =>
    request(`/invitations/${encodeURIComponent(id)}/accept`, {
      method: 'POST',
    }),

  declineInvitation: (id) =>
    request(`/invitations/${encodeURIComponent(id)}/decline`, {
      method: 'POST',
    }),

  // Technologies
  listTechnologies: (params = {}) => {
    const qs = queryString(params);

    return request(`/technologies${qs ? `?${qs}` : ''}`);
  },

  addProjectTechnology: (projectId, data) =>
    request(`/projects/${encodeURIComponent(projectId)}/technologies`, {
      method: 'POST',
      body: jsonBody(data),
    }),

  removeProjectTechnology: (projectId, techId) =>
    request(
      `/projects/${encodeURIComponent(projectId)}/technologies/${encodeURIComponent(techId)}`,
      { method: 'DELETE' }
    ),

  updateProjectTechnology: (projectId, techId, data) =>
    request(
      `/projects/${encodeURIComponent(projectId)}/technologies/${encodeURIComponent(techId)}`,
      {
        method: 'PATCH',
        body: jsonBody(data),
      }
    ),

  // Students
  searchStudents: (q, exclude = []) => {
    const params = new URLSearchParams({
      q: q.trim(),
    });

    if (exclude.length) {
      params.set('exclude', exclude.join(','));
    }

    return request(`/students/search?${params.toString()}`);
  },

  getStudentByIdentifiers: (registrationNumber, rollNumber) => {
    const params = new URLSearchParams({
      registration_number: registrationNumber.trim(),
      roll_number: rollNumber.trim(),
    });

    return request(`/students/search?${params.toString()}`);
  },

  // Faculty
  searchFaculty: (q = '') => {
    const params = new URLSearchParams();

    if (q.trim()) {
      params.set('q', q.trim());
    }

    const qs = params.toString();

    return request(`/faculty/search${qs ? `?${qs}` : ''}`);
  },

  assignSupervisor: (projectId, facultyId) =>
    request(`/projects/${encodeURIComponent(projectId)}/supervisors`, {
      method: 'POST',
      body: jsonBody({
        faculty_id: facultyId,
      }),
    }),

  removeSupervisor: (projectId, facultyId) =>
    request(
      `/projects/${encodeURIComponent(projectId)}/supervisors/${encodeURIComponent(facultyId)}`,
      { method: 'DELETE' }
    ),

  // Profile
  getMe: () =>
    request('/me'),

  updateProfile: (data) =>
    request('/me/profile', {
      method: 'PATCH',
      body: jsonBody(data),
    }),

  // Modules
  listModules: (projectId) =>
    request(`/projects/${encodeURIComponent(projectId)}/modules`),

  createModule: (projectId, data) =>
    request(`/projects/${encodeURIComponent(projectId)}/modules`, {
      method: 'POST',
      body: jsonBody(data),
    }),

  updateModule: (projectId, moduleId, data) =>
    request(
      `/projects/${encodeURIComponent(projectId)}/modules/${encodeURIComponent(moduleId)}`,
      {
        method: 'PATCH',
        body: jsonBody(data),
      }
    ),

  // Tasks
  listMyTasks: () =>
    request('/projects/my-tasks'),

  listTasks: (projectId) =>
    request(`/projects/${encodeURIComponent(projectId)}/tasks`),

  createTask: (projectId, data) =>
    request(`/projects/${encodeURIComponent(projectId)}/tasks`, {
      method: 'POST',
      body: jsonBody(data),
    }),

  updateTask: (projectId, taskId, data) =>
    request(
      `/projects/${encodeURIComponent(projectId)}/tasks/${encodeURIComponent(taskId)}`,
      {
        method: 'PATCH',
        body: jsonBody(data),
      }
    ),

  // Milestones
  listMilestones: (projectId) =>
    request(`/projects/${encodeURIComponent(projectId)}/milestones`),

  createMilestone: (projectId, data) =>
    request(`/projects/${encodeURIComponent(projectId)}/milestones`, {
      method: 'POST',
      body: jsonBody(data),
    }),

  updateMilestone: (projectId, milestoneId, data) =>
    request(
      `/projects/${encodeURIComponent(projectId)}/milestones/${encodeURIComponent(milestoneId)}`,
      {
        method: 'PATCH',
        body: jsonBody(data),
      }
    ),

  // Progress and activity
  getProgress: (projectId) =>
    request(`/projects/${encodeURIComponent(projectId)}/progress`),

  listActivity: (projectId) =>
    request(`/projects/${encodeURIComponent(projectId)}/activity`),

  // Project files
  getUploadUrl: (projectId, data) =>
    request(`/projects/${encodeURIComponent(projectId)}/files/upload-url`, {
      method: 'POST',
      body: jsonBody(data),
    }),

  confirmUpload: (projectId, data) =>
    request(`/projects/${encodeURIComponent(projectId)}/files/confirm`, {
      method: 'POST',
      body: jsonBody(data),
    }),

  listFiles: (projectId) =>
    request(`/projects/${encodeURIComponent(projectId)}/files`),

  getDownloadUrl: (projectId, fileId) =>
    request(
      `/projects/${encodeURIComponent(projectId)}/files/${encodeURIComponent(fileId)}/download`
    ),

  getFileUrl: (projectId, fileId) =>
    request(
      `/projects/${encodeURIComponent(projectId)}/files/${encodeURIComponent(fileId)}/download`
    ),

  deleteFile: (projectId, fileId) =>
    request(
      `/projects/${encodeURIComponent(projectId)}/files/${encodeURIComponent(fileId)}`,
      { method: 'DELETE' }
    ),

  // Project links
  listLinks: (projectId) =>
    request(`/projects/${encodeURIComponent(projectId)}/links`),

  createLink: (projectId, data) =>
    request(`/projects/${encodeURIComponent(projectId)}/links`, {
      method: 'POST',
      body: jsonBody(data),
    }),

  // Notifications
  listNotifications: (unreadOnly = false) =>
    request(`/notifications${unreadOnly ? '?unread=true' : ''}`),

  markNotificationRead: (id) =>
    request(`/notifications/${encodeURIComponent(id)}/read`, {
      method: 'POST',
    }),

  markAllNotificationsRead: () =>
    request('/notifications/read-all', {
      method: 'POST',
    }),

  deleteNotification: (id) =>
    request(`/notifications/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }),

  deleteAllNotifications: () =>
    request('/notifications', {
      method: 'DELETE',
    }),

  // Existing group PPT endpoints
  deleteGroupPpt: (groupId, submissionId) =>
    request(
      `/groups/${encodeURIComponent(groupId)}/submissions/${encodeURIComponent(submissionId)}/ppt`,
      { method: 'DELETE' }
    ),

  // Reviews
  getReviewQueue: (status) =>
    request(
      `/reviews/queue${status ? `?status=${encodeURIComponent(status)}` : ''}`
    ),

  getProjectReviews: (projectId) =>
    request(`/reviews/project/${encodeURIComponent(projectId)}`),

  submitReview: (projectId, data) =>
    request(`/reviews/${encodeURIComponent(projectId)}`, {
      method: 'POST',
      body: jsonBody(data),
    }),

  resubmitProject: (projectId) =>
    request(`/reviews/${encodeURIComponent(projectId)}/resubmit`, {
      method: 'POST',
    }),

  listRubrics: () =>
    request('/reviews/rubrics'),

  // Ideas
  listIdeas: (all = false) =>
    request(`/ideas${all ? '?all=true' : ''}`),

  getIdea: (id) =>
    request(`/ideas/${encodeURIComponent(id)}`),

  createIdea: (data) =>
    request('/ideas', {
      method: 'POST',
      body: jsonBody(data),
    }),

  useIdea: (id) =>
    request(`/ideas/${encodeURIComponent(id)}/use`, {
      method: 'POST',
    }),

  // Admin
  getAdminStats: () =>
    request('/admin/stats'),

  listCategories: () =>
    request('/admin/categories'),

  // Submission groups
  listGroups: () =>
    request('/groups'),

  createGroup: (data) =>
    request('/groups', {
      method: 'POST',
      body: jsonBody(data),
    }),

  getGroup: (id) =>
    request(`/groups/${encodeURIComponent(id)}`),

  updateGroup: (id, data) =>
    request(`/groups/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: jsonBody(data),
    }),

  deleteGroup: (id) =>
    request(`/groups/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }),

  joinGroup: (id) =>
    request(`/groups/${encodeURIComponent(id)}/join`, {
      method: 'POST',
    }),

  saveGroupSubmission: (id, data) =>
    request(`/groups/${encodeURIComponent(id)}/submission`, {
      method: 'PATCH',
      body: jsonBody(data),
    }),

  requestGroupResubmission: (groupId, reason) =>
    request(
      `/groups/${encodeURIComponent(groupId)}/resubmission-request`,
      {
        method: 'POST',
        body: jsonBody({ reason }),
      }
    ),

  reviewGroupResubmission: (groupId, submissionId, data) =>
    request(
      `/groups/${encodeURIComponent(groupId)}/submissions/${encodeURIComponent(submissionId)}/resubmission-review`,
      {
        method: 'POST',
        body: jsonBody(data),
      }
    ),

  uploadGroupPpt,

  getGroupPptUrl: (groupId, submissionId) =>
    request(
      `/groups/${encodeURIComponent(groupId)}/submissions/${encodeURIComponent(submissionId)}/ppt`
    ),

  // Group project files.
  // Backend must implement these corresponding routes.
  uploadGroupFile,

  listGroupFiles: (groupId) =>
    request(`/groups/${encodeURIComponent(groupId)}/files`),

  getGroupFileUrl: (groupId, fileId) =>
    request(
      `/groups/${encodeURIComponent(groupId)}/files/${encodeURIComponent(fileId)}/download`
    ),

  deleteGroupFile: (groupId, fileId) =>
    request(
      `/groups/${encodeURIComponent(groupId)}/files/${encodeURIComponent(fileId)}`,
      { method: 'DELETE' }
    ),

  downloadGroupFilesZip,

  // Supervision meetings
  listSupervisionMeetings: (params = {}) => {
    const qs = queryString(params);

    return request(`/supervision/meetings${qs ? `?${qs}` : ''}`);
  },

  getSupervisionMeeting: (meetingId) =>
    request(`/supervision/meetings/${encodeURIComponent(meetingId)}`),

  createSupervisionMeeting: (data) =>
    request('/supervision/meetings', {
      method: 'POST',
      body: jsonBody(data),
    }),

  updateSupervisionMeeting: (meetingId, data) =>
    request(`/supervision/meetings/${encodeURIComponent(meetingId)}`, {
      method: 'PATCH',
      body: jsonBody(data),
    }),

  cancelSupervisionMeeting: (meetingId) =>
    request(`/supervision/meetings/${encodeURIComponent(meetingId)}`, {
      method: 'DELETE',
    }),

  respondToSupervisionMeeting: (meetingId, response) =>
    request(
      `/supervision/meetings/${encodeURIComponent(meetingId)}/respond`,
      {
        method: 'POST',
        body: jsonBody({ response }),
      }
    ),

  // Supervision messages
  listSupervisionConversations: () =>
    request('/supervision/messages/conversations'),

  listSupervisionMessages: (userId) =>
    request(`/supervision/messages/${encodeURIComponent(userId)}`),

  sendSupervisionMessage: (data) =>
    request('/supervision/messages', {
      method: 'POST',
      body: jsonBody(data),
    }),

  markSupervisionMessagesRead: (userId) =>
    request(`/supervision/messages/${encodeURIComponent(userId)}/read`, {
      method: 'POST',
    }),

  // Supervision notes
  listSupervisionNotes: (params = {}) => {
    const qs = queryString(params);

    return request(`/supervision/notes${qs ? `?${qs}` : ''}`);
  },

  createSupervisionNote: (data) =>
    request('/supervision/notes', {
      method: 'POST',
      body: jsonBody(data),
    }),

  updateSupervisionNote: (noteId, data) =>
    request(`/supervision/notes/${encodeURIComponent(noteId)}`, {
      method: 'PATCH',
      body: jsonBody(data),
    }),

  deleteSupervisionNote: (noteId) =>
    request(`/supervision/notes/${encodeURIComponent(noteId)}`, {
      method: 'DELETE',
    }),
};

export default api;