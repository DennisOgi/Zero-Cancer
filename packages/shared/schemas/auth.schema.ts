import { z } from "zod";
// Zod schema for login
export const loginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z.string().min(6, { message: "Password is required." }),
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
