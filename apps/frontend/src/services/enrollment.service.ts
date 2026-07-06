import request from '@/lib/request'
import * as endpoints from '@/services/endpoints'

export const fetchPatientEnrollmentRequests = async (status = 'PENDING') => {
  return request.get(endpoints.patientEnrollmentRequests(status))
}

export const fetchCenterEnrollmentRequests = async (status = 'PENDING') => {
  return request.get(endpoints.centerEnrollmentRequests(status))
}

export const respondToEnrollmentRequest = async (
  id: string,
  action: 'approve' | 'reject',
) => {
  return request.post(endpoints.respondPatientEnrollmentRequest(id), { action })
}
