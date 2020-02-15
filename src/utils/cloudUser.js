import { setGlobal, getGlobal } from 'reactn'
import { handleData } from './dataProcessing.js'
import { getSidSvcs } from './sidServices.js'
import { getLog } from './debugScopes.js'
import { getFromOrganizationDataTable, getFromAnalyticsDataTable } from './awsUtils';
import { setLocalStorage } from './misc';

const SIMPLEID_USER_SESSION = 'SID_SVCS';
const SESSION_FROM_LOCAL = 'sessionData';
const log = getLog('cloudUser')

class CloudUser {

  async signOut() {
    await getSidSvcs().signOut()
    clearSidKeysFromLocalStore('getCloudUser().js')
    window.location.reload();
  }

  async fetchOrgDataAndUpdate() {
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
    
    //regardless of whether there is data in local storage, we need to fetch from db
    let appData;
    if(org_id) {
      console.log(org_id)
      appData = await getFromOrganizationDataTable(org_id);
      console.log(appData)
    } else {
      console.log("ERROR: No Org ID")
    }


    await setGlobal({ org_id });
    if(appData && appData.Item && Object.keys(appData.Item.apps).length > 0) {
      const appKeys = Object.keys(appData.Item.apps);
      const allApps = appData.Item.apps;
      const currentAppId = appKeys[0]
      const data = allApps[appKeys[0]];
      data['id'] = currentAppId
      await setGlobal({ signedIn: true, currentAppId, projectFound: true, apps: allApps, sessionData: data });
      setLocalStorage(SESSION_FROM_LOCAL, JSON.stringify(data));
      //Check if app has been verified
      const verificationData = await getFromAnalyticsDataTable(currentAppId);
      try {
        const verified = Object.keys(verificationData.Item.analytics).length > 0
        setGlobal({ verified })
      } catch(e) {
        setGlobal({ verified: false })
      }

      //Check what pieces of data need to be processed. This looks at the segments, processes the data for the segments to
      //Get the correct results
      //Not waiting on a result here because it would clog the thread. Instead, when the results finish, the fetchSegmentData function
      //Will update state as necessary
      if(data.currentSegments) {

        //TODO: We really need to find a good way to update this
        //this.fetchSegmentData(appData);
      } 
      this.fetchUsersCount(appData)

      //setLocalStorage(SESSION_FROM_LOCAL, JSON.stringify(data));
    } else {
      setGlobal({ loading: false, projectFound: false });
      //If there's nothing returned from the DB but something is still in local storage, what do we do?
      //TODO: should we remove from localstorage here?
    }
  }

  async fetchUsersCount(appData) {
    const { org_id, currentAppId, sessionData } = await getGlobal()
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
      sessionData['currentSegments'] = segments

      await setGlobal({ sessionData })

      setGlobal({ loading: false })
    } else {
      setGlobal({ loading: false })
    }
  }

  async handleUpdateSegments() {
    const { currentAppId } = getGlobal()
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

    const appData = await getFromOrganizationDataTable(org_id)
    const thisApp = appData.Item.apps[currentAppId]
    if(thisApp.currentSegments) {
      this.fetchSegmentData(appData)
    } else {
      setGlobal({ processing: false })
    }
  }

  async fetchSegmentData(appData) {
    const { sessionData, SESSION_FROM_LOCAL, org_id, currentAppId } = await getGlobal();
    const payload = {
      app_id: currentAppId,
      appData,
      org_id
    }
    console.log(payload)
    const { currentSegments } = sessionData
    let segs = currentSegments;
    //setGlobal({ initialLoading: true })
    const updatedData = await this.processData('update-segments', payload)
    segs = updatedData
    sessionData.currentSegments = segs;
    setGlobal({ sessionData, initialLoading: false, processing: false })
    setLocalStorage(SESSION_FROM_LOCAL, JSON.stringify(sessionData));
  }

  // This returns user info for the SimpleID user
  getUserData() {
    return JSON.parse(localStorage.getItem(SIMPLEID_USER_SESSION));
  }

  async processData(type, data) {
    const payload = {
      type, data
    }
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
        console.log(userData)
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


// El Singltone:
//
let cuInstance = undefined

export function getCloudUser() {
  if (!cuInstance) {
    cuInstance = new CloudUser()
  }
  return cuInstance
}
