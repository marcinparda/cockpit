import type { CVData, HeaderData } from '../types/cv.types';

export function createHeaderDataMock(overrides: Partial<HeaderData> = {}): HeaderData {
  return {
    name: '',
    title: '',
    phone: '',
    email: '',
    linkedin: { url: '' },
    location: '',
    ...overrides,
  };
}

export function createCVDataMock(overrides: Partial<CVData> = {}): CVData {
  return {
    header: createHeaderDataMock(),
    summary: [],
    skills: [],
    achievements: [],
    experience: [],
    education: [],
    personalProjects: [],
    courses: [],
    ...overrides,
  };
}
