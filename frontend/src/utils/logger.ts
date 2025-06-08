export const log = (...args: unknown[]): void => {
  if (import.meta.env.DEV) {
    console.log(...args);
  }
};

export const error = (...args: unknown[]): void => {
  if (import.meta.env.DEV) {
    console.error(...args);
  }
};
