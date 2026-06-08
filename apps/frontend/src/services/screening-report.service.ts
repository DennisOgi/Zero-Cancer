import request from '@/lib/request'
import * as endpoints from '@/services/endpoints'
import type { TCreateScreeningReport } from '@zerocancer/shared/schemas/screening-report.schema'

/** request.get/post already return the API body `{ ok, data }` — do not unwrap `.data` again */
export const fetchReportTaxonomy = async () => {
  return request.get(endpoints.screeningReportTaxonomy())
}

export const fetchReportTemplate = async (params: {
  category: string
  testType: string
  subTest?: string
  outcome: 'POSITIVE' | 'NEGATIVE'
}) => {
  return request.get(endpoints.screeningReportTemplate(params))
}

export const fetchEligibleReportAppointments = async (search?: string) => {
  return request.get(endpoints.screeningReportEligibleAppointments(search))
}

export const fetchReportStaff = async () => {
  return request.get(endpoints.screeningReportStaff())
}

export const createScreeningReport = async (payload: TCreateScreeningReport) => {
  return request.post(endpoints.screeningReports(), payload)
}

export const fetchScreeningReport = async (id: string) => {
  return request.get(endpoints.screeningReportById(id))
}

export const sendScreeningReportWhatsapp = async (
  id: string,
  payload: { pdfUrl?: string },
) => {
  return request.post(endpoints.sendScreeningReportWhatsapp(id), payload)
}

export const saveScreeningReportPdf = async (
  id: string,
  payload: { pdfUrl: string; pdfCloudinaryId?: string },
) => {
  return request.post(endpoints.saveScreeningReportPdf(id), payload)
}

export const fetchPublicScreeningReport = async (token: string) => {
  return request.get(endpoints.publicScreeningReportByToken(token))
}

export const centerRegisterAndEnrollPatient = async (payload: {
  fullName: string
  email: string
  whatsappNumber: string
  password: string
  dateOfBirth: string
  gender: 'MALE' | 'FEMALE'
  state: string
  localGovernment: string
  screeningTypeId: string
}) => {
  return request.post(endpoints.centerRegisterAndEnroll(), payload)
}

export const centerEnrollExistingPatient = async (payload: {
  patientId: string
  screeningTypeId: string
}) => {
  return request.post(endpoints.centerEnrollWaitlist(), payload)
}

export const searchCenterPatients = async (q: string) => {
  return request.get(endpoints.centerSearchPatients(q))
}

export const fetchPatientScreeningReports = async () => {
  return request.get(endpoints.patientScreeningReports())
}

export const fetchPatientScreeningReport = async (id: string) => {
  return request.get(endpoints.patientScreeningReportById(id))
}
