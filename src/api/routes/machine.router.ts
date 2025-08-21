import { Router } from 'express'
import { verifyToken } from '../middlewares/token.middleware'
import {
  createMachine,
  deleteMachine,
  editMachine,
  getMachine,
  getMachineById,
  getMachineOnline
} from '../controllers/machine.controller'

const machineRouter = Router()

machineRouter.get('/', verifyToken, getMachine)
machineRouter.get('/:id', verifyToken, getMachineById)
machineRouter.get('/status/online', verifyToken, getMachineOnline)
machineRouter.post('/', verifyToken, createMachine)
machineRouter.patch('/:id', verifyToken, editMachine)
machineRouter.delete('/:id', verifyToken, deleteMachine)

export default machineRouter
