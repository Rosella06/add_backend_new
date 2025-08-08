import fs from 'fs'
import path from 'path'

const PROJECT_NAME = (() => {
  try {
    const packageJsonPath = path.join(process.cwd(), 'package.json')
    const packageJsonContent = fs.readFileSync(packageJsonPath, 'utf8')
    return JSON.parse(packageJsonContent).name || 'unknown-app'
  } catch {
    return 'unknown-app'
  }
})()

const BRIGHT = '\x1b[1m'

const colors = {
  reset: '\x1b[0m',
  bright: BRIGHT,
  fg: {
    black: '\x1b[30m',
    white: BRIGHT + '\x1b[37m',
    red: BRIGHT + '\x1b[38;5;202m',
    green: BRIGHT + '\x1b[38;5;150m',
    yellow: BRIGHT + '\x1b[38;5;220m',
    blue: BRIGHT + '\x1b[38;5;147m',
    magenta: BRIGHT + '\x1b[38;5;183m',
    cyan: BRIGHT + '\x1b[38;5;147m',
    orange: BRIGHT + '\x1b[38;5;209m'
  },
  bg: {
    red: '\x1b[48;5;202m',
    green: '\x1b[48;5;42m',
    yellow: '\x1b[48;5;220m',
    blue: '\x1b[48;5;26m'
  }
}

const TAG_COLOR_PALETTE = [
  colors.fg.cyan,
  colors.fg.magenta,
  colors.fg.blue,
  colors.fg.yellow,
  colors.fg.green,
  colors.fg.orange
]

const PREDEFINED_TAG_COLORS = new Map<string, string>([
  ['TCP', colors.fg.cyan],
  ['SOCKET', colors.fg.blue],
  ['RabbitMQ', colors.fg.yellow],
  ['SERVER', colors.fg.magenta],
  ['PLCService', colors.fg.cyan],
  ['PickupService', colors.fg.blue],
  ['OrderService', colors.fg.yellow],
  ['Bootstrap', colors.fg.green],
  ['ErrorConsumer', colors.fg.orange]
])

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}
const CURRENT_LOG_LEVEL: LogLevel =
  LogLevel[process.env.LOG_LEVEL as keyof typeof LogLevel] ?? LogLevel.INFO

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

function getTimestamp (): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = (now.getMonth() + 1).toString().padStart(2, '0')
  const day = now.getDate().toString().padStart(2, '0')
  const time = now.toLocaleTimeString('en-GB', { hour12: false })
  const milliseconds = now.getMilliseconds().toString().padStart(3, '0')
  return `${year}-${month}-${day} ${time}.${milliseconds}`
}

const stripAnsi = (str: string) =>
  str.replace(
    /[\u001b\u009b][[()#;?]*.?[0-9]*[;:]*.?[0-9]*[;:]*.?[0-9]*;?[0-9]*[a-zA-Z]/g,
    ''
  )

class Logger {
  private pid: string = process.pid.toString()
  private projectName: string = PROJECT_NAME
  private maxTagLength: number = 20

  private formatTag (tag: string): string {
    const fullTag = `[${tag}]`
    if (fullTag.length > this.maxTagLength) {
      this.maxTagLength = fullTag.length
    }
    return fullTag.padEnd(this.maxTagLength, ' ')
  }

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
      const pidTid = `${this.pid}-${this.pid}`.padEnd(10, ' ')
      const plainTag = this.formatTag(tag)
      const projectNameColumn = this.projectName.padEnd(25, ' ')
      const levelIndicator = `${levelBgColor}${levelFgColor}${colors.bright} ${levelChar} ${colors.reset}`

      const plainPrefix = `${timestamp} ${pidTid} ${plainTag} ${projectNameColumn} ${levelIndicator} `
      const indentation = ' '.repeat(stripAnsi(plainPrefix).length + 2)

      const coloredTag = `${getColorForTag(tag)}${plainTag}${colors.reset}`
      const coloredPrefix = `${timestamp} ${pidTid} ${coloredTag} ${projectNameColumn} ${levelIndicator} `

      const fullMessage = [
        message,
        ...args.filter(arg => typeof arg === 'string')
      ].join(' ')
      const otherArgs = args.filter(arg => typeof arg !== 'string')

      const terminalWidth = process.stdout.columns || 120
      const messageMaxWidth = terminalWidth - indentation.length
      const wrappedMessage = fullMessage.replace(
        new RegExp(
          `(?![^\\n]{1,${messageMaxWidth}}$)([^\\n]{1,${messageMaxWidth}})\\s`,
          'g'
        ),
        `$1\n${indentation}`
      )

      let coloredWrappedMessage = wrappedMessage
      if (level === LogLevel.WARN) {
        coloredWrappedMessage = colors.fg.yellow + wrappedMessage
      } else if (level === LogLevel.ERROR) {
        coloredWrappedMessage = colors.fg.red + wrappedMessage
      }

      console.log(coloredPrefix + coloredWrappedMessage + colors.reset)

      if (otherArgs.length > 0) {
        otherArgs.forEach(arg => {
          if (arg instanceof Error && arg.stack) {
            const stack = arg.stack
              .split('\n')
              .slice(0)
              .map(
                line => `${indentation}${colors.fg.red}${line}${colors.reset}`
              )
              .join('\n')
            console.log(stack)
          } else {
            const objectString = JSON.stringify(arg, null, 2)
            const indentedObjectString = objectString
              .split('\n')
              .map(line => `${indentation}${line}`)
              .join('\n')

            let coloredIndentedString = indentedObjectString
            if (level === LogLevel.WARN) {
              coloredIndentedString =
                colors.fg.yellow + indentedObjectString + colors.reset
            } else if (level === LogLevel.ERROR) {
              coloredIndentedString =
                colors.fg.red + indentedObjectString + colors.reset
            }

            console.log(coloredIndentedString)
          }
        })
      }
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

  public separator (message: string, isSync: boolean = false): void {
    try {
      const terminalWidth = process.stdout.columns || 80
      const messageText = ` PROCESS ${message.toUpperCase()} `
      const lineLength = Math.max(
        5,
        Math.floor((terminalWidth - messageText.length) / 2)
      )
      const line = '-'.repeat(lineLength)
      const separatorLine = `${colors.fg.white}${line}${messageText}${line}${colors.reset}\n`

      if (isSync) {
        fs.writeSync(process.stdout.fd, separatorLine)
      } else {
        console.log(separatorLine.trim())
      }
    } catch (error) {
      console.log(`--- ${message} ---`)
    }
  }
}

export const logger = new Logger()
