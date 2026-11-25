import { mode } from './consts';

export interface Environments {
  loginUrl: string;
  cockpitUrl: string;
  cvUrl: string;
  storeUrl: string;
  habitsUrl: string;
  twodoUrl: string;
  actualUrl: string;
  brainUrl: string;
  storybookUrl: string;
  apiUrl: string;
  mode: string;
}

export const developmentEnvironments: Environments = {
  loginUrl: 'http://localhost:4202',
  cockpitUrl: 'http://localhost:4203',
  cvUrl: 'http://localhost:4204',
  storeUrl: 'http://localhost:4205',
  habitsUrl: 'http://localhost:4208',
  twodoUrl: 'https://twodo.parda.me',
  actualUrl: 'https://budget.parda.me',
  brainUrl: 'http://localhost:8384/',
  storybookUrl: 'https://storybook.parda.me',
  apiUrl: 'http://localhost:8000',
  mode: mode.development,
};

export const productionEnvironments: Environments = {
  loginUrl: 'https://login.parda.me',
  cockpitUrl: 'https://cockpit.parda.me',
  cvUrl: 'https://cv.parda.me',
  storeUrl: 'https://store.parda.me',
  habitsUrl: 'https://habits.parda.me',
  twodoUrl: 'https://twodo.parda.me',
  actualUrl: 'https://budget.parda.me',
  brainUrl: 'https://syncthing.parda.me/',
  storybookUrl: 'https://storybook.parda.me',
  apiUrl: 'https://api.parda.me',
  mode: mode.production,
};

export function selectEnvironments(isProduction: boolean): Environments {
  return isProduction ? productionEnvironments : developmentEnvironments;
}

export const environments: Environments = selectEnvironments(import.meta.env.PROD);
