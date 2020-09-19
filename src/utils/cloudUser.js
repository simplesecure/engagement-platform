import { setGlobal, getGlobal } from 'reactn'
import { getSidSvcs } from './sidServices.js'
import { getLog } from './debugScopes.js'
import { getWeb2Analytics } from './web2Analytics';
import socketIOClient from "socket.io-client";
import { toast } from "react-toastify";

const socket = socketIOClient(process.env.REACT_APP_WEB_API_HOST);
const log = getLog('cloudUser')

const filter = require('./filterOptions.json');

const SIMPLEID_USER_SESSION = 'SID_SVCS';
const BLOCK_ID_EVENT= "block id"
const RT_SEGMENT_UPDATE_EVENT = "real time segment update"



//////////////// Socket Stuff <-- TODO: move / encapsulate //////////////

const registerOrg = async (anOrgId=undefined) => {
  if (anOrgId) {
    socket.emit('org_id', anOrgId)
    return
  }

  const { org_id } = await getGlobal()
  if (org_id) {
    socket.emit('org_id', org_id)
  } else {
    // TODO: Prabhaav, set connected state to instruct the user to sign-out and sign back in
    //       (Why would org id not be defined?  It comes from cognito gated dynamo for user on sign in.)
    log.warn(`Unable to register organization id with server.`)
  }
}

socket.on('connect', async () => {
  await registerOrg()
  await setGlobal({ connected: 'connect' })
})
socket.on('reconnect', async () => {
  await registerOrg()
  await setGlobal({ connected: 'reconnect' })
})
socket.on('disconnect', async () => {
  await setGlobal({ connected: 'disconnect' })
})
socket.on('reconnecting', async () => {
  await setGlobal({ connected: 'reconnecting' })
})

const CLIENT_COMMAND_STATUS_EVENT = 'client command status'
socket.on(CLIENT_COMMAND_STATUS_EVENT, async (anOrgStatusObj) => {
  log.debug(`Received ${CLIENT_COMMAND_STATUS_EVENT} event:\n` +
            `${JSON.stringify(anOrgStatusObj, null, 2)}\n`)
  setGlobal({ anOrgStatusObj });
})

const CLIENT_COMMAND_SEGMENT_EVENT = 'client command segment'
socket.on(CLIENT_COMMAND_SEGMENT_EVENT, async (aSegmentObj) => {
  log.debug(`Received ${CLIENT_COMMAND_SEGMENT_EVENT} event for ` +
            `segment ${(aSegmentObj) ? aSegmentObj.name : 'unknown'}`)

  await handleSegmentInitFinished(aSegmentObj)
})

const CLIENT_COMMAND_IMPORT_EVENT = 'client command import'
socket.on(CLIENT_COMMAND_IMPORT_EVENT, async (anImportResultObj) => {
  log.debug(`Received ${CLIENT_COMMAND_IMPORT_EVENT} event:\n` +
            `${(anImportResultObj) ? JSON.stringify(anImportResultObj, null, 2) : 'undefined'}`)

  await getCloudServices().fetchOrgDataAndUpdate();
  setGlobal({ showSegmentNotification: true, segmentProcessingDone: true });
})

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
      if (blockRange.maxBlockId === blockRange.minBlockId) {
        blockRangeStr = (blockRange.maxBlockId !== 0) ?
          `Segment updates for Ethereum block id ${blockRange.maxBlockId}.` :
          `Segment updates from API event.`
      } else {
        blockRangeStr = `Segment updates up to Ethereum block id ${blockRange.maxBlockId}.`
      }
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
        await handleSegmentsUpdate(segUpdateData.result.data)
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
  // setGlobal({ orgData: data.appData }); // TODO: PB is this needed?
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

