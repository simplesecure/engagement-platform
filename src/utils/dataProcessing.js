import { getGlobal, setGlobal } from 'reactn'
import { walletAnalyticsDataTableGet, organizationDataTablePut } from './dynamoConveniences.js'
import { getSidSvcs } from './sidServices.js'
import { getLog } from './debugScopes.js'
import { setLocalStorage } from './misc'
import { putInOrganizationDataTable, getFromOrganizationDataTable } from './awsUtils.js'
import work from 'webworkify-webpack';
import { getCloudUser } from './cloudUser.js'
// import updateWorker from './updateSegmentWorker'
// import fetchWorker from './fetchSegmentWorker'
// import WebWorker from './workerSetup'

const SESSION_FROM_LOCAL = 'sessionData'

const SID_ANALYTICS_APP_ID = '00000000000000000000000000000000'

const log = getLog('dataProcessing')

// const updateSegmentWorker = new WebWorker(updateWorker)
// const fetchSegmentWorker = new WebWorker(fetchWorker)
const fetchSegmentWorker = work(require.resolve('./fetchSegmentWorker.js'))
const updateSegmentWorker = work(require.resolve('./updateSegmentWorker.js'))

/**
 *  __issueWebApiCmd:
 *
 *  Note: common to / copied from web API helpers.
 *
 *  cmdObj format is:
 *  {
 *    command: <string>,
 *    data: { <arguments for command as properties> }
 *  }
 *
 *  @returns:  a result object containing an error property that is undefined if
 *             successful with any processed data in a data property. On failure
 *             a message is returned in the error property and data remains
 *             undefined.
 */


export async function handleData(dataToProcess) {
  const { sessionData } = getGlobal()
  log.debug("DATA IN HANDLE DATA FUNCTION: ", dataToProcess)
  const { data, type } = dataToProcess;

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

    //  Send the reques to the web worker
    updateSegmentWorker.postMessage(JSON.stringify(workerData))

    //  When the worker responds, execute
    updateSegmentWorker.onmessage = async (m) => {
      const results = JSON.parse(m.data)

      const { saveToDb, updatedSegments } = results

      log.debug("UPDATED SEGMENTS: ", updatedSegments)

      const segs = updatedSegments
      sessionData.currentSegments = segs
      setGlobal({ sessionData, initialLoading: false, processing: false, loading: false })
      setLocalStorage(SESSION_FROM_LOCAL, JSON.stringify(sessionData));
      if(saveToDb === true) {
        const orgData = data.appData
        try {
          const anObject = orgData.Item
          let apps = anObject.apps
          let thisApp = apps[data.app_id]
          let segments = updatedSegments
          thisApp.currentSegments = segments
          apps[data.app_id] = thisApp

          anObject.apps = apps;

          anObject[process.env.REACT_APP_ORG_TABLE_PK] = data.org_id

          await organizationDataTablePut(anObject)
          return updatedSegments
        } catch (suppressedError) {
          log.error(`ERROR: problem writing to DB.\n${suppressedError}`)
          return undefined
        }
      } else {
        return updatedSegments
      }
    }
  } else if(type === 'segment') {
    const { sessionData, apps, org_id } = getGlobal()
    const { currentSegments } = sessionData
    const segments = currentSegments ? currentSegments : []
    const ERROR_MSG = "There was a problem creating the segment, please try again. If the problem continues, contact support@simpleid.xyz."

    const cmdObj = {
      command: 'segment',
      data: data
    }
    //  Send the reques to the web worker
    fetchSegmentWorker.postMessage(JSON.stringify(cmdObj))

    fetchSegmentWorker.onmessage = async (m) => {
      const results = JSON.parse(m.data)

      const dataFromApi = results && results.data ? results.data : []

      data.userCount = dataFromApi.length
      data.users = dataFromApi
      if (data.update) {
        //Filter by this segment
        let thisSegment = segments.filter(a => a.id === data.id)[0]
        if(thisSegment) {
          thisSegment = data
        }
        const index = await segments.map((x) => {return x.id }).indexOf(data.id)
        if(index > -1) {
          segments[index] = thisSegment
        } else {
          console.log("Error with index, not updating")
        }
      } else {
        segments.push(data)
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


    // const results = await __issueWebApiCmd(cmdObj)
    // return results
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
    // Re-using the fetchSegmentWorker (b/c it's really just a command web worker
    // w/ nothing special for segments).
    // TODO: rename / refactor it to something sensible
    //
    const commandWorker = fetchSegmentWorker
    const cmdObj = data

    commandWorker.postMessage(JSON.stringify(cmdObj))

    commandWorker.onmessage = async (m) => {
      log.debug('Finished processing command:')
      log.debug(JSON.stringify(cmdObj, 0, 2))
      await getCloudUser().fetchOrgDataAndUpdate()
      setGlobal({ showSegmentNotification: true, segmentProcessingDone: true })
    }
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
