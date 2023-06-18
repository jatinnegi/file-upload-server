import { Router } from "express";
import { filesController } from "@/controllers/filesController";
import { authGuards } from "@/guards/authGuard";

export const files = (router: Router) => {
  router.post("/files", authGuards.isAuth, filesController.getFiles);
  router.post("/files/upload", authGuards.isAuth, filesController.upload);
  router.post("/files/rename", authGuards.isAuth, filesController.rename);
  router.post("/files/download", authGuards.isAuth, filesController.download);
  router.post("/files/delete", authGuards.isAuth, filesController.delete);
  router.post("/files/create", authGuards.isAuth, filesController.create);
};
