import React, { setGlobal } from 'reactn';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import { createSidSvcs } from './utils/sidServices.js'
import { getCloudUser } from './utils/cloudUser.js'
import * as serviceWorker from './serviceWorker';

const log = require('loglevel')


const SESSION_FROM_LOCAL = 'sessionData';
const SID_APP_ID = "00000000000000000000000000000000"

createSidSvcs({appId: SID_APP_ID})

const userData = getCloudUser().getUserData()

setGlobal({
  loading: true,
  SESSION_FROM_LOCAL,
  verified: false,
  signedIn: userData ? true : false,
  sessionData: {},
  user_id: "",
  app_id: SID_APP_ID,
  apps: {},
  selectedProject: {},
  showDemo: false,
  processing: false,
  initialLoading: false,
  action: "",
  org_id: getCloudUser().getUserData() ? getCloudUser().getUserData().orgId : ""
})

ReactDOM.render(<App />, document.getElementById('root'));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();



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

/**
 *  getDebugScopes:
 *
 *  Fetches known debug scopes from local storage to forward to the widget
 *  iFrame for dynamic debug capability from an App Console.
 *
 *  @returns a map of the scope keys to their string values.
 */
function getIFrameDebugScopes() {
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

function setDebugScope(scopeKey, scopeLevel) {
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

function setAllDebugScopes(scopeLevel='DEBUG') {
  if (!ALLOWED_LEVELS.includes(scopeLevel)) {
    console.log(`Scope level ${scopeLevel} is not supported.  Supported levels are ${JSON.stringify(ALLOWED_LEVELS, 0, 2)}.`)
    return
  }

  const debugScopes = getIFrameDebugScopes()
  for (const scopeKey in debugScopes) {
    localStorage.setItem(scopeKey, scopeLevel)
  }

  return
}


// Workaround for queck and easy debug from browser console
//
// TODO:
//       - Analyze as exposure of security problem.
//
if (window) {
  window.sid = {
    debugScope: function(aScope, aLevel=undefined) {
      setDebugScope(aScope, aLevel)
    },
    debugAll: function() {
      setAllDebugScopes();
    },
    debugOff: function() {
      setAllDebugScopes('INFO');
    }
  }
}
