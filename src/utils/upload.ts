import path from 'node:path'
import { promises as fsPromises, existsSync, mkdirSync } from 'fs'
import { Request } from 'express'
import { v4 as uuidv4 } from 'uuid'
import multer, {
  diskStorage,
  FileFilterCallback,
  Multer,
  StorageEngine
} from 'multer'
import { HttpError } from '../types/global'
import { logger } from './logger'

const TAG = 'UPLOAD'

type DestinationCallback = (error: Error | null, destination: string) => void
type FileNameCallback = (error: Error | null, filename: string) => void

const storage: StorageEngine = diskStorage({
  destination: (
    req: Request,
    _file: Express.Multer.File,
    callback: DestinationCallback
  ): void => {
    let pathname: string = selectPath(req.originalUrl.split('/')[2])
    if (!existsSync(pathname)) mkdirSync(pathname, { recursive: true })
    callback(null, path.join(pathname))
  },
  filename: (
    _req: Request,
    file: Express.Multer.File,
    callback: FileNameCallback
  ): void => {
    let extArr: string[] = file.originalname.split('.')
    let ext: string = extArr[extArr.length - 1]
    callback(
      null,
      file.mimetype === 'application/octet-stream' ||
        file.mimetype === 'application/macbinary'
        ? file.originalname
        : `img-${uuidv4()}.${ext}`
    )
  }
})

const upload: Multer = multer({
  storage: storage,
  fileFilter: (
    _req: Request,
    file: Express.Multer.File,
    callback: FileFilterCallback
  ) => {
    if (
      file.mimetype === 'image/png' ||
      file.mimetype === 'image/jpg' ||
      file.mimetype === 'image/jpeg' ||
      file.mimetype === 'application/octet-stream' ||
      file.mimetype === 'application/macbinary'
    ) {
      callback(null, true)
    } else {
      return callback(new HttpError(400, 'Invalid mime type'))
    }
  }
})

const selectPath = (path: string): string => {
  let pathname: string = ''
  switch (path) {
    case 'auth':
      pathname =
        process.env.NODE_ENV === 'development'
          ? 'src/public/images/users'
          : 'public/images/users'
      break
    case 'users':
      pathname =
        process.env.NODE_ENV === 'development'
          ? 'src/public/images/users'
          : 'public/images/users'
      break
    case 'drugs':
      pathname =
        process.env.NODE_ENV === 'development'
          ? 'src/public/images/drugs'
          : 'public/images/drugs'
      break
    default:
      pathname =
        process.env.NODE_ENV === 'development'
          ? 'src/public/images'
          : 'public/images'
  }
  return pathname
}

async function deleteImagePath (
  category: string,
  filename: string
): Promise<void> {
  if (!filename) {
    logger.warn(
      TAG,
      'Attempted to delete an image with an empty filename. Skipping.'
    )
    return Promise.resolve()
  }

  try {
    const dirPath = selectPath(category)
    const fullImagePath = path.join(dirPath, filename)
    await fsPromises.unlink(fullImagePath)

    logger.info(
      TAG,
      `Image file has been deleted successfully: ${fullImagePath}`
    )
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      logger.warn(
        TAG,
        `Attempted to delete a non-existent file, which is acceptable: ${filename}`
      )
    } else {
      logger.error(TAG, `Failed to delete file '${filename}'.`, error)
    }
  }
}

export { upload, deleteImagePath }
