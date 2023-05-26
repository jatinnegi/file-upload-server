import { ValidationError, ValidationErrorItem } from "joi";

export const cleanErrors = (errors: ValidationError) => {
  const cleanErrors: Record<string, string> = {};

  errors.details.forEach((detail: ValidationErrorItem) => {
    const field: string | number | undefined = detail.path.pop();

    if (!field) return;

    const key = field.toString();

    cleanErrors[key] = detail.message;
  });

  return cleanErrors;
};