async function handleSegmentsUpdate(result) {
  log.debug('cloudUser::handleSegmentsUpdate')
  const { sessionData } = await getGlobal();
  const oldSegments = sessionData.currentSegments
  const newSegments = result.currentSegments

  // If the new segments do not contain all users segment, merge it in below
  // before updating the UX (otherwise they go away).  (These segments seem to get created in fetchUsersCount)
  //
  const appId = sessionData.id
  const allId = `1-${appId}`

  for (const segId of [allId]) {
    const newSeg = newSegments.find(seg => seg.id === segId)
    if (!newSeg) {
      const oldSeg = oldSegments.find(seg => seg.id === segId)
      if (oldSeg) {
        newSegments.unshift(oldSeg)
      } else {
        log.error(`Couldn't find new or old all segment to use (id=${segId})`)
      }
    }
  }

  // Prabhaavia:  make things appear as different colors on updates.
  //
  newSegments.forEach((item, i) => {
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


  sessionData.currentSegments = newSegments;

  setGlobal({
    sessionData,
    initialLoading: false,
    processing: false,
    loading: false,
  });
}

/**
 * handleSegmentInitFinished
 *
 */
async function handleSegmentInitFinished(aSegmentObj) {
  const method = 'cloudUser::handleSegmentInitFinished'
  if (!aSegmentObj) {
    throw new Error(`${method}: undefined segment argument.`)
  }
  log.debug(`${method}: Received initialized segment ${aSegmentObj.name}. (id=${aSegmentObj.id}, appId=${aSegmentObj.appId})`)

  // TODO: Prabhaav the new segment object has a new property, resultData:
  //
  //     resultdata: {
  //       version: '2.0',
  //       count: usersToReturn.length,
  //       block_id
  //     }
  //
  // Detect this and show the block id. Also add a query to get the result when 
  // clicked so we cans top storing the list and show more detailed info.
  // TODO: pagination too.
  //
  if (aSegmentObj.hasOwnProperty('resultData')) {
    log.debug(`Extended segment data received. resultData=\n${JSON.stringify(aSegmentObj.resultData, null, 2)}`)
  }

  const { apps } = getGlobal();
  let { sessionData } = getGlobal();

  //  First we need to check if the correct project is currently selected in state
  const app_id = aSegmentObj.appId
  const updatedSession = (sessionData.id !== app_id) ? apps[app_id] : sessionData
  const { currentSegments } = updatedSession;
  const segments = currentSegments ? currentSegments : [];

  // If this segment exists already, clobber it, otherwise append it (segment init
  // happens if a segment is created or edited.):
  let segIdx = segments.findIndex((segment) => {return segment.id === aSegmentObj.id})
  if (segIdx >= 0) {
    segments[segIdx] = aSegmentObj
  } else {
    segments.push(aSegmentObj)
  }

  apps[app_id].currentSegments = segments;

  if (sessionData.id === app_id) {
    const thisApp = apps[sessionData.id];
    thisApp.currentSegments = segments;
    sessionData = thisApp;
  }

  setGlobal({ sessionData, apps });
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

  async fetchOrgDataAndUpdate(anOrgId) {
    log.debug(`cloudUser::fetchOrgDataAndUpdate: called.\n` +
               `********************************************************************************\n`)
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
      org_id = anOrgId
    }

    //regardless of whether there is data in local storage, we need to fetch from db
    if (!org_id) {
      throw new Error(`Organization id is not defined. Please contact support@simpleid.xyz.`)
    }

    // Make sure that the org id is registered with the server, otherwise commands
    // will not appear and update the UX:
    //
    await registerOrg(org_id)

    let appData = undefined
    try {
      appData = { Item: await runClientOperation('getOrg', org_id) }
    } catch (fatalError) {
      throw new Error(`Unable to fetch organization information for id ${org_id}.\n` +
                      `Please reload the page. If that does not work, contact support@simpleid.xyz.\n` +
                      `${fatalError}`)
    }
    await setGlobal({
      org_id,
      plan: (appData.Item && appData.Item.plan) ? appData.Item.plan : process.env.REACT_APP_SID_ALL_FEATURES
    })

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

      // Example call for PB to get contract data from pg:
      //
      if (appData) {
        const values = (importedContracts) ?
          Object.keys(importedContracts).map(contractAddr => contractAddr.toLowerCase()) : []
        // argumentStr is of the format $1, $2 ... based on the # of values in inportedContracts
        // should check for empty--this may fail in that case
        const argumentStr = values.map((value, index) => { return `\$${index + 1}`}).join(', ')
        const operationData = {
          getStr: `SELECT address, name, implementation_contract, proxy_contract, mappings FROM contracts WHERE address in (${argumentStr});`,
          values
        }
        log.debug(`operationData:\n${JSON.stringify(operationData, null, 2)}`)
        const contractData = await runClientOperation('getPg', org_id, currentAppId, operationData)
        log.debug(`Fetched contract data from PG for contracts: "${values.join(', ')}":\n` +
                  `--------------------------------------------------------------------------------\n` +
                  `${JSON.stringify(contractData, null, 2)}` +
                  `\n\n`)
        await setGlobal({contractData})
      }

      // Get DAU/MAU Analytics Information
      const values = [1, 2, 3, 4, 5, 6, 7, 14, 21, 28]
      const analyticsTable = 'analytics_' + currentAppId
      const argumentStr = values.map((value, index) => { return `\$${index + 1}`}).join(', ')
      let getStr = `with analytics_stats as(
          select
            max(block_timestamp) as max_timestamp
          from 
            "${analyticsTable}"
      )\n`
      values.map(value => {
        getStr += `select
            count(address) as address_count,
            ${value} as interval
          from 
            "${analyticsTable}"
          where
              block_timestamp > ((select max_timestamp from analytics_stats) - interval '${value} day')\n`
        if (value !== 28) {
          getStr += `union all\n`
        }
      })
      const analyticsOpData = {
        getStr,
        values: []
      }
      log.debug(`analyticsOpData:\n${JSON.stringify(analyticsOpData, null, 2)}`)
      const activeUsersData = await runClientOperation('getPg', org_id, currentAppId, analyticsOpData)
      log.debug(`Fetched DAU/WAU/MAU data from PG\n` +
                `--------------------------------------------------------------------------------\n` +
                `${JSON.stringify(activeUsersData, null, 2)}` +
                `\n\n`)
      await setGlobal({activeUsersData})


      await this.addAllUsersToSessionData(currentAppId, data /* sessionData */)
      await setGlobal({
        currentAppId,
        importedContracts,
        apps: allApps,
        sessionData: data,
        projectFound: true,
        signedIn: true,
        loading: false
      });

      //  Fetch web2 analytics eventNames - we will fetch the actual event results in Segment handling
      let web2AnalyticsCmdObj = {
        command: 'getWeb2Analytics',
            data: {
             appId: currentAppId
          }
      }

      let web2Analytics = await getWeb2Analytics(web2AnalyticsCmdObj);
      setGlobal({ web2Events: web2Analytics.data ? web2Analytics.data : [] });

      //Check what pieces of data need to be processed. This looks at the segments, processes the data for the segments to
      //Get the correct results
      //Not waiting on a result here because it would clog the thread. Instead, when the results finish, the updateSegments function
      //Will update state as necessary

      if (data.currentSegments && data.currentSegments > 0) {
        await handleSegmentsUpdate({ currentSegments: data.currentSegments })
      } else {
        await this.fetchUsersCount(appData)
      }
      setGlobal({ loading: false, projectFound: false })
    }
  }

  /**
   * @returns true if sessionData has been modified! <-- WARNING
   * @param {*} currentAppId
   * @param {*} sessionData
   */
  async addAllUsersToSessionData(currentAppId, sessionData) {
    const method = 'addAllUsersToSessionData'
    let modifiedSessionData = false
    const segments = (sessionData.currentSegments) ? sessionData.currentSegments : []

    const allUsersSegId = `1-${currentAppId}`
    const allUsersIndex = segments.findIndex(aSeg => aSeg.id === allUsersSegId)
    if (allUsersIndex === -1) {
      log.debug(`${method}: creating all users segment.`)
      // The All Users segment does not exist so we'll create it here and push it to the server
      // (whare it is needed for notifying all users and emailing all users).
      const updatedData = await getUsers({ app_id: currentAppId })
      const allUsersSegmentCriteria = {
        firstRun: true,
        appId: currentAppId,
        showOnDashboard: true,
        id: allUsersSegId,
        name: 'All Users',
        userCount: updatedData.length,
        users: updatedData
      }

      try {
        const operationData = {
          segmentObj: allUsersSegmentCriteria
        }
        await runClientOperation('addSegment', undefined, currentAppId, operationData)
      } catch (error) {
        const errorMsg = `Creating the All Users segment failed. Please refresh the page and try again.\n` +
                          `If that fails, contact support@simpleid.xyz.\n`
        const userErrorMsg = errorMsg +
                              `More detailed error information appears in the browser's console.\n`
        const consoleErrorMsg = errorMsg +
                                error.message
        console.log(consoleErrorMsg)
        toast.error(userErrorMsg, {
          position: toast.POSITION.TOP_RIGHT,
          autoClose: 2000,
        })
        return
      }

      segments.unshift(allUsersSegmentCriteria)
      sessionData['currentSegments'] = segments
      modifiedSessionData = true
      log.debug(`${method}: success creating all users segment.`)
    }
    return modifiedSessionData
  }

  async fetchUsersCount(appData) {
    log.debug('cloudUser::fetchUsersCount')

    const { currentAppId, sessionData } = await getGlobal()
    const modifiedSessionData = await this.addAllUsersToSessionData(currentAppId, sessionData)

    const nextState = { loading: false }
    if (modifiedSessionData) {
      nextState['sessionData'] = sessionData
    }
    setGlobal(nextState)
  }

  async importWallets(anAppId, aContractAddress) {
    // TODO: Un-Justining. The following line likely needs to go away. When this works,
    //       remove and test.
    setGlobal({ orgData: undefined })

    const orgId = undefined
    const contractAddress = aContractAddress.toLowerCase()
    const operationData = {
      contractAddress
    }
    await runClientOperation('importWallets', orgId, anAppId, operationData)
  }

  async findImplementation(aContractAddress) {
    const contractAddress = aContractAddress.toLowerCase()
    const operationData = {
      contractAddress
    }
    const implementationAddress = await runClientOperation('findImplementation', undefined, undefined, operationData)
    console.log(`==============================\n${JSON.stringify(implementationAddress, null, 2)}`)
    return implementationAddress
  }

  async sendEmailMessaging(data) {
    setGlobal({ orgData: data.appData });

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
    setGlobal({ orgData: data.appData });

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
