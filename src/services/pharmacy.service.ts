import axios from 'axios'
import { config } from '../config'
import { HttpError } from '../types/global'
import { PharmacyResponse } from '../types/order' // Define this type based on actual response

export async function getPharmacyPrescriptionData (
  rfid: string
): Promise<PharmacyResponse> {
  try {
    // This is a mock response. Replace with actual API call.
    // const response = await axios.get(`${config.pharmacyApiUrl}/getPres/${rfid}`);
    // return response.data;

    // Mock data for development
    return {
      RFID: rfid,
      PrescriptionNo: `TEST-${Date.now()}`,
      PrescriptionDate: '20240520',
      HN: '1234567',
      AN: '7654321',
      PatientName: 'Mr. Test Patient',
      WardCode: 'W01',
      WardDesc: 'Test Ward',
      PriorityCode: 'N',
      PriorityDesc: 'Normal',
      Prescription: [
        {
          f_prescriptionno: 'TEST-123',
          f_orderitemcode: 'DRUG-A',
          f_orderitemname: 'Paracetamol',
          f_orderqty: 10,
          f_orderunitcode: 'TAB',
          f_binlocation: '101'
        },
        {
          f_prescriptionno: 'TEST-123',
          f_orderitemcode: 'DRUG-B',
          f_orderitemname: 'Aspirin',
          f_orderqty: 5,
          f_orderunitcode: 'TAB',
          f_binlocation: '205'
        }
      ]
    }
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      throw new HttpError(
        404,
        `Prescription with RFID ${rfid} not found in pharmacy system.`
      )
    }
    throw new HttpError(500, 'Failed to fetch data from pharmacy service.')
  }
}
