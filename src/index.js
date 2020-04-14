import React, { setGlobal } from 'reactn';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import { createSidSvcs } from './utils/sidServices.js'
import { getCloudUser } from './utils/cloudUser.js'
import * as serviceWorker from './serviceWorker';

import { getLog, setDebugScope, setAllDebugScopes } from './utils/debugScopes.js'
// Get the log setup here... (even if not used yet).
// eslint-disable-next-line
const log = getLog()


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
  threeBoxConnected: false,
  provider: {},
  threeBoxProfile: {},
  box: {},
  space: {},
  org_id: getCloudUser().getUserData() && getCloudUser().getUserData().sid ? getCloudUser().getUserData().sid.org_id : undefined,
  showSegmentNotification: false,
  segmentProcessingDone: false,
  segmentName: "",
  liveChat: true, 
  mainThread: {},
  currentThread: {},
  mainThreadPosts: [],
  currentThreadPosts: [],
  liveChatId: "",
  idWallet: {},
  openChatThreads: [],
  closedChatThreads: [],
  ourMessage: false,
  orgData: {},
  jobs: [],
  notifications: [],
  notificationId: '',
  onboardingComplete: false,
  emailEditor: false,
  templateToUpdate: {},
  emailData: {},
  web2Events: [],
  allFilters: [],
  weekly: [],
  monthly: [],
  loadingMessage: ''
})

ReactDOM.render(<App />, document.getElementById('root'));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();


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
