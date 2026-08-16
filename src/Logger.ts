/* eslint-disable @typescript-eslint/no-extraneous-class */

/*
I didn't feel like installing a logging package, so this is fine for now.
*/
export enum LoggerLevel {
  None,
  Info,
  Trace,
}

export class Logger {
  private constructor() {}
  public static loggerLevel: LoggerLevel = LoggerLevel.Info;

  static warn(prefix: string, data?: string) {
    Logger.implementation(prefix, LoggerLevel.Info, data);
  }

  static info(prefix: string, data?: string) {
    Logger.implementation(prefix, LoggerLevel.Info, data);
  }

  static trace(prefix: string, data?: string) {
    Logger.implementation(prefix, LoggerLevel.Trace, data);
  }

  static implementation(prefix: string, level: LoggerLevel, data?: string) {
    if (Logger.loggerLevel === LoggerLevel.None) {
      return;
    }
    if (level === LoggerLevel.Trace && Logger.loggerLevel !== LoggerLevel.Trace) {
      return;
    }
    const logType = LoggerLevel[level].toString();
    console.log(`${logType} - ${prefix} ${data ?? ''}`);
    console.log('---');
  }
}

export const toggleLog = () => {
  console.log('Cycle logging');
  switch (Logger.loggerLevel) {
    case LoggerLevel.None:
      Logger.loggerLevel = LoggerLevel.Info;
      break;
    case LoggerLevel.Info:
      Logger.loggerLevel = LoggerLevel.Trace;
      break;
    default:
      Logger.loggerLevel = LoggerLevel.None;
  }
  console.log(`Set to ${LoggerLevel[Logger.loggerLevel]}`);
};
