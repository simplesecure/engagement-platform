import * as db from './dynamoBasics.js'

if (!process.env.REACT_APP_JOB_TABLE) {
  console.log(`ERROR ERROR fetchSegmentWorker -- JOB TABLE is not defined.`)
  throw new Error(`fetchSegmentWorker -- JOB TABLE is not defined.`)
}

const DEBUG_OUTPUT_LOGGING=true

class Log {
  constructor() {
    this.debugOutput = DEBUG_OUTPUT_LOGGING
    this.prefix = '(fetchSegmentWorker)'
  }

  debug(...args) {
    if (this.debugOutput) {
      console.log(`DEBUG ${this.prefix}: `, ...args)
    }
  }

  info(...args) {
    console.log(`INFO ${this.prefix}: `, ...args)
  }

  warn(...args) {
    console.log(`WARN ${this.prefix}: `, ...args)
  }

  error(...args) {
    console.log(`ERROR ${this.prefix}: `, ...args)
  }
}
const log = new Log()

const MAX_ERRORS = 3
const MS_PER_SEC = 1000
const SEC_PER_MIN = 60
const MIN_PER_HR = 60
const TIME_OUT_SEC = 2 * MIN_PER_HR * SEC_PER_MIN

function getPollIntervalSec(secondsElapsed) {
  if (secondsElapsed <= 1 * SEC_PER_MIN) {
    return 5
  } else if (secondsElapsed <= 3 * SEC_PER_MIN) {
    return 10
  } else if (secondsElapsed <= 6 * SEC_PER_MIN) {
    return 20
  } else if (secondsElapsed <= 12 * SEC_PER_MIN) {
    return 30
  }

  return 60
}

export default function worker(self) {
  self.onmessage = async (e) => { // eslint-disable-line no-restricted-globals
    const method = 'onmessage'

    const cmdObj = JSON.parse(e.data)
    log.info(`${method} called for command ${cmdObj.command}`)
    let serverResults = await self.__issueWebApiCmd(cmdObj) // eslint-disable-line no-restricted-globals
    log.debug(`${method} SERVER RESULTS: `, serverResults)

    // Check to see if this is a queued command and if the web worker should poll
    // job database for a result:
    let results = serverResults
    if (serverResults &&
        serverResults.hasOwnProperty('data') &&
        serverResults.data.hasOwnProperty('job_id')) {
      const jobId = serverResults.data.job_id
      let seconds = 0
      let errors = []
      while ( (seconds < TIME_OUT_SEC) && (errors.length < MAX_ERRORS) ) {
        let intervalSec = getPollIntervalSec(seconds)
        let dbResults = undefined
        try {
          log.debug(`${method} polling for ${cmdObj.command} command results (job: ${jobId}) every ${intervalSec}s (${seconds}s elapsed.)`)
          dbResults = await db.tableGet(
            process.env.REACT_APP_JOB_TABLE,
            process.env.REACT_APP_JOB_TABLE_PK,
            jobId)

        } catch (error) {
          log.warn(`${method} worker polling job ${jobId} failed.\n${error}`)
          errors.push(error)
        }

        if ( dbResults &&
             dbResults.Item &&
             (dbResults.Item.status === 'complete' || dbResults.Item.status === 'failed') ) {
          log.debug(`${method} polling discovered job ${jobId} ${dbResults.Item.status} after ${seconds}s.`)
          results = dbResults.Item.result
          break
        } else {
          // ty: https://stackoverflow.com/questions/951021/what-is-the-javascript-version-of-sleep
          const intervalMs = intervalSec * MS_PER_SEC
          await new Promise(r => setTimeout(r, intervalMs));
          seconds += intervalSec
        }
      }

      if (seconds >= TIME_OUT_SEC) {
        results = {
          error: `${cmdObj.command} failed. Exceeded maximum time to get data for job ${jobId}.`
        }
        log.error(`${method} failed.\n${results.error}`)
      } else if (errors.length >= MAX_ERRORS) {
        results = {
          error: `${cmdObj.command} failed. Exceeded maximum allowable errors to get data for job ${jobId}. Last error:\n${errors.pop()}`
        }
        log.error(`${method} failed.\n${results.error}`)
      }
    }

    self.postMessage(JSON.stringify(results)) // eslint-disable-line no-restricted-globals
  }


  self.__issueWebApiCmd = async (cmdObj) => { // eslint-disable-line no-restricted-globals
    const options = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cmdObj)
    }

    // TODO: consider timeout / abortable fetch:
    //  - https://developers.google.com/web/updates/2017/09/abortable-fetch
    //  - https://developer.mozilla.org/en-US/docs/Web/API/AbortController
    //
    try {
      const response = await fetch(process.env.REACT_APP_WEB_API_HOST, options)
      return await response.json()
      // result = await retry(async bail => {
      //   // If anything throws in this block, we retry ...
      //   const response = await fetch(process.env.REACT_APP_WEB_API_HOST, options)

      //   // Some conditions don't make sense to retry, so exit ...
      //   if (response.status >= 400 && response.status <= 499) {
      //     bail(`__issueWebApiCmd failed with client error ${response.status} (${response.statusText})`)
      //     return
      //   }
      //   return await response.json()
      // }, {
      //   retries: 0,     // For now, let's not retry (long jobs & related complications)
      //   minTimeout: 500,
      //   maxTimeout: 5000,
      //   onRetry: (error) => {log.warn(`Fetch attempt failed with error below. Retrying.\n${error}`)}
      // })
    } catch (error) {
      //log.debug(`in __issueWebApiCmd try/catch, error =\n${error}`)
      //result.error = error
      log.error(error)
    }

    //return result
  }
}
