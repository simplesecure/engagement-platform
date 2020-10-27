import { setGlobal, getGlobal } from 'reactn'
import { getSidSvcs } from './sidServices.js'
import { getLog } from './debugScopes.js'
import { getWeb2Analytics } from './web2Analytics';
import socketIOClient from "socket.io-client";
import { toast } from "react-toastify";

const socket = socketIOClient(process.env.REACT_APP_WEB_API_HOST);
const log = getLog('cloudUser')

const { customCharts } = require('./customCharts')
const { customChartsSQL } = require('./customChartsSQL')

const filter = require('./filterOptions.json');

const SIMPLEID_USER_SESSION = 'SID_SVCS';
const BLOCK_ID_EVENT= "block id"
const RT_SEGMENT_UPDATE_EVENT = "real time segment update"



//////////////// Socket Stuff <-- TODO: move / encapsulate //////////////

const registerOrg = async (anOrgId=undefined) => {
  const method = 'registerOrg'

  if (!anOrgId) {
    const { org_id } = await getGlobal()
    anOrgId = org_id
  }

  if (!anOrgId) {
    // TODO: Prabhaav, set connected state to instruct the user to sign-out and sign back in
    //       (Why would org id not be defined?  It comes from cognito gated dynamo for user on sign in.)
    log.warn(`${method} Unable to register organization id with server.`)
    return
  }

  socket.emit('org_id', anOrgId)
  log.info(`${method}: registered org id ${anOrgId} with server.`)
}

