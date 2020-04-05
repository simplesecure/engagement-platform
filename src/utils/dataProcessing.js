import { getGlobal, setGlobal } from 'reactn'
import { getSidSvcs } from './sidServices.js'
import { getLog } from './debugScopes.js'
import { setLocalStorage } from './misc'
import * as dc from './dynamoConveniences.js'
import { getCloudUser } from './cloudUser.js'
import socketIOClient from 'socket.io-client';

const SID_JOB_QUEUE = 'sid_job_queue'
const MAX_JOBS_TO_STORE = 10

const log = getLog('dataProcessing')
const socket = socketIOClient(process.env.REACT_APP_WEB_API_HOST)

//  The websocket listener needs to be instantiated outside of the
//  handle data function or the results will be returned multiple times.
//  See here: https://stackoverflow.com/questions/46819575/node-js-socket-io-returning-multiple-values-for-a-single-event
socket.on('job error', error => {
  log.error("JOB ERROR: ", error)
})

//  The websocket connection returns a message when it's done
//  We are listening for that message and when it is returned
//  we check for the command and execute accordingly

socket.on('job done', async result => {
  log.debug(`job done`, result)
  //  Update job queue in local storage and in state
  //  TODO - We need to decide how many jobs to keep stored (initially set at 10)
  const jobs = fetchJobQueue()
  if(jobs) {
    //  First find the job that just finished
    const thisJob = jobs.filter(job => job.job_id === result.jobId)[0]

    if(thisJob) {
      thisJob.status = "Done"

      setJobQueue(jobs)
    }
  }


  switch(result.command) {
    case 'updateSegments':
      handleSegmentUpdate(result.data)
      break
    case 'segment':
      handleCreateSegmentFunc(result)
      break
    case 'importWallets':
      handleImport(result)
      break
    default:
      log.warn(`No match on command... (${JSON.stringify(result, 0, 2)})`)
  }
})

socket.on('queued job id', async (result) => {
  const { notifications, notificationId } = getGlobal();
  log.info(`Queued Job: id = ${JSON.stringify(result, 0, 2)}`)
  // TODO: Justin / PB / AC:
  //  1. Store the queued job ids passed into here.

  //  Fetch existing job IDs from local storage
  let jobs = fetchJobQueue()

  //  If there are no stored jobs, create a job queue tracking array.
  if(!jobs) {
    jobs = []
  } else {
    //  Check if the stored jobs array is larger than our max setting and
    //  remove a tracked job.
    if(jobs.length > MAX_JOBS_TO_STORE-1) {
      const index = jobs.length - 1
      jobs.splice(index, 1);
    }
  }

  // Now add the job that we just received.
  jobs.unshift({
    command: result.command,
    job_id: result.data.job_id,
    status: "Pending"
  })

  const newNotification = {
    id: result.data.job_id,
    appId: notificationId
  }

  notifications.unshift(newNotification);
  setGlobal({ notifications });

  setJobQueue(jobs)
})

socket.on('update job id', async (result) => {
  log.info(`Update to job id = ${JSON.stringify(result, 0, 2)}`)

  //  Update job queue in local storage and in state
  //  TODO - We need to decide how many jobs to keep stored (initially set at 10)
  const jobs = fetchJobQueue()
  if(jobs) {
    //  First find the job that just finished
    const thisJob = jobs.filter(job => job.job_id === result.jobId)[0]

    if(thisJob) {
      thisJob.status = result.status

      setJobQueue(jobs)
    }
  }

  // TODO: Justin / PB / AC
  // 0. Examine the data here and update the UI / UX & possibly stored data
  //    with the update (i.e. % done, error etc.)
})

const SESSION_FROM_LOCAL = 'sessionData'

const SID_ANALYTICS_APP_ID = '00000000000000000000000000000000'

const QUEUE_IMPORT_WALLETS = true
const QUEUE_CREATE_SEGMENT = true
const QUEUE_UPDATE_SEGMENT = true

function fetchJobQueue() {
  return localStorage.getItem(SID_JOB_QUEUE) ? JSON.parse(localStorage.getItem('sid_job_queue')) : undefined
}

