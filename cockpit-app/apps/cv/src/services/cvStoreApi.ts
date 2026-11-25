import { z } from 'zod';
import { baseApi } from '@cockpit-app/common-shared-data-access';
import { CVData } from '../types/cv.types';

const storeEnvelopeSchema = z.object({
  meta: z.object({
    key: z.string(),
    type: z.string(),
    version: z.number(),
    created_at: z.string(),
    updated_at: z.string(),
    tags: z.array(z.string()),
  }),
  data: z.unknown(),
});

// A section missing from the store (404) is a valid state: it keeps its empty
// value so CVData consumers never deal with null fields. The compiler forces
// this object to list every CVData key.
const createEmptyCVData = (): CVData => ({
  header: {
    name: '',
    title: '',
    phone: '',
    email: '',
    linkedin: { url: '' },
    location: '',
  },
  summary: [],
  skills: [],
  achievements: [],
  experience: [],
  education: [],
  personalProjects: [],
  courses: [],
});

function getEndpoints(prefix: string) {
  const BASE = `/api/v1/store/${prefix}/cv`;
  return {
    header: `${BASE}/header`,
    summary: `${BASE}/summary`,
    skills: `${BASE}/skills`,
    achievements: `${BASE}/achievements`,
    experience: `${BASE}/experience`,
    education: `${BASE}/education`,
    personalProjects: `${BASE}/projects`,
    courses: `${BASE}/courses`,
  } as const;
}

// fetchSection already returns null on 404 (when error.message includes 'HTTP 404')
// rather than throwing, so callers are protected from missing-section errors.
async function fetchSection<T>(endpoint: string): Promise<T | null> {
  try {
    const envelope = await baseApi.getRequest(endpoint, storeEnvelopeSchema);
    return envelope.data as T;
  } catch (error) {
    if (error instanceof Error && error.message.includes('HTTP 404')) {
      return null;
    }
    throw error;
  }
}

// Fetches one section and writes it into `into` when the store has it.
// Resolves to whether the section was found.
function sectionLoader<K extends keyof CVData>(key: K) {
  return async (
    endpoints: ReturnType<typeof getEndpoints>,
    into: CVData,
  ): Promise<boolean> => {
    const value = await fetchSection<CVData[K]>(endpoints[key]);
    if (value === null) return false;
    into[key] = value;
    return true;
  };
}

const sectionLoaders = [
  sectionLoader('header'),
  sectionLoader('summary'),
  sectionLoader('skills'),
  sectionLoader('achievements'),
  sectionLoader('experience'),
  sectionLoader('education'),
  sectionLoader('personalProjects'),
  sectionLoader('courses'),
];

export async function getCVData(prefix = 'base'): Promise<CVData | null> {
  const endpoints = getEndpoints(prefix);
  const cv = createEmptyCVData();
  const found = await Promise.all(
    sectionLoaders.map((load) => load(endpoints, cv)),
  );
  return found.some(Boolean) ? cv : null;
}

export async function putCVData(data: CVData, prefix = 'base'): Promise<void> {
  const ENDPOINTS = getEndpoints(prefix);
  await Promise.all([
    baseApi.putRequest(ENDPOINTS.header, storeEnvelopeSchema, {
      type: 'cv_section',
      tags: ['cv', 'header'],
      data: data.header,
    }),
    baseApi.putRequest(ENDPOINTS.summary, storeEnvelopeSchema, {
      type: 'cv_section',
      tags: ['cv', 'summary'],
      data: data.summary,
    }),
    baseApi.putRequest(ENDPOINTS.skills, storeEnvelopeSchema, {
      type: 'cv_section',
      tags: ['cv', 'skills'],
      data: data.skills,
    }),
    baseApi.putRequest(ENDPOINTS.achievements, storeEnvelopeSchema, {
      type: 'cv_section',
      tags: ['cv', 'achievements'],
      data: data.achievements,
    }),
    baseApi.putRequest(ENDPOINTS.experience, storeEnvelopeSchema, {
      type: 'cv_section',
      tags: ['cv', 'experience'],
      data: data.experience,
    }),
    baseApi.putRequest(ENDPOINTS.education, storeEnvelopeSchema, {
      type: 'cv_section',
      tags: ['cv', 'education'],
      data: data.education,
    }),
    baseApi.putRequest(ENDPOINTS.personalProjects, storeEnvelopeSchema, {
      type: 'cv_section',
      tags: ['cv', 'projects'],
      data: data.personalProjects,
    }),
    baseApi.putRequest(ENDPOINTS.courses, storeEnvelopeSchema, {
      type: 'cv_section',
      tags: ['cv', 'courses'],
      data: data.courses,
    }),
  ]);
}
