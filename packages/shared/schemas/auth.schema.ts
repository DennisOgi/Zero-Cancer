import { z } from "zod";
// Zod schema for login
export const loginSchema = z.object({
  email: z
    .string()
    .email({ message: "Please enter a valid email address." })
    .transform((value) => value.trim().toLowerCase()),
  password: z.string().min(6, { message: "Password is required." }),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(6, { message: "Current password is required." }),
    newPassword: z
      .string()
      .min(8, { message: "New password must be at least 8 characters." }),
    confirmPassword: z.string().min(8, { message: "Please confirm your new password." }),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export const actorSchema = z.enum(["patient", "donor", "center", "admin"], {
  errorMap: () => {
    return {
      message: "You are not allowed to be here.",
    };
  },
});

export type TLoginSchema = typeof loginSchema;
export type TLoginParams = z.infer<typeof loginSchema>;
export type TChangePasswordParams = z.infer<typeof changePasswordSchema>;
