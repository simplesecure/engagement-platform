import { setGlobal, getGlobal } from 'reactn'
import { getSidSvcs } from './sidServices.js'
import { getLog } from './debugScopes.js'
import { getWeb2Analytics } from './web2Analytics';
import socketIOClient from "socket.io-client";

const filter = require('./filterOptions.json');

const SIMPLEID_USER_SESSION = 'SID_SVCS';
const SID_JOB_QUEUE = "sid_job_queue";
const MAX_JOBS_TO_STORE = 10;
const BLOCK_ID_EVENT= "block id"
const RT_SEGMENT_UPDATE_EVENT = "real time segment update"
const QUEUE_IMPORT_WALLETS = true;
const QUEUE_CREATE_SEGMENT = true;
const QUEUE_UPDATE_SEGMENT = true;

const SID_EXPERIMENTAL_FEATURES = process.env.REACT_APP_SID_EXPERIMENTAL_FEATURES === 'true' ? true : false;


const log = getLog('cloudUser')
const socket = socketIOClient(process.env.REACT_APP_WEB_API_HOST);



//////////////// Socket Stuff <-- TODO: move / encapsulate //////////////

const registerOrg = async () => {
  // TODO: the notion of a currently selected app may make this problematic.
  const { org_id } = await getGlobal()
  if (org_id) {
    socket.emit('org_id', org_id)
  } else {
    log.warn(`Unable to register organization.`)
  }
}

socket.on('connect', async () => {
  await registerOrg()
})
socket.on('reconnect', async () => {
  await registerOrg()
})

//  The websocket listener needs to be instantiated outside of the
//  handle data function or the results will be returned multiple times.
//  See here: https://stackoverflow.com/questions/46819575/node-js-socket-io-returning-multiple-values-for-a-single-event
socket.on("job error", (error) => {
  log.error("JOB ERROR: ", error);
});

//  The websocket connection returns a message when it's done
//  We are listening for that message and when it is returned
//  we check for the command and execute accordingly

socket.on("job done", async (result) => {
  log.debug(`job done`, result);
  //  Update job queue in local storage and in state
  //  TODO - We need to decide how many jobs to keep stored (initially set at 10)
  const jobs = fetchJobQueue();
  if (jobs) {
    //  First find the job that just finished
    const thisJob = jobs.filter((job) => job.job_id === result.jobId)[0];

    if (thisJob) {
      thisJob.status = "Done";

      setJobQueue(jobs);
    }
  }

  switch (result.command) {
    case "updateSegments":
      handleSegmentUpdate(result.data);
      break;
    case "segment":
      handleCreateSegmentFunc(result);
      break;
    case "importWallets":
      handleImport(result);
      break;
    default:
      log.warn(`No match on command... (${JSON.stringify(result, 0, 2)})`);
  }
});

socket.on("queued job id", async (result) => {
  const { notifications, notificationId } = getGlobal();
  log.info(`Queued Job: id = ${JSON.stringify(result, 0, 2)}`);
  // TODO: Justin / PB / AC:
  //  1. Store the queued job ids passed into here.

  //  Fetch existing job IDs from local storage
  let jobs = fetchJobQueue();

  //  If there are no stored jobs, create a job queue tracking array.
  if (!jobs) {
    jobs = [];
  } else {
    //  Check if the stored jobs array is larger than our max setting and
    //  remove a tracked job.
    if (jobs.length > MAX_JOBS_TO_STORE - 1) {
      const index = jobs.length - 1;
      jobs.splice(index, 1);
    }
  }

  // Now add the job that we just received.
  jobs.unshift({
    command: result.command,
    job_id: result.data.job_id,
    status: "Pending",
  });

  const newNotification = {
    id: result.data.job_id,
    appId: notificationId,
  };

  notifications.unshift(newNotification);
  setGlobal({ notifications });

  setJobQueue(jobs);
});

socket.on("update job id", async (result) => {
  log.info(`Update to job id = ${JSON.stringify(result, 0, 2)}`);
  console.info(`Update to job id = ${JSON.stringify(result, 0, 2)}`);

  //  Update job queue in local storage and in state
  //  TODO - We need to decide how many jobs to keep stored (initially set at 10)
  const jobs = fetchJobQueue();
  if (jobs) {
    //  First find the job that just finished
    const thisJob = jobs.filter((job) => job.job_id === result.jobId)[0];

    if (thisJob) {
      thisJob.status = result.status;

      setJobQueue(jobs);
    }
  }
});

