import { Router } from 'express'
import { verifyToken } from '../middlewares/token.middleware'
import { deleteInventories, getInventories, getInventoriesById } from '../controllers/inventory.controller'

const inventoryRouter = Router()

inventoryRouter.get('/', verifyToken, getInventories)
inventoryRouter.get('/:id', verifyToken, getInventoriesById)
inventoryRouter.post('/', verifyToken, () => {})
inventoryRouter.patch('/:id', verifyToken, () => {})
inventoryRouter.patch('/stock/:id', verifyToken, () => {})
inventoryRouter.delete('/:id', verifyToken, deleteInventories)

export default inventoryRouter
