export interface PharmacyResponse {
  RFID: string
  PrescriptionNo: string
  PrescriptionDate: string
  HN: string
  AN: string
  PatientName: string
  WardCode: string
  WardDesc: string
  PriorityCode: string
  PriorityDesc: string
  Prescription: PharmacyDrugItem[]
}

export interface PharmacyDrugItem {
  f_prescriptionno: string
  f_orderitemcode: string
  f_orderitemname: string
  f_orderqty: number
  f_orderunitcode: string
  f_binlocation: string
}
