import { NextFunction, Response } from "express";
import joi from "joi";
import { StatusCodes, ReasonPhrases } from "http-status-codes";
import winston from "winston";

import {
  SignInPayload,
  SignUpPayload,
  ResetPasswordPayload,
  NewPasswordPayload,
} from "@/contracts/auth";
import { IBodyRequest } from "@/contracts/request";
import { cleanErrors } from "@/utils/cleanErrors";

export const authValidation = {
  signIn: (
    req: IBodyRequest<SignInPayload>,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const schema = joi.object({
        email: joi
          .string()
          .email({ tlds: { allow: true } })
          .required()
          .messages({
            "any.required": "Email is required",
            "string.empty": "Email is required",
            "string.email": "Enter a valid email",
          }),
        password: joi.string().required().messages({
          "any.required": "Password is required",
          "string.empty": "Password is required",
        }),
      });

      const { value, error: validationErrors } = schema.validate(req.body, {
        abortEarly: false,
      });

      if (validationErrors)
        return res.status(StatusCodes.BAD_REQUEST).json({
          error: cleanErrors(validationErrors),
          message: ReasonPhrases.BAD_REQUEST,
          status: StatusCodes.BAD_REQUEST,
        });

      Object.assign(req.body, value);

      next();
    } catch (error) {
      winston.error(error);

      return res.status(StatusCodes.BAD_REQUEST).json({
        message: ReasonPhrases.BAD_REQUEST,
        status: StatusCodes.BAD_REQUEST,
      });
    }
  },

  signUp: (
    req: IBodyRequest<SignUpPayload>,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const schema = joi.object({
        email: joi
          .string()
          .email({ tlds: { allow: true } })
          .required()
          .messages({
            "any.required": "Email is required",
            "string.empty": "Email is required",
            "string.email": "Enter a valid email",
          }),
        password: joi.string().min(6).required().messages({
          "any.required": "Password is required",
          "string.empty": "Password is required",
          "string.min": "Password should be atleast 6 characters long",
        }),
        confirmPassword: joi
          .any()
          .valid(joi.ref("password"))
          .required()
          .messages({
            "any.required": "Passwords don't match",
            "any.only": "Passwords don't match",
          }),
      });

      const { value, error: validationErrors } = schema.validate(req.body, {
        abortEarly: false,
      });

      if (validationErrors)
        return res.status(StatusCodes.BAD_REQUEST).json({
          error: cleanErrors(validationErrors),
          message: ReasonPhrases.BAD_REQUEST,
          status: StatusCodes.BAD_REQUEST,
        });

      Object.assign(req.body, value);

      next();
    } catch (error) {
      winston.error(error);

      return res.status(StatusCodes.BAD_REQUEST).json({
        message: ReasonPhrases.BAD_REQUEST,
        status: StatusCodes.BAD_REQUEST,
      });
    }
  },
};
