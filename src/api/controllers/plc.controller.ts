import { NextFunction, Request, Response } from 'express'
import {
  PlcCommandRequestBody,
  PlcCommandSchema
} from '../../validators/plc.validator'
import {
  plcSendCommandMService,
  plcSendCommandService
} from '../services/plc.service'
import { HttpError } from '../../types/global'
import { PlcCommand } from '../../types/plc'
import { tcpService } from '../../utils/tcp.service'

export const plcSendCommand = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validatedBody: PlcCommandRequestBody = PlcCommandSchema.parse(
      req.body
    )

    const socket = tcpService.getSocketByMachineId(validatedBody.machineId)
    if (!socket || socket.destroyed) throw new Error('Socket not connected')

    const result = await plcSendCommandService(validatedBody, socket)

    res.status(200).json({
      message: 'Success',
      success: true,
      data: result
    })
  } catch (error) {
    next(error)
  }
}

export const plcSendCommandM = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    let validatedBody: PlcCommandRequestBody = PlcCommandSchema.parse(req.body)

    if (!validatedBody.command) {
      throw new HttpError(409, 'Command field is missing.')
    }

    const commandValue = validatedBody.command.trim().toUpperCase()
    const plcCommand = PlcCommand[commandValue as keyof typeof PlcCommand]

    if (!plcCommand) {
      throw new HttpError(400, 'Invalid command.')
    }

    if (plcCommand === PlcCommand.M32) {
      if (
        validatedBody.floor === undefined ||
        validatedBody.position === undefined ||
        validatedBody.qty === undefined
      ) {
        throw new HttpError(400, 'Missing params for ShowModules (m32).')
      }
    }

    validatedBody.command = plcCommand

    const socket = tcpService.getSocketByMachineId(validatedBody.machineId)
    if (!socket || socket.destroyed) throw new Error('Socket not connected')

    const result = await plcSendCommandMService(
      validatedBody,
      socket,
      commandValue
    )

    res.status(200).json({
      message: 'Success',
      success: true,
      data: result
    })
  } catch (error) {
    next(error)
  }
}
