import prisma from '../../config/prisma'

async function getNextRunningNumber (machineId: string): Promise<number> {
  const machine = await prisma.machines.findUnique({
    where: { id: machineId },
    select: { running: true }
  })

  if (!machine) {
    throw new Error(`Machine with ID ${machineId} not found.`)
  }

  const currentRunning = machine.running

  const nextRunning = currentRunning >= 9 ? 1 : currentRunning + 1

  await prisma.machines.update({
    where: { id: machineId },
    data: { running: nextRunning }
  })

  return currentRunning
}
