import { Router } from 'express'
import { verifyToken } from '../middlewares/token.middleware'
import { createMachine, deleteMachine, getMachine } from '../controllers/machine.controller'

const machineRouter = Router()

machineRouter.get('/', verifyToken, getMachine)
machineRouter.post('/', verifyToken, createMachine)
machineRouter.delete('/:id', verifyToken, deleteMachine)

export default machineRouter
