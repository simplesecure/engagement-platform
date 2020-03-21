import { getGlobal, setGlobal } from 'reactn'
import { walletAnalyticsDataTableGet, organizationDataTablePut } from './dynamoConveniences.js'
import { getSidSvcs } from './sidServices.js'
import { getLog } from './debugScopes.js'
import { setLocalStorage } from './misc'
import { putInOrganizationDataTable, getFromOrganizationDataTable } from './awsUtils.js'
import { getCloudUser } from './cloudUser.js'
import uuid from 'uuid/v4'
import socketIOClient from 'socket.io-client';
const socket = socketIOClient(process.env.REACT_APP_WEB_API_HOST)

//  The websocket listener needs to be instantiated outside of the  
//  handle data function or the results will be returned multiple times.
//  See here: https://stackoverflow.com/questions/46819575/node-js-socket-io-returning-multiple-values-for-a-single-event
socket.on('job error', error => {
  console.log("JOB ERROR: ", error)
})

//  The websocket connection returns a message when it's done
//  We are listening for that message and when it is returned
//  we check for the command and execute accordingly

socket.on('job done', async result => {
  console.log(result)
  switch(result.command) {
    case 'update-segments': 
      handleSegmentUpdate(result)
      break
    case 'segment': 
      handleCreateSegmentFunc(result)
      break
    case 'importWallets': 
      handleImport(result)
      break
    default: 
      console.log("No match on command...")
  }
})

const SESSION_FROM_LOCAL = 'sessionData'

const SID_ANALYTICS_APP_ID = '00000000000000000000000000000000'

const QUEUE_IMPORT_WALLETS = true
const QUEUE_CREATE_SEGMENT = true

const log = getLog('dataProcessing')


export async function handleData(dataToProcess) {
  //  For the websocket connect, we need to make sure that the connection
  //  is opened specific to a certain request. Sending a request to the same
  //  connection would clober the previous requests. To solve this
  //  a job_id is created for each request and that is used to create
  //  a unique connection to the websocket server
  const job_id = uuid()

  log.debug("DATA IN HANDLE DATA FUNCTION: ", dataToProcess)
  const { data, type } = dataToProcess;
  setGlobal({ orgData: data.appData })

  if(type === 'fetch-user-count') {
    log.debug(data.app_id);
    try {
      const appData = await walletAnalyticsDataTableGet(data.app_id);
      const users = Object.keys(appData.Item.analytics);
      log.debug(appData);
      return users
    } catch(e) {
      log.debug("USER FETCH ERROR: ", e)
      return []
    }
  } else if(type === 'update-segments') {
    
    //Take the whole org data payload and execute on it
    log.debug("ORG DATA PAYLOAD")
    log.debug(data);
    const thisApp = data.appData && data.appData.Item ? data.appData.Item.apps[data.app_id] : undefined
    log.debug("This APP : ", thisApp)
    const currentSegments = thisApp.currentSegments

    const workerData = {
      app_id: data.app_id,
      currentSegments
    }

    //  Here we are opening the connection for this particular request
    socket.emit('job_id', job_id)

    //  We are sending the update segments request and data to the
    //  connection we created for this job_id
    socket.emit('update segments', JSON.stringify(workerData))

  } else if(type === 'segment') {

    const cmdObj = {
      command: 'segment',
      data: data
    }
    if (QUEUE_CREATE_SEGMENT) {
      cmdObj.data.queue = true
    }

    //  Here we are opening the connection for this particular request
    socket.emit('job_id', job_id)

    //  We are sending the update segments request and data to the
    //  connection we created for this job_id
    socket.emit('segment', JSON.stringify(cmdObj))

  } else if(type === 'email messaging') {
    //Here we will do something similar to segment data except we will send the appropriate message
    //Data should include the following:
    //const { addresses, app_id, template, subject } = data;
    //Commented out because we don't need each individual item separately
    log.info(`handleData ${type} ...`)
    const { template, subject, from } = data
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
    const cmdObj = data
    if (QUEUE_IMPORT_WALLETS) {
      cmdObj.data.queue = true
    }

    //  Here we are opening the connection for this particular request
    socket.emit('job_id', job_id)

    //  We are sending the update segments request and data to the
    //  connection we created for this job_id
    socket.emit('segment', JSON.stringify(cmdObj))

    // commandWorker.postMessage(JSON.stringify(cmdObj))

    // commandWorker.onmessage = async (m) => {
    //   log.debug(`fetchSegmentWorker.onmessage called (context-->import).`, m)

    //   await getCloudUser().fetchOrgDataAndUpdate()
    //   setGlobal({ showSegmentNotification: true, segmentProcessingDone: true })
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

      await organizationDataTablePut(anObject)

    } catch (suppressedError) {
      log.error(`ERROR: problem writing to DB.\n${suppressedError}`)
      return undefined
    }
  }
}

async function handleCreateSegmentFunc(results) {
  const { sessionData, apps, org_id } = getGlobal()
  const { currentSegments } = sessionData
  const ERROR_MSG = "There was a problem creating the segment, please try again. If the problem continues, contact support@simpleid.xyz."
  const segments = currentSegments ? currentSegments : []
  const dataFromApi = results && results.data ? results.data : []

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
      console.log("Error with index, not updating")
    }
  } else {
    segments.push(dataFromApi)
  }

  sessionData.currentSegments = segments

  const thisApp = apps[sessionData.id]
  thisApp.currentSegments = segments
  apps[sessionData.id] = thisApp

  setGlobal({ sessionData, apps })
  // Put the new segment in the analytics data for the user signed in to this
  // id:
  //      Each App (SimpleID Customer) will have an app_id
  //      Each App can have multiple Customer Users (e.g. Cody at Lens and one of his Minions)
  //      A segment will be stored in the DB under the primary key 'app_id' in
  //      the appropriate user_id's segment storage:


  // TODO: probably want to wait on this to finish and throw a status/activity
  //       bar in the app:
  const orgData = await getFromOrganizationDataTable(org_id)

  try {
    const anObject = orgData.Item
    anObject.apps = apps
    anObject[process.env.REACT_APP_ORG_TABLE_PK] = org_id
    await putInOrganizationDataTable(anObject)
    setLocalStorage(SESSION_FROM_LOCAL, JSON.stringify(sessionData))
    setGlobal({ showSegmentNotification: true, segmentProcessingDone: true })
  } catch (suppressedError) {
    setGlobal({ error: ERROR_MSG })
    console.log(`ERROR: problem writing to DB.\n${suppressedError}`)
  }
}

async function handleImport(results) {
  await getCloudUser().fetchOrgDataAndUpdate()
  setGlobal({ showSegmentNotification: true, segmentProcessingDone: true })
}
