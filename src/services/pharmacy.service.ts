import axios from 'axios'
import { HttpError } from '../types/global'
import { PharmacyResponse } from '../types/order'

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
      PrescriptionNo: 'TEST-1024',
      HN: '52867933',
      PatientName: 'นาง ทดสอบ66 ระบบ66',
      Prescription: [
        {
          f_prescriptionno: 'TEST-1024',
          f_prescriptiondate: '20240305',
          f_hn: '52867933',
          f_an: '57651113',
          f_patientname: 'นาง ทดสอบ66 ระบบ66',
          f_wardcode: '603',
          f_warddesc: 'นวมินทรฯ 17 เหนือ',
          f_prioritycode: 'N',
          f_prioritydesc: 'New',
          f_orderitemcode: '1540000002',
          f_orderitemname: 'Ferli 6 Tablet',
          f_orderqty: 1,
          f_orderunitcode: 'TAB',
          Machine: 'ADD',
          command: 'B0133D0001S1D4321',
          f_binlocation: '33',
          RowID: 'E3F4C1BB-03F5-4564-BBCB-11DA755E2D11'
        },
        {
          f_prescriptionno: 'TEST-1024',
          f_prescriptiondate: '20240305',
          f_hn: '52867933',
          f_an: '57651113',
          f_patientname: 'นาง ทดสอบ66 ระบบ66',
          f_wardcode: '603',
          f_warddesc: 'นวมินทรฯ 17 เหนือ',
          f_prioritycode: 'N',
          f_prioritydesc: 'New',
          f_orderitemcode: '1200001878',
          f_orderitemname: 'Filgrastim (Neutromax) 480 mcg Inj (vial 1.6 mL)',
          f_orderqty: 1,
          f_orderunitcode: 'TAB',
          Machine: 'ADD',
          command: 'B0121D0001S1D4321',
          f_binlocation: '21',
          RowID: 'FD6EF258-4BFD-4204-ACC9-1B6E91260BBC'
        },
        {
          f_prescriptionno: 'TEST-1024',
          f_prescriptiondate: '20240305',
          f_hn: '52867933',
          f_an: '57651113',
          f_patientname: 'นาง ทดสอบ66 ระบบ66',
          f_wardcode: '603',
          f_warddesc: 'นวมินทรฯ 17 เหนือ',
          f_prioritycode: 'N',
          f_prioritydesc: 'New',
          f_orderitemcode: 'P5TTS',
          f_orderitemname: 'PARACETAMOL TAB. 500 MG (SARA)',
          f_orderqty: 3,
          f_orderunitcode: 'TAB',
          Machine: 'ADD',
          command: 'B0115D0010S1D4321',
          f_binlocation: '15',
          RowID: '8BCEC124-38B4-4A0C-8018-556EE6A9D4A5'
        },
        {
          f_prescriptionno: 'TEST-1024',
          f_prescriptiondate: '20240305',
          f_hn: '52867933',
          f_an: '57651113',
          f_patientname: 'นาง ทดสอบ66 ระบบ66',
          f_wardcode: '603',
          f_warddesc: 'นวมินทรฯ 17 เหนือ',
          f_prioritycode: 'N',
          f_prioritydesc: 'New',
          f_orderitemcode: 'VCTTG5',
          f_orderitemname: 'VITAMIN C # TAB 500 MG @ (GPO)',
          f_orderqty: 3,
          f_orderunitcode: 'TAB',
          Machine: 'ADD',
          command: 'B0124D0003S1D4321',
          f_binlocation: '24',
          RowID: '3EEAAAAA-E6B2-499D-B381-B98900F7A7EC'
        },
        {
          f_prescriptionno: 'TEST-1024',
          f_prescriptiondate: '20240305',
          f_hn: '52867933',
          f_an: '57651113',
          f_patientname: 'นาง ทดสอบ66 ระบบ66',
          f_wardcode: '603',
          f_warddesc: 'นวมินทรฯ 17 เหนือ',
          f_prioritycode: 'N',
          f_prioritydesc: 'New',
          f_orderitemcode: '1540000001',
          f_orderitemname: 'Ascorbic Acid Tab 100 Mg',
          f_orderqty: 2,
          f_orderunitcode: 'TAB',
          Machine: 'ADD',
          command: 'B0132D0002S1D4321',
          f_binlocation: '32',
          RowID: '7C85141D-5038-4519-950E-2FB8AE2E607B'
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
