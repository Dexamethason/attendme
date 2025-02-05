import { AttendMeBackendClient } from './attendmeClient';

const baseUrl = 'https://attendme-backend.runasp.net';
const client = new AttendMeBackendClient(baseUrl, {
  fetch: async (url: RequestInfo, init?: RequestInit) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      init = init || {};
      init.headers = {
        ...init.headers,
        'Authorization': `Bearer ${token}`
      };
    }
    return window.fetch(url, init);
  }
});

export interface CourseSessionFilter {
  pageNumber: number;
  pageSize: number;
  filters?: {
    search?: string;
    dateStart?: Date;
    dateEnd?: Date;
  };
}

export async function getTeacherSessions(filter: CourseSessionFilter) {
  try {
    const response = await client.courseTeacherSessionsGet(filter);
    return response.items;
  } catch (error) {
    console.error('Błąd podczas pobierania zajęć:', error);
    throw error;
  }
}