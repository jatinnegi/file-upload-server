import { dirname, join } from "path";

export const joinRelativeToMainPath = (path = "") => {
  const { filename } = require.main || {};

  if (!filename) return path;

  return join(dirname(filename), path);
};

export const getStoragePath = () => {
  const { filename } = require.main || {};

  if (!filename) return "";

  const filePath = dirname(filename).slice(0, -4);

  return `${filePath}\\storage\\public`;
};

export const getPreviewPath = () => {
  const { filename } = require.main || {};

  if (!filename) return "";

  const filePath = dirname(filename).slice(0, -4);

  return `${filePath}\\storage\\public\\previews`;
};