socket.on(BLOCK_ID_EVENT, (aBlockId) => {
  console.info(`------------------------------------------------------------\n` +
              `\tProcessing Ethereum Block ID: ${aBlockId}\n` +
              `------------------------------------------------------------`  )
  setGlobal({ aBlockId });
})

const segmentUpdateQueue = []
let segUpdaterBusy = false

socket.on(RT_SEGMENT_UPDATE_EVENT, async (segmentUpdate) => {
  const method = 'SegmentUpdateListener'
  const startTimeMs = Date.now()
  log.debug(`${method}(${Date.now() - startTimeMs}) ms: starting.`)
  let blockRangeStr = ''
  if (segmentUpdate) {
    const { appId, blockRange } = segmentUpdate
    const { currentAppId } = await getGlobal()
    log.debug(`${method}(${Date.now() - startTimeMs}) ms: got current app id.`)

    if (appId === currentAppId) {
      blockRangeStr = (blockRange.maxBlockId === blockRange.minBlockId) ?
        `Segment updates for Ethereum block id ${blockRange.maxBlockId}.` :
        `Segment updates for Ethereum block ids ${blockRange.maxBlockId} - ${blockRange.minBlockId}.`
    }
  }

  if (blockRangeStr !== '') {
    const msg = `\n` +
                `Real-Time Segment Updates\n` +
                `============================================================\n`+
                `\t${blockRangeStr}\n` +
                `============================================================\n`
    console.info(msg)
    log.debug(`${method}(${Date.now() - startTimeMs}) ms: queuing segment updates.`)
    segmentUpdateQueue.push(segmentUpdate)
    if (segUpdaterBusy) {
      log.debug(`${method}(${Date.now() - startTimeMs}) ms: returning - segment updater busy.`)
      return
    }

    segUpdaterBusy = true


    while (segmentUpdateQueue.length > 0) {
      try {
        log.debug(`${method}(${Date.now() - startTimeMs}) ms: processing new segment update.`)
        const segUpdateData = segmentUpdateQueue.shift()
        // force never save:
        segUpdateData.result.saveToDb = false
        await handleSegmentUpdate(segUpdateData.result.data)
        log.debug(`${method}(${Date.now() - startTimeMs}) ms: finished processing new segment update.`)
      } catch (error) {
        log.debug(`${method}(${Date.now() - startTimeMs}) ms: failed processing new segment update.\n${error}`)
      }
    }
    segUpdaterBusy = false
    log.debug(`${method}(${Date.now() - startTimeMs}) ms: finished processing all queued segment updates.`)
  }
})

//////////////// End Socket Stuff <-- TODO: move / encapsulate /////////



function fetchJobQueue() {
  return localStorage.getItem(SID_JOB_QUEUE)
    ? JSON.parse(localStorage.getItem("sid_job_queue"))
    : undefined;
}

function setJobQueue(jobs) {
  localStorage.setItem(SID_JOB_QUEUE, JSON.stringify(jobs));
  setGlobal({ jobs });
}





//  TODO: think this through better. Right now it issues a client command to the
//        server, waits for a specific response.
//
//        - try-catch, timeout, unique request id tracking
//
export async function runClientOperation(anOperation, anOrgId=undefined, anAppId=undefined, theOperationData={}) {
  const method = 'cloudUser::runClientCommand'

  const cmdObj = {
    command: 'clientOperation',
    data: {
      orgId: anOrgId,
      appId: anAppId,
      operation: anOperation,
      operationData: theOperationData
    }
  }

  log.debug(`${method}: calling server to run ${cmdObj.command}:${cmdObj.data.operation}`)
  socket.emit("client command", cmdObj)

  const result = await new Promise((resolve, reject) => {
    socket.once("client result", (aResult) => {
      log.debug(`${method}: received result of executing ${cmdObj.command}:${cmdObj.data.operation}`)
      resolve(aResult)
    })
  })

  if (!result.data.success) {
    throw new Error(result.data.errors.join('\n'))
  }

  return result.data.obj
}