function setJobQueue(jobs) {
  localStorage.setItem(SID_JOB_QUEUE, JSON.stringify(jobs))
  setGlobal({ jobs })
}


export async function handleData(dataToProcess) {
  log.debug("DATA IN HANDLE DATA FUNCTION: ", dataToProcess)
  const { data, type } = dataToProcess;
  setGlobal({ orgData: data.appData, notificationId: data.app_id })

  if(type === 'fetch-user-count') {
    log.debug(data.app_id);
    try {
      const appData = await dc.walletAnalyticsDataTableGet(data.app_id);
      const users = Object.keys(appData.Item.analytics);
      log.debug(appData);
      return users
    } catch(e) {
      log.debug("USER FETCH ERROR: ", e)
      return []
    }
  } else if(type === 'updateSegments') {
    //Take the whole org data payload and execute on it
    log.debug("ORG DATA PAYLOAD")
    log.debug(data);
    const thisApp = data.appData && data.appData.Item ? data.appData.Item.apps[data.app_id] : undefined
    const currentSegments = thisApp.currentSegments
    setGlobal({ notificationId: data.app_id });
    const cmdObj = {
      command: 'updateSegments',
      data: {
        appId: data.app_id,
        currentSegments,
        queue: QUEUE_UPDATE_SEGMENT
      }
    }

    socket.emit('command', cmdObj)

  } else if(type === 'segment') {

    const cmdObj = {
      command: 'segment',
      data: data
    }
    if (QUEUE_CREATE_SEGMENT) {
      cmdObj.data.queue = true
    }
    socket.emit('command', cmdObj)

  } else if(type === 'email messaging') {
    //Here we will do something similar to segment data except we will send the appropriate message
    //Data should include the following:
    //const { addresses, app_id, template, subject } = data;
    //Commented out because we don't need each individual item separately
    log.info(`handleData ${type} ...`)
    const { template, subject, from, app_id, org_id } = data
    if (!template || !subject || !from) {
      throw new Error('Email messaging expects the template, subject, and from address to be defined.')
    }

    let uuidList = undefined
    try {
      uuidList = await getSidSvcs().getUuidsForWalletAddresses(data)
    } catch(e) {
      log.error("Error fetching list of uuids for wallet addresses: ", e)
    }

    //Now we need to take this list and fetch the emails for the users
    const dataForEmailService = {
      data: {
        uuidList,
        template,
        app_id, 
        org_id,
        subject,
        from,
        appId: SID_ANALYTICS_APP_ID
      },
      command: 'sendEmails'
    }

    return await handleEmails(dataForEmailService, process.env.REACT_APP_EMAIL_SVC_URL)
  } else if(type === 'create-project') {
    const { appObject, orgId } = data;
    const createProject = await getSidSvcs().createAppId(orgId, appObject)
    log.debug(createProject)
    return createProject
  } else if (type === 'import') {
    setGlobal({ notificationId: data.app_id });
    const cmdObj = data
    if (QUEUE_IMPORT_WALLETS) {
      cmdObj.data.queue = true
    }

    //  We are sending the updateSegments request and data to the
    //  connection we created for this job_id
    socket.emit('command', cmdObj)
  }
}

async function handleEmails(data, url) {
  log.debug(`handleEmails called ...`)

  //Once we have the emails, send them to the email service lambda with the template
  if (url === 'TODO-ENV-FILE-AND-AWS') {
    log.warn(`\nDumping data for email service for testing:`)
    log.warn(`\n${JSON.stringify(data, 0, 2)}`)
    log.warn('')
    return
  }

  try {
    const requestData = {
      method: 'post',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    }

    const result = await fetch(url, requestData)
    const jsonData = await result.json();
    return jsonData.data
  } catch (error) {
    log.error('handleData email messaging failed:\n', error)
    return error
  }
}

