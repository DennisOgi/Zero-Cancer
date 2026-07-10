import { z } from "zod";

export const patientSchema = z.object({
  email: z
    .string()
    .email({ message: "Please enter a valid email address." })
    .transform((value) => value.trim().toLowerCase()),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters." }),
  fullName: z
    .string()
    .min(2, { message: "Full name must be at least 2 characters." }),
  phone: z.string().min(7, { message: "Please enter a valid WhatsApp number." }),
  dateOfBirth: z.string({ required_error: "Date of birth is required." }),
  gender: z.enum(["MALE", "FEMALE"], { message: "Please select a gender." }),
  state: z.string().min(1, { message: "Please select a state." }),
  localGovernment: z
    .string()
    .min(1, { message: "Please select a local government." }),
  associationId: z.string().optional(),
  groupId: z.string().optional(),
  photoUrl: z.string().url().optional(),
  centerId: z.string().uuid().optional(),
});

export const donorSchema = z.object({
  email: z
    .string()
    .email({ message: "Please enter a valid email address." })
    .transform((value) => value.trim().toLowerCase()),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters." }),
  fullName: z
    .string()
    .min(2, { message: "Full name must be at least 2 characters." }),
  phone: z.string().min(7, { message: "Please enter a valid WhatsApp number." }),
  organization: z.string().optional(),
  country: z.string().optional(),
});

export const centerSchema = z.object({
  centerName: z
    .string()
    .min(2, { message: "Center name must be at least 2 characters." }),
  email: z
    .string()
    .email({ message: "Please enter a valid email address." })
    .transform((value) => value.trim().toLowerCase()),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters." }),
  phoneNumber: z
    .string()
    .min(7, { message: "Please enter a valid WhatsApp number." }),
  address: z.string().min(5, { message: "Please enter a valid address." }),
  state: z.string().min(1, { message: "Please select a state." }),
  localGovernment: z
    .string()
    .min(1, { message: "Please select a local government." }),
  services: z.array(z.string(), {
    required_error: "Please select at least one service.",
  }),
  // bankAccount: z.string().min(8),
});

export const checkProfilesSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
});

export const bookSelfPayAppointmentSchema = z.object({
  screeningTypeId: z.string().min(1, {
    message: "Screening type is required.",
  }),
  centerId: z.string().min(1, { message: "Center is required." }),
  appointmentDateTime: z.string().min(1, {
    message: "Appointment date and time is required.",
  }),
  paymentReference: z.string().min(1, {
    message: "Payment reference is required.",
  }),
});

export const selectCenterSchema = z.object({
  allocationId: z.string().min(1, { message: "Allocation ID is required." }),
  centerId: z.string().min(1, { message: "Center ID is required." }),
  appointmentDateTime: z
    .string()
    .min(1, { message: "Appointment date and time is required." }),
});

export const getPatientAppointmentsSchema = z.object({
  page: z.number().optional(),
  size: z.number().optional(),
  status: z.string().optional(),
});

export const getPatientReceiptsSchema = z.object({
  page: z.number().optional(),
  size: z.number().optional(),
});

// Get appointment by ID schema
export const getPatientAppointmentByIdSchema = z.object({
  id: z.string().uuid({
    message: "Please provide a valid appointment ID.",
  }),
});

// Export types
export const updatePatientProfileSchema = z.object({
  phone: z.string().min(7, { message: "Please enter a valid phone number." }),
  state: z.string().min(1, { message: "Please select a state." }),
  localGovernment: z
    .string()
    .min(1, { message: "Please select a local government." }),
  gender: z.enum(["MALE", "FEMALE"]).optional(),
  photoUrl: z.string().url().optional(),
});

export const assignPatientCenterSchema = z.object({
  centerId: z.string().uuid({ message: "Please select a valid center." }),
});

export const patientPhotoUploadSchema = z.object({
  fileBase64: z.string().min(1, { message: "Image data is required." }),
  fileName: z.string().min(1, { message: "File name is required." }),
  mimeType: z.enum(["image/jpeg", "image/png", "image/webp"], {
    message: "Only JPG, PNG, or WEBP images are allowed.",
  }),
});

export type TPatientRegister = z.infer<typeof patientSchema>;
export type TUpdatePatientProfile = z.infer<typeof updatePatientProfileSchema>;
export type TDonorRegister = z.infer<typeof donorSchema>;
