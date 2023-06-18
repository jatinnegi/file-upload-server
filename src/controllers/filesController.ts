import { Response } from "express";
import { ReasonPhrases, StatusCodes } from "http-status-codes";
import { getStoragePath } from "@/utils/paths";
import {
  ICombinedRequest,
  IBodyRequest,
  IQueryRequest,
} from "@/contracts/request";
import {
  WorkspaceProps,
  getWorkspace,
  filesToWorkspace,
} from "@/utils/workspace";
import winston from "winston";
import fs from "fs";
import { zip } from "zip-a-folder";
import { UserDocument } from "@/models/user";

export const filesController = {
  getFiles: async (
    req: ICombinedRequest<{ user: UserDocument }, { path: string }>,
    res: Response
  ) => {
    const userId = String(req.context.user.id);

    try {
      let { path } = req.body;

      path = path.replace(/\//g, "\\");

      const targetPath = `${getStoragePath()}\\${userId}${path}`;
      // const targetPath = `${getStoragePath()}\\user-123${path}`;

      if (!fs.existsSync(targetPath)) {
        fs.mkdirSync(targetPath);
        return res.status(StatusCodes.OK).json({
          folders: [],
          files: [],
          status: StatusCodes.OK,
          message: ReasonPhrases.OK,
        });
      }

      const folders: WorkspaceProps[] = [];
      const files: WorkspaceProps[] = [];

      await getWorkspace(targetPath, folders, files);

      console.log(folders);
      console.log(files);

      return res.status(StatusCodes.OK).json({
        folders,
        files,
        status: StatusCodes.OK,
        message: ReasonPhrases.OK,
      });
    } catch (error) {
      winston.error(error);
    }
  },
  upload: (
    req: IQueryRequest<{ workspace: string; overwrite: string }>,
    res: Response
  ) => {
    const userId = String(req.context.user.id);

    try {
      const overwrite: boolean = req.query.overwrite
        ? req.query.overwrite === "true"
        : false;

      const workspacePath = req.query.workspace
        .replace(/#/g, "\\")
        .replace(/%20/g, " ")
        .replace(/%40/g, "@");

      console.log(workspacePath);

      if (!req.files)
        return res
          .status(StatusCodes.OK)
          .json({ status: StatusCodes.OK, message: ReasonPhrases.OK });

      const filesFail: Set<string> = new Set<string>();
      const pathsFail: Set<string> = new Set<string>();
      let uploaded = 0;
      const currentCycle: Set<string> = new Set<string>();

      const storagePath =
        workspacePath === ""
          ? `${getStoragePath()}\\${userId}`
          : `${getStoragePath()}\\${userId}\\${workspacePath}`;
      if (!fs.existsSync(storagePath)) fs.mkdirSync(storagePath);

      const files: any = req.files;

      let workspaceFiles: WorkspaceProps[] = [];
      let workspaceFolders: WorkspaceProps[] = [];

      filesToWorkspace(files, workspaceFolders, workspaceFiles);

      Object.keys(files).forEach((key: string) => {
        const file = files[key];
        const path = key.split("/");

        if (path[0] === "") path.shift();
        path.reverse();

        const firstCheck: string = path[path.length - 1];
        const firstCheckPath: string = `${storagePath}\\${
          path[path.length - 1]
        }`;

        if (
          !overwrite &&
          fs.existsSync(firstCheckPath) &&
          !currentCycle.has(firstCheckPath)
        ) {
          filesFail.add(firstCheck);

          path.reverse();
          const pathStr = path.length === 1 ? path[0] : "/" + path.join("/");
          pathsFail.add(pathStr);
          return;
        }

        currentCycle.add(firstCheckPath);

        function recursive(fileName: string | undefined, pathStr: string) {
          if (!fileName) return;

          const filePath = `${pathStr}\\${fileName}`;

          if (path.length === 0) {
            uploaded++;
            file.mv(filePath, (err: any) => {
              if (err) {
                uploaded--;
                winston.error(err);
              }
            });
          } else {
            if (!fs.existsSync(filePath)) fs.mkdirSync(filePath);
            recursive(path.pop() || "", filePath);
          }
        }

        recursive(path.pop(), storagePath);
      });

      workspaceFolders = workspaceFolders.filter(
        (folder: WorkspaceProps) => !filesFail.has(folder.name)
      );
      workspaceFiles = workspaceFiles.filter(
        (file: WorkspaceProps) => !pathsFail.has(file.name)
      );

      return res.status(StatusCodes.OK).json({
        uploaded,
        folders: workspaceFolders,
        files: workspaceFiles,
        pathsFail: Array.from(pathsFail),
        filesFail: Array.from(filesFail),
        status: StatusCodes.OK,
        message: ReasonPhrases.OK,
      });
    } catch (error) {
      console.log(error);
      winston.error(error);
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: StatusCodes.BAD_REQUEST,
        message: ReasonPhrases.BAD_REQUEST,
      });
    }
  },

  rename: (
    req: IBodyRequest<{ path: string; oldName: string; newName: string }>,
    res: Response
  ) => {
    const userId = String(req.context.user.id);
    const { path, oldName, newName } = req.body;

    try {
      if (!oldName || !newName) throw new Error("Invalid request body");

      const storagePath = `${getStoragePath()}\\${userId}`;
      const targetPath =
        path.trim() === ""
          ? `${storagePath}\\${oldName}`
          : `${storagePath}\\${path}\\${oldName}`;
      const newPath =
        path.trim() === ""
          ? `${storagePath}\\${newName}`
          : `${storagePath}\\${path}\\${newName}`;

      if (fs.existsSync(newPath))
        return res.status(StatusCodes.CONFLICT).json({
          status: StatusCodes.CONFLICT,
          message: ReasonPhrases.CONFLICT,
        });

      fs.renameSync(targetPath, newPath);

      return res.status(StatusCodes.OK).json({
        status: StatusCodes.OK,
        message: ReasonPhrases.OK,
      });
    } catch (error) {
      winston.error(error);
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: StatusCodes.BAD_REQUEST,
        message: ReasonPhrases.BAD_REQUEST,
      });
    }
  },

  download: async (
    req: IBodyRequest<{ target: string; isFolder: boolean }>,
    res: Response
  ) => {
    const { target, isFolder } = req.body;
    const userId = String(req.context.user.id);

    try {
      if (!target || typeof isFolder === "undefined")
        throw new Error("Invalid body");

      const storagePath = `${getStoragePath()}\\${userId}`;
      const targetPath = `${storagePath}\\${target}`;
      let previewPath = "";

      if (isFolder) {
        previewPath = `${getStoragePath()}\\previews\\download.zip`;
        await zip(targetPath, previewPath);
      } else previewPath = targetPath;

      res.download(previewPath);
    } catch (error) {
      winston.error(error);
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: StatusCodes.BAD_REQUEST,
        message: ReasonPhrases.BAD_REQUEST,
      });
    }
  },
  delete: async (
    req: IBodyRequest<{ target: string; isFolder: boolean }>,
    res: Response
  ) => {
    const { target, isFolder } = req.body;
    const userId = String(req.context.user.id);

    try {
      if (!target || typeof isFolder === "undefined")
        throw new Error("Invalid body");

      const storagePath = `${getStoragePath()}\\${userId}`;
      const targetPath = `${storagePath}\\${target}`;

      if (!fs.existsSync(targetPath))
        return res.status(StatusCodes.OK).json({
          delete: false,
          status: StatusCodes.OK,
          message: ReasonPhrases.OK,
        });

      if (isFolder) fs.rmSync(targetPath, { recursive: true, force: true });
      else fs.unlinkSync(targetPath);

      return res.status(StatusCodes.OK).json({
        delete: true,
        status: StatusCodes.OK,
        message: ReasonPhrases.OK,
      });
    } catch (error) {
      console.log(error);
      winston.error(error);
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: StatusCodes.BAD_REQUEST,
        message: ReasonPhrases.BAD_REQUEST,
      });
    }
  },

  create: async (req: IBodyRequest<{ path: string }>, res: Response) => {
    const { path } = req.body;
    const userId = String(req.context.user.id);

    try {
      if (!path) throw new Error("Invalid body");

      const storagePath = `${getStoragePath()}\\${userId}`;
      const targetPath = `${storagePath}${path}`;

      if (fs.existsSync(targetPath))
        return res.status(StatusCodes.CONFLICT).json({
          status: StatusCodes.CONFLICT,
          message: ReasonPhrases.CONFLICT,
        });

      fs.mkdirSync(targetPath);

      return res
        .status(StatusCodes.OK)
        .json({ status: StatusCodes.OK, message: ReasonPhrases.OK });
    } catch (error) {
      console.log(error);
      winston.error(error);
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: StatusCodes.BAD_REQUEST,
        message: ReasonPhrases.BAD_REQUEST,
      });
    }
  },
};
