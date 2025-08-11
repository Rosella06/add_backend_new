enum PlcCommand {
  M01 = 'DispenseRight',
  M02 = 'DispenseLeft',
  M38 = 'CheckDoor',
  M39 = 'CheckTray',
  M40 = 'CheckShelf',
  M30 = 'Reboot',
  M31 = 'Reset',
  M32 = 'ShowModules',
  M33 = 'HideModules',
  M34 = 'UnlockRight',
  M35 = 'UnlockLeft',
  M36 = 'OffRight',
  M37 = 'OffLeft',
  DispenseRight = 'DispenseRight',
  CheckDoor = 'CheckDoor',
  CheckTray = 'CheckTray',
  CheckShelf = 'CheckShelf',
  DispenseLeft = 'DispenseLeft'
}

type PlcResponse = {
  message: string
  plcResponse: string
}

class PLCStatusError extends Error {
  constructor (message: string) {
    super(message)
    this.name = 'PLCStatusError'
  }
}

enum PlcCommandTwo {
  CheckDoor = 'M38',
  CheckTray = 'M39',
  CheckShelf = 'M40',
  DispenseRight = 'M01',
  DispenseLeft = 'M02'
}

const failStatuses = [
  '37',
  '33',
  '21',
  '22',
  '23',
  '24',
  '25',
  '26',
  '27',
  '31',
  '32'
]

const successStatuses = ['34', '35', '36', '30', '20', '36', '37']

export {
  PlcCommand,
  PlcResponse,
  PLCStatusError,
  PlcCommandTwo,
  successStatuses,
  failStatuses
}
