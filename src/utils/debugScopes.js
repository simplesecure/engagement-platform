// See this site for usage and logger configuration:
//   - https://github.com/pimterry/loglevel
//
const log = require('loglevel')
// The prefix library calls setLevel with no option regarding persistence to
// local storage.
const prefix = require('loglevel-plugin-prefix');

// TODO: clean this up after we get it working again (refactor to correct spot etc)

// TODO: Figure out a good way to refactor the consts below and method to a common
//       file shared with the widget (which uses these from the file debugScopes.js)
//
const ROOT_KEY = 'loglevel'
const ALLOWED_SCOPES = [ ROOT_KEY,
                        `${ROOT_KEY}:cloudUser`,
                        `${ROOT_KEY}:dataProcessing`,
                        `${ROOT_KEY}:sidServices` ]
const ALLOWED_LEVELS = [ 'TRACE', 'DEBUG', 'INFO', 'WARN', 'ERROR' ]
const DEFAULT_LOG_LEVEL="INFO"


function configureLogPrefix(aLog) {
  prefix.apply(aLog, {
    format(level, name, timestamp) {
      const moduleName = (name !== 'root') ?
        ` (${name})` : ''
      return `${level}${moduleName}:`;
    },
  })
}

function getStorageKeyName(logName=undefined) {
  if (logName) {
    return `${ROOT_KEY}:${logName}`
  } else {
    return ROOT_KEY
  }
}

// The prefix lib defautls to WARN--we want info, hence the local storage
// fetcha and restore here...
function _setupMainLog() {
  let storageKey = undefined
  let storedScope = undefined

  try {
    storageKey = getStorageKeyName()
    storedScope = localStorage.getItem(storageKey)
  } catch (suppressedError) {
    console.log(`WARNING - failed to read logger state from local storage.\n${suppressedError}`)
  }

  prefix.reg(log)
  configureLogPrefix(log)

  try {
    if (storedScope) {
      localStorage.setItem(storageKey, storedScope)
    } else {
      localStorage.setItem(storageKey, DEFAULT_LOG_LEVEL)
    }
  } catch (suppressedError) {
    console.log(`WARNING - failed to restore logger state to local storage.\n${suppressedError}`)
  }
}
_setupMainLog()

/**
 *  getLog:
 *
 *    Returns a logger configured with our prefixes etc.
 *
 *    The prefix lib defautls to WARN--we want info, hence the local storage
 *    fetcha and restore here...
 *
 *  TODO:
 *    - Do we need to track calls to this to prevent duplicate reg/apply calls?
 *
 */
export function getLog(logName=undefined) {
  let storageKey = undefined
  let storedScope = undefined

  try {
    storageKey = getStorageKeyName(logName)
    storedScope = localStorage.getItem(storageKey)
  } catch (suppressedError) {
    console.log(`WARNING - failed to read logger state from local storage.\n${suppressedError}`)
  }

  let theLog = log
  if (logName) {
    theLog = log.getLogger(logName)
    configureLogPrefix(theLog)
  }

  try {
    if (storedScope) {
      localStorage.setItem(storageKey, storedScope)
    } else {
      localStorage.setItem(storageKey, DEFAULT_LOG_LEVEL)
    }
  } catch (suppressedError) {
    console.log(`WARNING - failed to restore logger state to local storage.\n${suppressedError}`)
  }

  return theLog
}

/**
 *  configureDebugScopes:
 *
 *  Sets the debug log levels on all modules to the default values or any
 *  confirming override values specified in the parent component using the
 *  SimpleID SDK.
 *
 * TODO:
 *      - refactor to it's own file and the consts too
 */
export function configureDebugScopes(debugScopes={}) {
  for (const scopeKey of ALLOWED_SCOPES) {
    // Get the module name from the scopeKey:
    const moduleName = scopeKey.replace(`${ROOT_KEY}:`, '')

    let scopeValue = DEFAULT_LOG_LEVEL
    try {
      const overriddenScopeValue = debugScopes[scopeKey]
      if (ALLOWED_LEVELS.includes(overriddenScopeValue)) {
        scopeValue = overriddenScopeValue
      }
    } catch (suppressedError) {
      log.debug(`Suppressed error getting override iFrame log level for ${moduleName}.\n${suppressedError}`)
    }

    try {
      if (moduleName === ROOT_KEY) {
        log.setLevel(scopeValue)
      } else {
        log.getLogger(moduleName).setLevel(scopeValue)
      }
    } catch (suppressedError) {
      log.debug(`Suppressed error setting the iframe log level for ${moduleName} to ${scopeValue}.\n${suppressedError}`)
    }
  }
}

/**
 *  getDebugScopes:
 *
 *  Fetches known debug scopes from local storage to forward to the widget
 *  iFrame for dynamic debug capability from an App Console.
 *
 *  @returns a map of the scope keys to their string values.
 */
export function getDebugScopes() {
  const debugScopes = {}
  for (const key of ALLOWED_SCOPES) {
    debugScopes[key] = DEFAULT_LOG_LEVEL
  }

  for (const scopeKey in debugScopes) {
    try {
      const scope = localStorage.getItem(scopeKey)
      if (ALLOWED_LEVELS.includes(scope)) {
        debugScopes[scopeKey] = scope
      }
    } catch (suppressedError) {
      log.debug(`Suppressed error fetching ${scopeKey} from local storage. Setting ${scopeKey} to default value, ${DEFAULT_LOG_LEVEL}.\n${suppressedError}`)
    }
  }

  return debugScopes
}

export function setDebugScope(scopeKey, scopeLevel) {
  if (scopeKey && !scopeKey.startsWith(ROOT_KEY)) {
    scopeKey = `${ROOT_KEY}:${scopeKey}`
  }

  if (!scopeLevel) {
    scopeLevel = 'DEBUG'
  }

  if (ALLOWED_SCOPES.includes(scopeKey) && ALLOWED_LEVELS.includes(scopeLevel)) {
    localStorage.setItem(scopeKey, scopeLevel)
  }
}

export function setAllDebugScopes(scopeLevel='DEBUG') {
  if (!ALLOWED_LEVELS.includes(scopeLevel)) {
    console.log(`Scope level ${scopeLevel} is not supported.  Supported levels are ${JSON.stringify(ALLOWED_LEVELS, 0, 2)}.`)
    return
  }

  const debugScopes = getDebugScopes()
  for (const scopeKey in debugScopes) {
    localStorage.setItem(scopeKey, scopeLevel)
  }

  return
}