async function handleSegmentUpdate(result) {
  const { currentSegments, saveToDb } = result
  const { sessionData, orgData, org_id } = await getGlobal()
  const segs = currentSegments
  sessionData.currentSegments = segs
  setGlobal({ sessionData, initialLoading: false, processing: false, loading: false })
  setLocalStorage(SESSION_FROM_LOCAL, JSON.stringify(sessionData));

  if(saveToDb === true) {
    try {

      const anObject = orgData.Item

      let apps = anObject.apps
      let thisApp = apps[sessionData.id]
      let segments = currentSegments
      thisApp.currentSegments = segments
      apps[sessionData.id] = thisApp

      anObject.apps = apps;

      anObject[process.env.REACT_APP_ORG_TABLE_PK] = org_id

      await dc.organizationDataTablePut(anObject)

    } catch (suppressedError) {
      log.error(`ERROR: problem writing to DB.\n${suppressedError}`)
      return undefined
    }
  }
}

async function handleCreateSegmentFunc(results) {
  const { apps, org_id, notifications } = getGlobal()
  let { sessionData } = getGlobal();

  //  First we need to check if the correct project is currently selected in state
  //  To do that, we need to get the project/app_id from the list of notifications

  const matchingNotification = notifications.filter(n => n.id === results.jobId)[0];
  const app_id = matchingNotification.appId;
  let updatedSession;

  if(sessionData.id !== app_id) {
    //  This means we need to switch to the right project to update segments
    updatedSession = apps[app_id];
  } else {
    updatedSession = sessionData;
  }

  const { currentSegments } = updatedSession
  const ERROR_MSG = "There was a problem creating the segment, please try again. If the problem continues, contact support@simpleid.xyz."
  const segments = currentSegments ? currentSegments : []
  const dataFromApi = results && results.data ? results.data : undefined

  if (dataFromApi.update) {
    //Filter by this segment
    let thisSegment = segments.filter(a => a.id === dataFromApi.id)[0]
    if(thisSegment) {
      thisSegment = dataFromApi
    }
    const index = await segments.map((x) => {return x.id }).indexOf(dataFromApi.id)
    if(index > -1) {
      segments[index] = thisSegment
    } else {
      log.warn("Error with index, not updating")
    }
  } else {
    if(dataFromApi) {
      segments.push(dataFromApi)
    } else {
      throw new Error('no data returned from API')
    }

  }

  apps[app_id].currentSegments = segments;

  if(sessionData.id === app_id) {
    const thisApp = apps[sessionData.id]
    thisApp.currentSegments = segments
    sessionData = thisApp;
  }





  setGlobal({ sessionData, apps })
  // Put the new segment in the analytics data for the user signed in to this
  // id:
  //      Each App (SimpleID Customer) will have an app_id
  //      Each App can have multiple Customer Users (e.g. Cody at Lens and one of his Minions)
  //      A segment will be stored in the DB under the primary key 'app_id' in
  //      the appropriate user_id's segment storage:


  // TODO: probably want to wait on this to finish and throw a status/activity
  //       bar in the app:
  const orgData = await dc.organizationDataTableGet(org_id)

  try {
    const anObject = orgData.Item
    anObject.apps = apps
    anObject[process.env.REACT_APP_ORG_TABLE_PK] = org_id
    await dc.organizationDataTablePut(anObject)
    setLocalStorage(SESSION_FROM_LOCAL, JSON.stringify(sessionData))

    //  Now we find the notifications and ensure we show it properly in the notifications dropdown
    const index = notifications.map(notification => notification.id).indexOf(results.jobId)
    const thisNotification = notifications.filter((notification) => notification.id === results.jobId)[0];
    thisNotification['processingDone'] = true;
    notifications[index] = thisNotification;

    setGlobal({ notifications, showSegmentNotification: true, segmentProcessingDone: true })
  } catch (suppressedError) {
    setGlobal({ error: ERROR_MSG })
    log.warn(`Suppressed error during DB write\n${suppressedError}`)
  }
}

async function handleImport(results) {
  console.log("IMPORT RESULTS")
  await getCloudUser().fetchOrgDataAndUpdate()
  setGlobal({ showSegmentNotification: true, segmentProcessingDone: true })
}
