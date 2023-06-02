import { Router } from "express";
import { authGuards } from "@/guards/authGuard";
import { authValidation } from "@/validations";
import { userController } from "@/controllers/userController";

export const user = (router: Router) => {
  router.get("/user/verification/:accessToken", userController.verification);
};
