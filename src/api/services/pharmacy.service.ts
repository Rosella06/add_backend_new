import axios from 'axios'
import { HttpError } from '../../types/global'
import { PharmacyResponse } from '../../types/order'

export async function getPharmacyPrescriptionData(
  rfid: string
): Promise<PharmacyResponse> {
  try {
    const prescription = mockPrescriptions[rfid]
    if (!prescription) {
      throw new HttpError(404, `Prescription with RFID ${rfid} not found.`)
    }
    return prescription
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

const mockPrescriptions: Record<string, PharmacyResponse> = {
  "1": {
    RFID: "1",
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
        f_orderqty: 2,
        f_orderunitcode: 'TAB',
        Machine: 'ADD',
        command: 'B0133D0001S1D4321',
        f_binlocation: '23',
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
        f_orderqty: 2,
        f_orderunitcode: 'TAB',
        Machine: 'ADD',
        command: 'B0121D0001S1D4321',
        f_binlocation: '42',
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
        f_orderqty: 2,
        f_orderunitcode: 'TAB',
        Machine: 'ADD',
        command: 'B0115D0010S1D4321',
        f_binlocation: '25',
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
        f_orderqty: 2,
        f_orderunitcode: 'TAB',
        Machine: 'ADD',
        command: 'B0124D0003S1D4321',
        f_binlocation: '47',
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
  },
  "2": {
    RFID: "2",
    PrescriptionNo: "TEST-2002",
    HN: "HN002",
    PatientName: "นาง ทดสอบ ระบบ 2",
    Prescription: [
      {
        f_prescriptionno: "TEST-2002",
        f_prescriptiondate: "20240306",
        f_hn: "HN002",
        f_an: "AN002",
        f_patientname: "นาง ทดสอบ ระบบ 2",
        f_wardcode: "602",
        f_warddesc: "Ward B",
        f_prioritycode: "N",
        f_prioritydesc: "Normal",
        f_orderitemcode: "DRUG010",
        f_orderitemname: "Vitamin C 500mg",
        f_orderqty: 2,
        f_orderunitcode: "TAB",
        Machine: "ADD",
        command: "CMD010",
        f_binlocation: "23",
        RowID: "ROW-221"
      },
      {
        f_prescriptionno: "TEST-2002",
        f_prescriptiondate: "20240306",
        f_hn: "HN002",
        f_an: "AN002",
        f_patientname: "นาง ทดสอบ ระบบ 2",
        f_wardcode: "602",
        f_warddesc: "Ward B",
        f_prioritycode: "N",
        f_prioritydesc: "Normal",
        f_orderitemcode: "DRUG011",
        f_orderitemname: "Ibuprofen 400mg",
        f_orderqty: 3,
        f_orderunitcode: "TAB",
        Machine: "ADD",
        command: "CMD011",
        f_binlocation: "22",
        RowID: "ROW-222"
      },
      {
        f_prescriptionno: "TEST-2002",
        f_prescriptiondate: "20240306",
        f_hn: "HN002",
        f_an: "AN002",
        f_patientname: "นาง ทดสอบ ระบบ 2",
        f_wardcode: "602",
        f_warddesc: "Ward B",
        f_prioritycode: "N",
        f_prioritydesc: "Normal",
        f_orderitemcode: "DRUG013",
        f_orderitemname: "calciferol 20000 units",
        f_orderqty: 4,
        f_orderunitcode: "CAP",
        Machine: "ADD",
        command: "CMD012",
        f_binlocation: "23",
        RowID: "ROW-223"
      },
      {
        f_prescriptionno: "TEST-2002",
        f_prescriptiondate: "20240306",
        f_hn: "HN002",
        f_an: "AN002",
        f_patientname: "นาง ทดสอบ ระบบ 2",
        f_wardcode: "602",
        f_warddesc: "Ward B",
        f_prioritycode: "N",
        f_prioritydesc: "Normal",
        f_orderitemcode: "DRUG014",
        f_orderitemname: "moxcillin capsule",
        f_orderqty: 2,
        f_orderunitcode: "CAP",
        Machine: "ADD",
        command: "CMD012",
        f_binlocation: "53",
        RowID: "ROW-223"
      },
      {
        f_prescriptionno: "TEST-2002",
        f_prescriptiondate: "20240306",
        f_hn: "HN002",
        f_an: "AN002",
        f_patientname: "นาง ทดสอบ ระบบ 2",
        f_wardcode: "602",
        f_warddesc: "Ward B",
        f_prioritycode: "N",
        f_prioritydesc: "Normal",
        f_orderitemcode: "DRUG015",
        f_orderitemname: "aspirin tablet 325 mg",
        f_orderqty: 2,
        f_orderunitcode: "CAP",
        Machine: "ADD",
        command: "CMD012",
        f_binlocation: "210",
        RowID: "ROW-223"
      }
      , {
        f_prescriptionno: "TEST-2002",
        f_prescriptiondate: "20240306",
        f_hn: "HN002",
        f_an: "AN002",
        f_patientname: "นาง ทดสอบ ระบบ 2",
        f_wardcode: "602",
        f_warddesc: "Ward B",
        f_prioritycode: "N",
        f_prioritydesc: "Normal",
        f_orderitemcode: "DRUG016",
        f_orderitemname: "prenolol 50 mg",
        f_orderqty: 2,
        f_orderunitcode: "CAP",
        Machine: "ADD",
        command: "CMD012",
        f_binlocation: "68",
        RowID: "ROW-223"
      }
      , {
        f_prescriptionno: "TEST-2002",
        f_prescriptiondate: "20240306",
        f_hn: "HN002",
        f_an: "AN002",
        f_patientname: "นาง ทดสอบ ระบบ 2",
        f_wardcode: "602",
        f_warddesc: "Ward B",
        f_prioritycode: "N",
        f_prioritydesc: "Normal",
        f_orderitemcode: "DRUG017",
        f_orderitemname: "amoxcillin capsule",
        f_orderqty: 3,
        f_orderunitcode: "CAP",
        Machine: "ADD",
        command: "CMD012",
        f_binlocation: "24",
        RowID: "ROW-223"
      }
    ]
  },
  "3": {
    RFID: "3",
    PrescriptionNo: "TEST-1001",
    HN: "HN001",
    PatientName: "นาย ทดสอบ ระบบ 1",
    Prescription: [
      {
        f_prescriptionno: "TEST-1001",
        f_prescriptiondate: "20240305",
        f_hn: "HN001",
        f_an: "AN001",
        f_patientname: "นาย ทดสอบ ระบบ 1",
        f_wardcode: "601",
        f_warddesc: "Ward A",
        f_prioritycode: "N",
        f_prioritydesc: "Normal",
        f_orderitemcode: "DRUG001",
        f_orderitemname: "poli flunarin cap",
        f_orderqty: 4,
        f_orderunitcode: "TAB",
        Machine: "ADD",
        command: "CMD001",
        f_binlocation: "42",
        RowID: "ROW-111"
      },
      {
        f_prescriptionno: "TEST-1001",
        f_prescriptiondate: "20240305",
        f_hn: "HN001",
        f_an: "AN001",
        f_patientname: "นาย ทดสอบ ระบบ 1",
        f_wardcode: "601",
        f_warddesc: "Ward A",
        f_prioritycode: "N",
        f_prioritydesc: "Normal",
        f_orderitemcode: "DRUG002",
        f_orderitemname: "paracap tab. 500 mg (sara)",
        f_orderqty: 3,
        f_orderunitcode: "TAB",
        Machine: "ADD",
        command: "CMD002",
        f_binlocation: "31",
        RowID: "ROW-112"
      },
      {
        f_prescriptionno: "TEST-1001",
        f_prescriptiondate: "20240305",
        f_hn: "HN001",
        f_an: "AN001",
        f_patientname: "นาย ทดสอบ ระบบ 1",
        f_wardcode: "601",
        f_warddesc: "Ward A",
        f_prioritycode: "N",
        f_prioritydesc: "Normal",
        f_orderitemcode: "DRUG003",
        f_orderitemname: "sulfasalazine 500 mg salazine",
        f_orderqty: 2,
        f_orderunitcode: "TAB",
        Machine: "ADD",
        command: "CMD002",
        f_binlocation: "51",
        RowID: "ROW-112"
      },
      {
        f_prescriptionno: "TEST-1001",
        f_prescriptiondate: "20240305",
        f_hn: "HN001",
        f_an: "AN001",
        f_patientname: "นาย ทดสอบ ระบบ 1",
        f_wardcode: "601",
        f_warddesc: "Ward A",
        f_prioritycode: "N",
        f_prioritydesc: "Normal",
        f_orderitemcode: "DRUG004",
        f_orderitemname: "calciferol 20000 units",
        f_orderqty: 3,
        f_orderunitcode: "TAB",
        Machine: "ADD",
        command: "CMD002",
        f_binlocation: "64",
        RowID: "ROW-112"
      },
      {
        f_prescriptionno: "TEST-1001",
        f_prescriptiondate: "20240305",
        f_hn: "HN001",
        f_an: "AN001",
        f_patientname: "นาย ทดสอบ ระบบ 1",
        f_wardcode: "601",
        f_warddesc: "Ward A",
        f_prioritycode: "N",
        f_prioritydesc: "Normal",
        f_orderitemcode: "DRUG005",
        f_orderitemname: "Acalciferol 20000 units",
        f_orderqty: 3,
        f_orderunitcode: "TAB",
        Machine: "ADD",
        command: "CMD002",
        f_binlocation: "32",
        RowID: "ROW-112"
      }
    ]
  }
}