async function getUsers(data) {
  setGlobal({ orgData: data.appData, notificationId: data.appId }); // TODO: PB is this needed?

  log.debug(data.app_id);
  try {
    const userAddrs = await runClientOperation('getUserWallets', undefined, data.app_id)
    return userAddrs
  } catch (loggedError) {
    log.error(`dataProcessing::getUsers: failed to handle 'fetch-user-count'.\n` +
              `${loggedError}`)
    return [];
  }
}


async function handleEmails(data, url) {
  log.debug(`handleEmails called ...`);

  //Once we have the emails, send them to the email service lambda with the template
  if (url === "TODO-ENV-FILE-AND-AWS") {
    log.warn(`\nDumping data for email service for testing:`);
    log.warn(`\n${JSON.stringify(data, 0, 2)}`);
    log.warn("");
    return;
  }

  try {
    const requestData = {
      method: "post",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    };

    const result = await fetch(url, requestData);
    const jsonData = await result.json();
    return jsonData.data;
  } catch (error) {
    log.error("handleEmails email messaging failed:\n", error);
    return error;
  }
}

async function handleSegmentUpdate(result) {
  const { currentSegments } = result;
  const { sessionData, weekly, monthly } = await getGlobal();
  // console.log({weekly, monthly});
  const weeklySegmentIndex = currentSegments.map(a => a.id).indexOf(`2-${sessionData.id}`)
  const monthlySegmentIndex = currentSegments.map(a => a.id).indexOf(`3-${sessionData.id}`)
  let weeklySegment;
  let monthlySegment;

  if(weeklySegmentIndex > -1) {
    weeklySegment = currentSegments[weeklySegmentIndex];
    weeklySegment.users = weekly ? weekly : [];
    weeklySegment.userCount = weekly ? weekly.length : 0;
  }

  if(monthlySegmentIndex > -1) {
    monthlySegment = currentSegments[monthlySegmentIndex];
    monthlySegment.users = monthly ? monthly : [];
    monthlySegment.userCount = monthly ? monthly.length : 0;
  }

  currentSegments[weeklySegmentIndex] = weeklySegment;
  currentSegments[monthlySegmentIndex] = monthlySegment;

  log.debug(`handleSegmentUpdate:\n` +
             `-----------------------------------------------------------------------\n` +
             `weeklySegment users ${(weeklySegmentIndex > -1) ? weeklySegment.userCount : 'unknown'}\n` +
             `monthlySegment users ${(monthlySegmentIndex > -1) ? monthlySegment.userCount : 'unknown'}\n` +
             `number of segments: ${currentSegments.length}\n`
             )
  const oldSegments = sessionData.currentSegments
  currentSegments.forEach((item, i) => {
    if (item.hasOwnProperty('blockId')) {
      console.info(`Segment ${item.name} updated in block id ${item.blockId}.`)
      item.color = 'white'
    }
    const oldItem = oldSegments[i]
    if (oldItem && item.name === oldItem.name) {
      if (item.userCount > oldItem.userCount) {
        item.color = '#97d154'
      }
      else if (item.userCount < oldItem.userCount) {
        item.color = '#d15a54'
      }
    }
  })
  sessionData.currentSegments = currentSegments;


  setGlobal({
    sessionData,
    initialLoading: false,
    processing: false,
    loading: false,
  });
}

