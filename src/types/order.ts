import { Role } from '@prisma/client'

export type PharmacyResponse = {
  RFID: string
  PrescriptionNo: string
  HN: string
  PatientName: string
  Prescription: PharmacyDrugItem[]
}

export type PharmacyDrugItem = {
  f_prescriptionno: string
  f_prescriptiondate: string
  f_hn: string
  f_an: string
  f_patientname: string
  f_wardcode: string
  f_warddesc: string
  f_prioritycode: string
  f_prioritydesc: string
  f_orderitemcode: string
  f_orderitemname: string
  f_orderqty: number
  f_orderunitcode: string
  Machine: string
  command: string
  f_binlocation: string
  RowID: string
}

export type UserJwtPayload = {
  id: string
  userRole: Role
  displayName: string
  userStatus: boolean
  iat: number
  exp: number
}
