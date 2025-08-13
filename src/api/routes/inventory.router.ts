import { Router } from 'express'
import { verifyToken } from '../middlewares/token.middleware'
import { createInventories, deleteInventories, editInventories, getInventories, getInventoriesById, updateStock } from '../controllers/inventory.controller'

const inventoryRouter = Router()

inventoryRouter.get('/', verifyToken, getInventories)
inventoryRouter.get('/:id', verifyToken, getInventoriesById)
inventoryRouter.post('/', verifyToken, createInventories)
inventoryRouter.patch('/:id', verifyToken, editInventories)
inventoryRouter.patch('/stock/:id', verifyToken, updateStock)
inventoryRouter.delete('/:id', verifyToken, deleteInventories)

export default inventoryRouter
