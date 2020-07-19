import { setGlobal, getGlobal } from 'reactn'
import { handleData, runClientOperation } from './dataProcessing.js'
import { getSidSvcs } from './sidServices.js'
import { getLog } from './debugScopes.js'
import { setLocalStorage } from './misc';
import { getWeb2Analytics } from './web2Analytics';
const filter = require('./filterOptions.json');

const SID_EXPERIMENTAL_FEATURES = process.env.REACT_APP_SID_EXPERIMENTAL_FEATURES === 'true' ? true : false;

const SIMPLEID_USER_SESSION = 'SID_SVCS';
const SESSION_FROM_LOCAL = 'sessionData';
const log = getLog('cloudUser')

class CloudUser {

  async signOut() {
    await getSidSvcs().signOut()
    clearSidKeysFromLocalStore('CloudUser.js')
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

    const experimentalFeatures = (appData.Item && appData.Item.experimentalFeatures) ? true : false;
    setGlobal({
      experimentalFeatures: SID_EXPERIMENTAL_FEATURES === true ? SID_EXPERIMENTAL_FEATURES : experimentalFeatures,
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
      setLocalStorage(SESSION_FROM_LOCAL, JSON.stringify(data))


      //  Fetch web2 analytics eventNames - we will fetch the actual event results in Segment handling
      let web2AnalyticsCmdObj = {
        command: 'getWeb2Analytics',
            data: {
             appId: currentAppId
          }
      }

      let web2Analytics = await getWeb2Analytics(web2AnalyticsCmdObj);

      setGlobal({ web2Events: web2Analytics.data ? web2Analytics.data : [] });
      const { allFilters } = await getGlobal();

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

    const updatedData = await this.processData('fetch-user-count', payload)
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

  async updateSegments(appData) {
    const { org_id, currentAppId } = await getGlobal();
    const payload = {
      app_id: currentAppId,
      appData,
      org_id
    }
    this.processData('updateSegments', payload)
  }

  // This returns user info for the SimpleID user
  getUserData() {
    return JSON.parse(localStorage.getItem(SIMPLEID_USER_SESSION));
  }


  // TODO: this needs to go away and the methods need to be brought in to
  //       cloud user and then reorganized logically:
  async processData(type, data) {
    const payload = {
      type, data
    }
    // console.log("Calling handleData from cloudUser...")
    return await handleData(payload)
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


/**
 *  clearSidKeysFromLocalStore:
 *
 *    Clears some keys from local store (but not debug or ping)
 *
 */
export function clearSidKeysFromLocalStore(context='') {
  let keysToClear = [SIMPLEID_USER_SESSION, SESSION_FROM_LOCAL]
  // let allKeys = Object.entries(localStorage)
  // for(const localKey of allKeys) {
  //   if(localKey.includes('aws.cognito.identity')) {
  //     keysToClear.push(localKey)
  //   }
  // }

  for (const key of keysToClear) {
    try {
      localStorage.removeItem(key)
    } catch (suppressedError) {}
  }
}


// Singleton:
//
let cuInstance = undefined

export function getCloudUser() {
  if (!cuInstance) {
    cuInstance = new CloudUser()
  }
  return cuInstance
}
