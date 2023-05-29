import { dirname, join } from "path";

export const joinRelativeToMainPath = (path = "") => {
  const { filename } = require.main || {};
  console.log(filename);
  if (!filename) return path;
  console.log(dirname(filename), path);
  return join(dirname(filename), path);
};