async function handleCreateSegmentFunc(results) {
  const { apps, notifications } = getGlobal();
  let { sessionData } = getGlobal();

  //  First we need to check if the correct project is currently selected in state
  //  To do that, we need to get the project/app_id from the list of notifications

  const matchingNotification = notifications.filter(
    (n) => n.id === results.jobId
  )[0];
  const app_id = matchingNotification.appId;
  let updatedSession;

  if (sessionData.id !== app_id) {
    //  This means we need to switch to the right project to update segments
    updatedSession = apps[app_id];
  } else {
    updatedSession = sessionData;
  }

  const { currentSegments } = updatedSession;
  const ERROR_MSG =
    "There was a problem creating the segment, please try again. If the problem continues, contact support@simpleid.xyz.";
  const segments = currentSegments ? currentSegments : [];
  const dataFromApi = results && results.data ? results.data : undefined;

  if (dataFromApi.update) {
    //Filter by this segment
    let thisSegment = segments.filter((a) => a.id === dataFromApi.id)[0];
    if (thisSegment) {
      thisSegment = dataFromApi;
    }
    const index = await segments
      .map((x) => {
        return x.id;
      })
      .indexOf(dataFromApi.id);
    if (index > -1) {
      segments[index] = thisSegment;
    } else {
      log.warn("Error with index, not updating");
    }
  } else {
    if (dataFromApi) {
      segments.push(dataFromApi);
    } else {
      throw new Error("no data returned from API");
    }
  }

  apps[app_id].currentSegments = segments;

  if (sessionData.id === app_id) {
    const thisApp = apps[sessionData.id];
    thisApp.currentSegments = segments;
    sessionData = thisApp;
  }

  setGlobal({ sessionData, apps });

  try {
    //  Now we find the notifications and ensure we show it properly in the notifications dropdown
    const index = notifications
      .map((notification) => notification.id)
      .indexOf(results.jobId);
    const thisNotification = notifications.filter(
      (notification) => notification.id === results.jobId
    )[0];
    thisNotification["processingDone"] = true;
    notifications[index] = thisNotification;

    setGlobal({
      notifications,
      showSegmentNotification: true,
      segmentProcessingDone: true,
    });
  } catch (suppressedError) {
    setGlobal({ error: ERROR_MSG });
    log.warn(`Suppressed error during DB write\n${suppressedError}`);
  }
}

async function handleImport(results) {
  const { notifications } = getGlobal();
  //  Now we find the notifications and ensure we show it properly in the notifications dropdown
  const index = notifications
    .map((notification) => notification.id)
    .indexOf(results.jobId);
  const thisNotification = notifications.filter(
    (notification) => notification.id === results.jobId
  )[0];
  thisNotification["processingDone"] = true;
  notifications[index] = thisNotification;

  setGlobal({
    notifications,
    showSegmentNotification: true,
    segmentProcessingDone: true,
  });
  await getCloudServices().fetchOrgDataAndUpdate();
  setGlobal({ showSegmentNotification: true, segmentProcessingDone: true });
}



class CloudServices {

  async signOut() {
    await getSidSvcs().signOut()

    // Legacy / deprecated key--we try and clobber the data anyway:
    const SESSION_FROM_LOCAL = 'sessionData'
    for (const key of [SIMPLEID_USER_SESSION, SESSION_FROM_LOCAL]) {
      try { localStorage.removeItem(key) } catch (suppressedError) {}
    }

    window.location.reload();
  }

  async fetchOrgDataAndUpdate(org) {
    await setGlobal({ allFilters: [...filter] });
    let userData
    let sid
    let org_id
    try {
      userData = this.getUserData()
      sid = userData.sid
      org_id = sid.org_id
    } catch(e) {
      log.debug("org id error: ", e)
    }

    //Public Dashboard Check
    if (!org_id) {
      org_id = org
    }

    //regardless of whether there is data in local storage, we need to fetch from db
    if (!org_id) {
      throw new Error(`Organization id is not defined. Please contact support@simpleid.xyz.`)
    }

    let appData = undefined
    try {
      appData = { Item: await runClientOperation('getOrg', org_id) }
    } catch (fatalError) {
      throw new Error(`Unable to fetch organization information for id ${org_id}.\n` +
                      `Please reload the page. If that does not work, contact support@simpleid.xyz.\n` +
                      `${fatalError}`)
    }

    setGlobal({
      plan: (appData.Item && appData.Item.plan) ? appData.Item.plan : process.env.REACT_APP_SID_ALL_FEATURES
    });

    await setGlobal({ org_id });
    if(appData && appData.Item && Object.keys(appData.Item.apps).length > 0) {
      const appKeys = Object.keys(appData.Item.apps);
      const allApps = appData.Item.apps;
      const currentAppId = appKeys[0]
      const data = allApps[appKeys[0]];
      data['id'] = currentAppId

      let importedContracts = undefined
      try {
        importedContracts = await runClientOperation('getImported', undefined, currentAppId)
      } catch (loggedError) {
        log.error(`Unable to fetch imported contracts.\n${loggedError}`)
      }

      await setGlobal({ importedContracts, signedIn: true, currentAppId, projectFound: true, apps: allApps, sessionData: data, loading: false });

      //  Fetch web2 analytics eventNames - we will fetch the actual event results in Segment handling
      let web2AnalyticsCmdObj = {
        command: 'getWeb2Analytics',
            data: {
             appId: currentAppId
          }
      }

      let web2Analytics = await getWeb2Analytics(web2AnalyticsCmdObj);

      setGlobal({ web2Events: web2Analytics.data ? web2Analytics.data : [] });

      //  Fetch weekly users
      web2AnalyticsCmdObj = {
        command: 'getWeb2Analytics',
            data: {
             appId: currentAppId,
             type: "weekly"
          }
      }

      web2Analytics = await getWeb2Analytics(web2AnalyticsCmdObj);
      const weekly = web2Analytics.data

      //  Fetch monthly users
      web2AnalyticsCmdObj = {
        command: 'getWeb2Analytics',
            data: {
             appId: currentAppId,
             type: "monthly"
          }
      }

      web2Analytics = await getWeb2Analytics(web2AnalyticsCmdObj);
      const monthly = web2Analytics.data

      setGlobal({weekly, monthly})
      //Check what pieces of data need to be processed. This looks at the segments, processes the data for the segments to
      //Get the correct results
      //Not waiting on a result here because it would clog the thread. Instead, when the results finish, the updateSegments function
      //Will update state as necessary


      if(data.currentSegments) {
        //  Find the weekly and monthly segments and update them with the correct data

        this.updateSegments(appData);
      } else {
        this.fetchUsersCount(appData)
      }
      setGlobal({ loading: false, projectFound: false })
    }
  }

