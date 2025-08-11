import { Router } from 'express'
import { upload } from '../../utils/upload'
import { verifyToken } from '../middlewares/token.middleware'

const inventoryRouter = Router()

inventoryRouter.get('/', verifyToken, () => {})

export default inventoryRouter
