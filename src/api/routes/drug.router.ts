import { Router } from 'express'
import { upload } from '../../utils/upload'
import { verifyToken } from '../middlewares/token.middleware'
import {
  createDrug,
  deleteDrug,
  editDrug,
  getDrug,
  getDrugById
} from '../controllers/drug.controller'

const drugRouter = Router()

drugRouter.get('/', verifyToken, getDrug)
drugRouter.get('/:id', verifyToken, getDrugById)
drugRouter.post('/', verifyToken, upload.single('upload'), createDrug)
drugRouter.patch('/:id', verifyToken, upload.single('upload'), editDrug)
drugRouter.delete('/:id', verifyToken, deleteDrug)

export default drugRouter
