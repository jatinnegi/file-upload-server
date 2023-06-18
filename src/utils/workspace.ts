import fs from "fs";
import { dirSize } from "./files";

export interface WorkspaceProps {
  name: string;
  items: number;
  size: number;
  type: string;
  createdAt: string;
  modifiedAt: string;
}

export const getWorkspace = async (
  targetPath: string,
  folders: WorkspaceProps[],
  files: WorkspaceProps[]
) => {
  const contents = fs.readdirSync(targetPath);

  for (let i = 0; i < contents.length; i++) {
    const path = `${targetPath}/${contents[i]}`;
    const stats = fs.lstatSync(path);

    if (stats.isDirectory()) {
      const { length } = fs.readdirSync(path);
      const size = await dirSize(path);

      folders.push({
        name: contents[i],
        items: length,
        size,
        type: "folder",
        createdAt: stats.birthtime.toString(),
        modifiedAt: stats.mtime.toString(),
      });
    } else {
      const stats = fs.statSync(path);

      files.push({
        name: contents[i],
        items: 1,
        type: contents[i].split(".").pop() || "file",
        size: stats.size,
        createdAt: stats.birthtime.toString(),
        modifiedAt: stats.mtime.toString(),
      });
    }
  }
};

export const filesToWorkspace = (
  files: any,
  workspaceFolders: WorkspaceProps[],
  workspaceFiles: WorkspaceProps[]
) => {
  const folderData: {
    [key: string]: {
      items: number;
      size: string;
      createdAt: Date;
      modifiedAt: Date;
    };
  } = {};

  Object.keys(files).forEach((file: string) => {
    if (file.includes("/")) {
      const key = file.split("/")[1] || "";
      if (folderData[key])
        folderData[key] = {
          ...folderData[key],
          items: folderData[key].items + 1,
          size: folderData[key].size + files[file].size,
        };
      else
        folderData[key] = {
          items: 1,
          size: files[file].size,
          createdAt: new Date(),
          modifiedAt: new Date(),
        };
    } else
      workspaceFiles.push({
        name: file,
        items: 1,
        size: files[file].size,
        createdAt: new Date().toString(),
        modifiedAt: new Date().toString(),
        type: file.split(".").pop() || "",
      });
  });

  Object.keys(folderData).forEach((key: string) => {
    workspaceFolders.push({
      name: key,
      items: folderData[key].items,
      size: +folderData[key].size,
      createdAt: folderData[key].createdAt.toString(),
      modifiedAt: folderData[key].modifiedAt.toString(),
      type: "folder",
    });
  });
};
