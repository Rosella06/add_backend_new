import fs from 'fs'
import path from 'path'

function getProjectName (): string {
  try {
    const packageJsonPath = path.join(process.cwd(), 'package.json')
    const packageJsonContent = fs.readFileSync(packageJsonPath, 'utf8')
    return JSON.parse(packageJsonContent).name || 'unknown-app'
  } catch {
    return 'unknown-app'
  }
}
const PROJECT_NAME = getProjectName()
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  fg: {
    black: '\x1b[30m',
    white: '\x1b[37m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
  },
  bg: {
    red: '\x1b[41m',
    green: '\x1b[42m',
    yellow: '\x1b[43m',
    blue: '\x1b[44m'
  }
}
const TAG_COLOR_PALETTE = [
  colors.fg.cyan,
  colors.fg.magenta,
  colors.fg.blue,
  colors.fg.yellow,
  colors.fg.green
]
const PREDEFINED_TAG_COLORS = new Map<string, string>([
  ['TCP', colors.fg.cyan],
  ['SOCKET', colors.fg.blue],
  ['RabbitMQ', colors.fg.yellow],
  ['SERVER', colors.fg.green],
  ['PLCService', colors.fg.magenta],
  ['PickupService', colors.fg.cyan],
  ['OrderService', colors.fg.blue]
])
function getColorForTag (tag: string): string {
  const baseTag = tag.split('-')[0].split(' ')[0]
  if (PREDEFINED_TAG_COLORS.has(baseTag)) {
    return PREDEFINED_TAG_COLORS.get(baseTag)!
  }
  if (!baseTag) return colors.fg.white
  let hash = 0
  for (let i = 0; i < baseTag.length; i++) {
    hash = baseTag.charCodeAt(i) + ((hash << 5) - hash)
  }
  const colorIndex = Math.abs(hash % TAG_COLOR_PALETTE.length)
  return TAG_COLOR_PALETTE[colorIndex]
}
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}
const CURRENT_LOG_LEVEL: LogLevel =
  LogLevel[process.env.LOG_LEVEL as keyof typeof LogLevel] ?? LogLevel.INFO
function getTimestamp (): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = (now.getMonth() + 1).toString().padStart(2, '0')
  const day = now.getDate().toString().padStart(2, '0')
  const time = now.toLocaleTimeString('en-GB', { hour12: false })
  const milliseconds = now.getMilliseconds().toString().padStart(3, '0')
  return `${year}-${month}-${day} ${time}.${milliseconds}`
}
function formatColumn (text: string, length: number): string {
  return text.padEnd(length, ' ')
}

class Logger {
  private pid: string = process.pid.toString()
  private projectName: string = PROJECT_NAME

  private log (
    level: LogLevel,
    levelChar: string,
    levelFgColor: string,
    levelBgColor: string,
    tag: string,
    message: string,
    ...args: any[]
  ): void {
    if (CURRENT_LOG_LEVEL <= level) {

      const timestamp = getTimestamp()
      const pidTid = `${this.pid}-${this.pid}`

      const tagColor = getColorForTag(tag)
      const coloredTag = `${tagColor}${formatColumn(`${tag}`, 15)}${
        colors.reset
      }`

      const formattedProjectName = formatColumn(this.projectName, 25)

      const levelIndicator = `${levelBgColor}${levelFgColor}${colors.bright} ${levelChar} ${colors.reset}`

      let coloredMessage = message
      let coloredArgs = args
      if (level === LogLevel.WARN) {
        coloredMessage = colors.fg.yellow + message
        coloredArgs = args.map(arg =>
          typeof arg === 'string' ? colors.fg.yellow + arg : arg
        )
      } else if (level === LogLevel.ERROR) {
        coloredMessage = colors.fg.red + message
        coloredArgs = args.map(arg =>
          typeof arg === 'string' ? colors.fg.red + arg : arg
        )
      }

      console.log(
        timestamp,
        formatColumn(pidTid, 12),
        coloredTag,
        formattedProjectName,
        levelIndicator,
        coloredMessage,
        ...coloredArgs,
        colors.reset
      )
    }
  }

  public debug (tag: string, message: string, ...args: any[]): void {
    this.log(
      LogLevel.DEBUG,
      'D',
      colors.fg.white,
      colors.bg.blue,
      tag,
      message,
      ...args
    )
  }
  public info (tag: string, message: string, ...args: any[]): void {
    this.log(
      LogLevel.INFO,
      'I',
      colors.fg.white,
      colors.bg.green,
      tag,
      message,
      ...args
    )
  }
  public warn (tag: string, message: string, ...args: any[]): void {
    this.log(
      LogLevel.WARN,
      'W',
      colors.fg.black,
      colors.bg.yellow,
      tag,
      message,
      ...args
    )
  }
  public error (tag: string, message: string, ...args: any[]): void {
    this.log(
      LogLevel.ERROR,
      'E',
      colors.fg.white,
      colors.bg.red,
      tag,
      message,
      ...args
    )
  }
}

export const logger = new Logger()