  async fetchUsersCount(appData) {
    const { org_id, currentAppId, sessionData, weekly, monthly } = await getGlobal()
    const payload = {
      app_id: currentAppId,
      appData,
      org_id
    }

    const updatedData = await getUsers(payload)
    const { currentSegments } = sessionData
    const defaultSegmentId = `1-${currentAppId}`
    const matchingSegment = currentSegments ? currentSegments.filter(a => a.id === defaultSegmentId) : []
    if(matchingSegment.length === 0) {
      const allUsersSegment = {
        id: defaultSegmentId,
        name: 'All Users',
        showOnDashboard: true,
        userCount: updatedData.length,
        users: updatedData
      }

      let segments = []
      if(currentSegments && currentSegments.length > 0) {
        segments = currentSegments
      }
      segments.push(allUsersSegment)

      //  Need to update these segments and post back to DB
      const weeklySegment = {
        id: `2-${currentAppId}`,
        name: 'Weekly Active Users',
        userCount: weekly && weekly.length ? weekly.length : 0,
        users: weekly ? weekly : []
      }

      const monthlySegment = {
        id: `3-${currentAppId}`,
        name: 'Monthly Active Users',
        userCount: monthly && monthly.length ? monthly.length : 0,
        users: monthly ? monthly : []
      }


      segments.push(monthlySegment)
      segments.push(weeklySegment);

      sessionData['currentSegments'] = segments
      await setGlobal({ sessionData })

      setGlobal({ loading: false })
    } else {
      setGlobal({ loading: false })
    }
  }

  // TODO: remove below or use it (not currently used but also broken)
  async segment(data) {
    setGlobal({ orgData: data.appData, notificationId: data.appId }); // TODO: PB is this line needed?
    // Adding the next line b/c w/o it the command to create a segment fails with
    // destructuring.  There's lots of problems with it though:
    //  - it's everywhere here for some reason
    //  - it's in global state so when I set it and another command for another
    //    app_id is queued, it will cause a failure.  For example:
    //      - issue command segment 1, app_id=1
    //      - issue command segment 2, app_id=2
    //      - command segment 1 finishes and tries to run handle create segment.
    //        which might fail b/c the notificationId has been set to 2.
    //  - setting global may cause re-renders
    setGlobal({ notificationId: data.appId });
    const cmdObj = {
      command: "segment",
      data
    };
    if (QUEUE_CREATE_SEGMENT) {
      cmdObj.data.queue = true;
    }
    socket.emit("command", cmdObj);
  }

