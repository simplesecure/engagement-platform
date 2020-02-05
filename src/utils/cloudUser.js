import { setGlobal, getGlobal } from 'reactn'
import { handleData } from './dataProcessing.js'
import { getSidSvcs } from './sidServices.js'
import { getLog } from './debugScopes.js'
import { getFromOrganizationDataTable, getFromAnalyticsDataTable } from './awsUtils';
import { setLocalStorage } from './misc';

const SIMPLEID_USER_SESSION = 'SID_SVCS';
const log = getLog('cloudUser')

class CloudUser {

  async signOut() {
    await getSidSvcs().signOut()
    clearSidKeysFromLocalStore('getCloudUser().js')
    window.location.reload();
  }

  async fetchOrgDataAndUpdate() {
    const { SESSION_FROM_LOCAL } = await getGlobal()
    const org_id = getCloudUser().getUserData().sid ? getCloudUser().getUserData().sid.org_id : undefined
    //regardless of whether there is data in local storage, we need to fetch from db
    let appData;
    if(org_id) {
      appData = await getFromOrganizationDataTable(org_id);
    } else {
      console.log("ERROR: No Org ID")
    }


    setGlobal({ org_id });
    if(appData && appData.Item && Object.keys(appData.Item.apps).length > 0) {
      const appKeys = Object.keys(appData.Item.apps);
      const allApps = appData.Item.apps;
      const currentAppId = appKeys[0]
      const data = allApps[appKeys[0]];
      data['id'] = currentAppId

      setGlobal({ signedIn: true, loading: false, currentAppId, apps: allApps, sessionData: data });

      //Check if app has been verified
      console.log(currentAppId)
      const verificationData = await getFromAnalyticsDataTable(currentAppId);
      console.log(verificationData)
      if(verificationData.Item && verificationData.Item.verified) {
        setGlobal({ verified: true })
      }

      //Check what pieces of data need to be processed. This looks at the segments, processes the data for the segments to
      //Get the correct results
      //Not waiting on a result here because it would clog the thread. Instead, when the results finish, the fetchSegmentData function
      //Will update state as necessary
      if(data.currentSegments) {
        //TODO: We really need to find a good way to update this
        this.fetchSegmentData(appData);
      }

      setLocalStorage(SESSION_FROM_LOCAL, JSON.stringify(data));
    } else {
      setGlobal({ loading: false });
      //If there's nothing returned from the DB but something is still in local storage, what do we do?
      //TODO: should we remove from localstorage here?
    }
  }

  async fetchSegmentData(appData) {
    console.warn("FETCHING SEGMENT DATA")
    const { sessionData, SESSION_FROM_LOCAL, org_id, currentAppId } = await getGlobal();
    const payload = {
      app_id: currentAppId,
      appData,
      org_id
    }
    const { currentSegments } = sessionData
    let segs = currentSegments;
    setGlobal({ initialLoading: true })
    const updatedData = await this.processData('update-segments', payload)
    segs = updatedData
    sessionData.currentSegments = segs;
    setGlobal({ sessionData, initialLoading: false })
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
      console.log("FROM CLOUD USER: ", thisUserSignUp)
      const { authenticated } = thisUserSignUp;
      authenticatedUser = authenticated;

      //sid = getSidSvcs().getSID();
      const org_id = getCloudUser().getUserData() && getCloudUser().getUserData().sid ? getCloudUser().getUserData().sid.org_id : undefined
      setGlobal({ org_id })
      // setGlobal({ sid });
    } catch (error) {
      // TODO: Cognito gives 3 shots at this
      // throw `ERROR: Failed trying to submit or match the code.\n${error}`
      log.error(`ERROR: Failed trying to submit or match the code:\n`)
      log.error(error)
    }

    log.debug("AUTHENTICATED USER: ", authenticatedUser);
    //TODO: @AC needs to review because this might be a place where we are revealing too much to the parent
    if (authenticatedUser) {
      // sid = getSidSvcs().getSID();
      // console.log("SID: ", sid)
      // const userData = {
      //   orgId: sid ? sid.org_id : ""
      // }
      // localStorage.setItem(SIMPLEID_USER_SESSION, JSON.stringify(userData));
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
  const keysToClear = [SIMPLEID_USER_SESSION]
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