socket.on('connect', async () => {
  log.debug('server connect')
  await registerOrg()
  await setGlobal({ connected: 'connect' })
})
socket.on('reconnect', async () => {
  log.debug('server reconnect')
  await registerOrg()
  await setGlobal({ connected: 'reconnect' })
})
socket.on('disconnect', async () => {
  log.debug('server disconnect')
  await setGlobal({ connected: 'disconnect' })
})
socket.on('reconnecting', async () => {
  log.debug('server reconnecting')
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
  const { currentSegments, monitoring } = updatedSession;
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
  apps[app_id].monitoring = monitoring;

  if (sessionData.id === app_id) {
    const thisApp = apps[sessionData.id];
    thisApp.currentSegments = segments;
    thisApp.monitoring = monitoring
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
      const currentAppId = appKeys[appKeys.length - 1]
      const data = allApps[currentAppId];
      data['id'] = currentAppId
      const appVersion = appData.Item.apps[currentAppId].version
      // Get latest list of ERC20 tokens we support
      const tokenOperationData = {
        getStr: `SELECT * FROM tokens ORDER BY name ASC`,
        values: []
      }
      const tokenData = await runClientOperation('getPg', null, null, tokenOperationData)
      await setGlobal({tokenData})

      // Get latest list of ERC20 tokens we support
      const contractOperationData = {
        getStr: `SELECT * FROM contracts`,
        values: []
      }
      const contractData = await runClientOperation('getPg', null, null, contractOperationData)
      await setGlobal({contractData})

      const { monitoring } = data
      // get event count information
      await getCloudServices().getContractEventCount(currentAppId, monitoring, true)
      await getCloudServices().getTokenTop50Wallets(monitoring, true)
      await getCloudServices().getCustomChartData(monitoring, true)
      // Get DAU/MAU Analytics Information
      // const values = [1, 2, 3, 4, 5, 6, 7, 14, 21, 28]
      // const analyticsTable = 'analytics_' + currentAppId
      // const argumentStr = values.map((value, index) => { return `\$${index + 1}`}).join(', ')
      // let getStr = `with analytics_stats as(
      //     select
      //       max(block_timestamp) as max_timestamp
      //     from 
      //       "${analyticsTable}"
      // )\n`
      // values.map(value => {
      //   getStr += `select
      //       count(address) as address_count,
      //       ${value} as interval
      //     from 
      //       "${analyticsTable}"
      //     where
      //         block_timestamp > ((select max_timestamp from analytics_stats) - interval '${value} day')\n`
      //   if (value !== 28) {
      //     getStr += `union all\n`
      //   }
      // })
      // const analyticsOpData = {
      //   getStr,
      //   values: []
      // }
      // log.debug(`analyticsOpData:\n${JSON.stringify(analyticsOpData, null, 2)}`)
      // const activeUsersData = await runClientOperation('getPg', org_id, currentAppId, analyticsOpData)
      // log.debug(`Fetched DAU/WAU/MAU data from PG\n` +
      //           `--------------------------------------------------------------------------------\n` +
      //           `${JSON.stringify(activeUsersData, null, 2)}` +
      //           `\n\n`)
      // await setGlobal({activeUsersData})


      // TODO: DELETE COMMENTED BELOW
      // await this.addAllUsersToSessionData(currentAppId, data /* sessionData */)
      await setGlobal({
        currentAppId,
        // importedContracts,
        apps: allApps,
        sessionData: data,
        projectFound: true,
        signedIn: true,
        loading: false,
        appVersion
      });

      //  Fetch web2 analytics eventNames - we will fetch the actual event results in Segment handling
      // let web2AnalyticsCmdObj = {
      //   command: 'getWeb2Analytics',
      //       data: {
      //        appId: currentAppId
      //     }
      // }

      // let web2Analytics = await getWeb2Analytics(web2AnalyticsCmdObj);
      // setGlobal({ web2Events: web2Analytics.data ? web2Analytics.data : [] });

      //Check what pieces of data need to be processed. This looks at the segments, processes the data for the segments to
      //Get the correct results
      //Not waiting on a result here because it would clog the thread. Instead, when the results finish, the updateSegments function
      //Will update state as necessary

      if (data.currentSegments && data.currentSegments > 0) {
        await handleSegmentsUpdate({ currentSegments: data.currentSegments })
      } else {
        await this.fetchUsersCount(appData)
      }
      // setGlobal({ loading: false, projectFound: false })
    }
    setGlobal({ loading: false, projectFound: false })
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

    // const { currentAppId, sessionData } = await getGlobal()
    // TODO: DELETE COMMENTED BELOW
    // const modifiedSessionData = await this.addAllUsersToSessionData(currentAppId, sessionData)

    const nextState = { loading: false }
    // TODO: DELETE COMMENTED BELOW
    // if (modifiedSessionData) {
    //   nextState['sessionData'] = sessionData
    // }
    setGlobal(nextState)
  }

  async getTokenTop50Wallets(tokenAddress, isArray) {
    let { tokenData, tokenTop50Wallets } = await getGlobal()
    let keys = []
    if (isArray) {
      keys = Object.keys(tokenAddress)
    } else {
      keys = [tokenAddress]
    }
    for (let k of keys) {
      const idx = Object.keys(tokenData).find(key => k === tokenData[key].address)
      if (idx > -1 ) {
        if (!tokenTop50Wallets)
          tokenTop50Wallets = {}
        // Get latest list of ERC20 tokens we support
        const tokenOperationData = {
          getStr: `SELECT 
                    address,
                    "${k}" AS amount
                  FROM balances
                  ORDER BY "${k}" DESC NULLS LAST
                  LIMIT 50`,
          values: []
        }
        const returnData = await runClientOperation('getPg', null, null, tokenOperationData)
        if (returnData) {
          tokenTop50Wallets[k] = returnData
          await setGlobal({ tokenTop50Wallets })
        }
      }
    }
  }

  async getCustomChartData(tokenAddress, isArray) {
    let { customChartData } = await getGlobal()
    let keys = []
    if (isArray) {
      keys = Object.keys(tokenAddress)
    } else {
      keys = [tokenAddress]
    }
    for (let k of keys) {
      const idx = Object.keys(customCharts).find(key => k === customCharts[key].address)
      if (idx > -1 ) {
        if (!customChartData)
          customChartData = {}
        // Get latest list of ERC20 tokens we support
        const getStr = customChartsSQL[customCharts[idx]["charts"]](k)
        const tokenOperationData = {
          getStr,
          values: []
        }
        let returnData = await runClientOperation('getPg', null, null, tokenOperationData)
        //hack to remove additional headers from SQL output
        returnData.shift()
        if (returnData) {
          customChartData[k] = {
            data: returnData,
            title: customCharts[idx]["title"]
          }
          await setGlobal({ customChartData })
        }
      }
    }
  }

  async getContractEventCount(anAppId, monitoring, isArray) {
    const orgId = undefined
    let { contractData, eventData } = await getGlobal()
    if (!eventData)
      eventData = {}
    let keys = []
    if (isArray) {
      keys = Object.keys(monitoring)
    } else {
      keys = [monitoring]
    }
    for (let key of keys) {
      const proxy_contract = key.toLowerCase()
      const idx = Object.keys(contractData).find(key => proxy_contract === contractData[key].address)
      let { implementation_contract } = contractData[idx]
      if (implementation_contract === "" || !implementation_contract) {
        implementation_contract = proxy_contract
      }
      // TODO: Monkey Business Development Activities
      const operationData = {
        queryName: 'getEventCount',
        queryParams: {
          impl_contract: implementation_contract.toLowerCase(),
          proxy_contract
        }
      }
      const eventCounts = await runClientOperation('askPg', orgId, anAppId, operationData)
      // log.debug(`Event counts for contract ${operationData.queryParams.impl_contract} = \n` +
      //           `${JSON.stringify(eventCounts, null, 2)}`)
      if (eventCounts.length) {
        const { event_counts_arr } = eventCounts[0]
        eventData[proxy_contract] = event_counts_arr
        await setGlobal({ eventData })
      }
    }
  }

  async monitorContract(anAppId, aContractAddress) {
    const orgId = undefined
    const contractAddress = aContractAddress.toLowerCase()
    const operationData = {
      contractAddress
    }
    const orgData = await runClientOperation('monitorContract', orgId, anAppId, operationData)
    // console.log(`==============================\n${JSON.stringify(orgData, null, 2)}`)
    return orgData
  }
  
  async unmonitorContract(anAppId, aContractAddress) {
    const orgId = undefined
    const contractAddress = aContractAddress.toLowerCase()
    const operationData = {
      contractAddress
    }
    const orgData = await runClientOperation('unmonitorContract', orgId, anAppId, operationData)
    // console.log(`==============================\n${JSON.stringify(orgData, null, 2)}`)
    return orgData
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

    // console.log(payload);

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

  async airtableCrm(userData) {
    // write info to CRM
    try {
      const { email } = userData
      const wIdx = email.indexOf('@')
      const lIdx = email.lastIndexOf('.')
      const name = email.substring(0, wIdx)
      const website = `http://${email.substring(wIdx+1)}`
      const company = email.substring(wIdx+1, lIdx)
      const companyData = {
        "records": [
          {
            "fields": {
              "Company": company,
              "Website": website,
            }
          }
        ]
      }
      const requestData1 = {
        method: "post",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.REACT_APP_AIRTABLE_API_KEY}`
        },
        body: JSON.stringify(companyData),
      }
      const companyRecordUrl = 'https://api.airtable.com/v0/appU0AoI6OGaWPlm0/Companies'
      const result1 = await fetch(companyRecordUrl, requestData1);
      const jsonData1 = await result1.json();
      if (jsonData1 && jsonData1.records) {
        const companyId = jsonData1.records[0].id
        const contactData = {
          "records": [
            {
              "fields": {
                "Full Name": name,
                "Company": [companyId],
                "Email": email,
                "Last Signed In": new Date(Date.now()).toDateString()
              }
            }
          ]
        }
        const contactRecordUrl = 'https://api.airtable.com/v0/appU0AoI6OGaWPlm0/Contacts'
        const requestData2 = {
          method: "post",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${process.env.REACT_APP_AIRTABLE_API_KEY}`
          },
          body: JSON.stringify(contactData),
        }
        await fetch(contactRecordUrl, requestData2);
        // const jsonData2 = await result2.json();
      }
    } catch (error) {
      log.error("airtable crm add record:\n", error);
      return error;
    }
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
      await this.airtableCrm(userData)

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