  async importWallets(data) {
    setGlobal({ orgData: data.appData, notificationId: data.data.appId }); // TODO: Pb is this needed?
    const cmdObj = data;
    if (QUEUE_IMPORT_WALLETS) {
      cmdObj.data.queue = true;
    }

    socket.emit("command", cmdObj);
  }

  async sendEmailMessaging(data) {
    setGlobal({ orgData: data.appData, notificationId: data.appId });

    //Here we will do something similar to segment data except we will send the appropriate message
    //Data should include the following:
    //const { addresses, app_id, template, subject } = data;
    //Commented out because we don't need each individual item separately
    const {
      template_id,
      subject,
      from,
      app_id,
      org_id,
      campaign_id,
      include_imported_emails,
    } = data;
    if (!template_id || !subject || !from) {
      throw new Error(
        "Email messaging expects the template, subject, and from address to be defined."
      );
    }

    let uuidList = undefined;
    try {
      uuidList = await getSidSvcs().getUuidsForWalletAddresses(data);
    } catch (e) {
      log.error("Error fetching list of uuids for wallet addresses: ", e);
    }

    let DRY_RUN = true;
    try {
      // Odd logic designed to ensure this defaults to true unless
      // we explicitly set REACT_APP_EMAILS_DRY_RUN to some variant of
      // the string 'false' in env file.
      DRY_RUN = !(
        process.env.REACT_APP_EMAILS_DRY_RUN.toLowerCase() === "false"
      );
    } catch (suppressedError) {}

    //Now we need to take this list and fetch the emails for the users
    const dataForEmailService = {
      data: {
        appId: app_id,
        uuidList,
        template_id,
        org_id,
        subject,
        from,
        campaign_id,
        imported_emails: !!include_imported_emails,
        dry_run: DRY_RUN,
      },
      command: "sendEmails",
    };

    return await handleEmails(
      dataForEmailService,
      process.env.REACT_APP_EMAIL_SVC_URL
    );
  }

  async getEmailData(data) {
    setGlobal({ orgData: data.appData, notificationId: data.appId });

    const payload = {
      command: "getEmailData",
      data: {
        appId: data.appId,
        params: {
          type: "email data",
          data
        },
      },
    };

    console.log(payload);

    const resp = await fetch(process.env.REACT_APP_WEB_API_HOST, {
      method: "post",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    return await resp.json();
  }

  async updateSegments(appData) {
    const { org_id, currentAppId } = await getGlobal();
    const data = {
      app_id: currentAppId,
      appData,
      org_id
    }

    setGlobal({ orgData: data.appData, notificationId: data.appId }); // TODO: PB is this needed?

    log.debug("ORG DATA PAYLOAD");
    log.debug(data);
    const thisApp =
      data.appData && data.appData.Item
        ? data.appData.Item.apps[data.app_id]
        : undefined;
    const currentSegments = thisApp.currentSegments;
    setGlobal({ notificationId: data.appId });
    const cmdObj = {
      command: "updateSegments",
      data: {
        appId: data.app_id,
        currentSegments,
        queue: QUEUE_UPDATE_SEGMENT,
      },
    };

    socket.emit("command", cmdObj);
  }

  // This returns user info for the SimpleID user
  getUserData() {
    return JSON.parse(localStorage.getItem(SIMPLEID_USER_SESSION));
  }

  async approveSignIn(token) {
    let authenticatedUser = false
    try {
      const thisUserSignUp = await getSidSvcs().answerCustomChallenge(token)
      const { authenticated } = thisUserSignUp
      authenticatedUser = authenticated
      const userData = this.getUserData()
      const sid = userData.sid
      const org_id = sid.org_id
      if(org_id) {
        setGlobal({ org_id })
      } else {
        log.debug("Org id not set, try again")
      }
    } catch (error) {
      // TODO: Cognito gives 3 shots at this
      // throw `ERROR: Failed trying to submit or match the code.\n${error}`
      log.error(`ERROR: Failed trying to submit or match the code:\n`)
      log.error(error)
    }

    log.debug("AUTHENTICATED USER: ", authenticatedUser);
    if (authenticatedUser) {
      return true
    } else {
      return false
    }
  }
}

// Singleton:
//
let cuInstance = undefined
export function getCloudServices() {
  if (!cuInstance) {
    cuInstance = new CloudServices()
  }
  return cuInstance
}
