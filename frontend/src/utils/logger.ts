export const log = (...args: unknown[]): void => {
  if (import.meta.env.DEV) {
    console.log(...args);
  }
};

export const debug = (...args: unknown[]): void => {
  if (import.meta.env.DEV) {
    console.debug(...args);
  }
};

export const info = (...args: unknown[]): void => {
  if (import.meta.env.DEV) {
    console.info(...args);
  }
};

export const error = (...args: unknown[]): void => {
  if (import.meta.env.DEV) {
    console.error(...args);
  }
};
