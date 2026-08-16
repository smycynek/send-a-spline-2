import { Logger, LoggerLevel } from './Logger';

Logger.loggerLevel = LoggerLevel.Info;

const deployed = import.meta.env.PROD;

export let staticHostname = 'http://localhost:3000/send-a-spline-2/';

if (deployed) {
  staticHostname = 'https://stevenvictor.net/send-a-spline-2/';
}
