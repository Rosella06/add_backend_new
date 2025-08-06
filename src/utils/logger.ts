const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',

  fg: {
    black: '\x1b[30m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m'
  },
  bg: {
    black: '\x1b[40m',
    red: '\x1b[41m',
    green: '\x1b[42m',
    yellow: '\x1b[43m',
    blue: '\x1b[44m',
    magenta: '\x1b[45m',
    cyan: '\x1b[46m',
    white: '\x1b[47m'
  }
}

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

const CURRENT_LOG_LEVEL: LogLevel =
  LogLevel[process.env.LOG_LEVEL as keyof typeof LogLevel] ?? LogLevel.INFO

class Logger {
  private getTimestamp (): string {
    return new Date().toLocaleTimeString('en-GB')
  }

  private formatTag (tag: string): string {
    const tagLength = 20
    return tag.padEnd(tagLength, ' ').substring(0, tagLength)
  }

  public debug (tag: string, message: string, ...args: any[]): void {
    if (CURRENT_LOG_LEVEL <= LogLevel.DEBUG) {
      console.debug(
        `${colors.bg.magenta}${colors.fg.white}${this.formatTag(tag)}${
          colors.reset
        }`,
        `[${this.getTimestamp()}]`,
        message,
        ...args
      )
    }
  }

  public info (tag: string, message: string, ...args: any[]): void {
    if (CURRENT_LOG_LEVEL <= LogLevel.INFO) {
      console.info(
        `${colors.bg.green}${colors.fg.black}${this.formatTag(tag)}${
          colors.reset
        }`,
        `[${this.getTimestamp()}]`,
        message,
        ...args
      )
    }
  }

  public warn (tag: string, message: string, ...args: any[]): void {
    if (CURRENT_LOG_LEVEL <= LogLevel.WARN) {
      console.warn(
        `${colors.bg.yellow}${colors.fg.black}${this.formatTag(tag)}${
          colors.reset
        }`,
        `[${this.getTimestamp()}]`,
        message,
        ...args
      )
    }
  }

  public error (tag: string, message: string, ...args: any[]): void {
    if (CURRENT_LOG_LEVEL <= LogLevel.ERROR) {
      console.error(
        `${colors.bg.red}${colors.fg.white}${colors.bright}${this.formatTag(
          tag
        )}${colors.reset}`,
        `[${this.getTimestamp()}]`,
        message,
        ...args
      )
    }
  }
}

export const logger = new Logger()
