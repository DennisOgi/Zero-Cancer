import { z } from "zod";

export const createCenterStaffPasswordSchema = z.object({
  token: z.string().min(10),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const centerStaffForgotPasswordSchema = z.object({
  centerId: z.string().min(1),
  email: z.string().email(),
});

export const centerStaffResetPasswordSchema = z.object({
  token: z.string().min(10),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const centerStaffLoginSchema = z.object({
  centerId: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const validateStaffInviteSchema = z.object({
  token: z.string().min(10),
});

export type TValidateStaffInviteParams = z.infer<
  typeof validateStaffInviteSchema
>;
export type TValidateStaffInviteSchema = typeof validateStaffInviteSchema;

export type TCreateCenterStaffPasswordParams = z.infer<
  typeof createCenterStaffPasswordSchema
>;
export type TCreateCenterStaffPasswordSchema =
  typeof createCenterStaffPasswordSchema;

export type TCenterStaffForgotPasswordParams = z.infer<
  typeof centerStaffForgotPasswordSchema
>;
export type TCenterStaffForgotPasswordSchema =
  typeof centerStaffForgotPasswordSchema;

export type TCenterStaffResetPasswordParams = z.infer<
  typeof centerStaffResetPasswordSchema
>;
export type TCenterStaffResetPasswordSchema =
  typeof centerStaffResetPasswordSchema;

export type TCenterStaffLoginParams = z.infer<typeof centerStaffLoginSchema>;
export type TCenterStaffLoginSchema = typeof centerStaffLoginSchema;
