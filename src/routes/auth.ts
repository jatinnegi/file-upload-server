import { Router } from "express";
import { authGuards } from "@/guards/authGuard";
import { authValidation } from "@/validations";
import { authController } from "@/controllers/authController";

export const auth = (router: Router) => {
  router.post(
    "/auth/sign-in",
    authGuards.isGuest,
    authValidation.signIn,
    authController.signIn
  );

  router.post(
    "/auth/sign-up",
    authGuards.isGuest,
    authValidation.signUp,
    authController.signUp
  );
};
