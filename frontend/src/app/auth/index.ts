import { log } from '../../utils/logger';

const validateConfig = () => {
  log('No auth extension enabled');
};

export const auth = {
  validateConfig,
  // Placeholder to not break existing code
  getAuthHeaderValue: async () => "",
};
