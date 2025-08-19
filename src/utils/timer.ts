import { performance } from 'perf_hooks'
import { logger } from './logger'

class StartupTimer {
  private startTime: number
  private lastTime: number

  constructor () {
    this.startTime = performance.now()
    this.lastTime = this.startTime
  }

  public check (tag: string, message: string): void {
    const now = performance.now()
    const duration = (now - this.lastTime).toFixed(2)
    logger.info(tag, `${message} (+${duration}ms)`)
    this.lastTime = now
  }

  public total (tag: string, message: string): void {
    const totalTime = (performance.now() - this.startTime).toFixed(2)
    logger.info(tag, `${message} (Total startup time: ${totalTime}ms)`)
  }
}

export default StartupTimer
