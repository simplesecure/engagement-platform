import { setGlobal, getGlobal } from 'reactn'
import { handleData } from './dataProcessing.js'
import { getSidSvcs } from './sidServices.js'
import { getLog } from './debugScopes.js'
import * as dc from './dynamoConveniences.js'
import { setLocalStorage } from './misc';
import { getWeb2Analytics } from './web2Analytics';
const filter = require('./filterOptions.json');
const IdentityWallet = require('identity-wallet')
const Box = require('3box')

const SID_EXPERIMENTAL_FEATURES = process.env.REACT_APP_SID_EXPERIMENTAL_FEATURES === 'true' ? true : false;

// const CHAT_WALLET_KEY = 'chat-wallet'
const SIMPLEID_USER_SESSION = 'SID_SVCS';
const SESSION_FROM_LOCAL = 'sessionData';
const log = getLog('cloudUser')

class CloudUser {

  async signOut() {
    await getSidSvcs().signOut()
    clearSidKeysFromLocalStore('CloudUser.js')
    window.location.reload();
  }

  async fetchOrgDataAndUpdate() {
    await setGlobal({ allFilters: [] });
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

      appData = await dc.organizationDataTableGet(org_id);
      console.log(appData);
      const experimentalFeatures = appData.Item.experimentalFeatures ? true : false;
      setGlobal({experimentalFeatures: SID_EXPERIMENTAL_FEATURES === true ? SID_EXPERIMENTAL_FEATURES : experimentalFeatures });
    } else {
      console.log("ERROR: No Org ID")
    }

    await setGlobal({ org_id });
    if(appData && appData.Item && Object.keys(appData.Item.apps).length > 0) {
      const { liveChat } = await getGlobal()

      const appKeys = Object.keys(appData.Item.apps);
      const allApps = appData.Item.apps;
      const currentAppId = appKeys[0]
      const data = allApps[appKeys[0]];
      data['id'] = currentAppId

      await setGlobal({ signedIn: true, currentAppId, projectFound: true, apps: allApps, sessionData: data, loading: false });
      setLocalStorage(SESSION_FROM_LOCAL, JSON.stringify(data))
      //Check if app has been verified
      const verificationData = await dc.walletAnalyticsDataTableGet(currentAppId)
      try {
        const verified = Object.keys(verificationData.Item.analytics).length > 0
        setGlobal({ verified })
      } catch(e) {
        setGlobal({ verified: false })
      }

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
      if(web2Analytics.data) {

        const events = web2Analytics.data;

        for(const event of events) {
          const data = {
            type: 'web2',
            filter: `Web2: ${event}`
          }
          allFilters.push(data);
        }
        allFilters.push(...filter);
        setGlobal({ allFilters });
      }  else {
        allFilters.push(...filter);
      }

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
      //Not waiting on a result here because it would clog the thread. Instead, when the results finish, the fetchSegmentData function
      //Will update state as necessary
      
      
      if(data.currentSegments) {
        //  Find the weekly and monthly segments and update them with the correct data
        
        this.fetchSegmentData(appData);
      } else {
        this.fetchUsersCount(appData)
      }

      if(liveChat) {
        //  This is where we need to check for the chat support address
        //  This address is the one used to connect to 3Box without a web3 wallet
        //  If it's not available, need to create one
        //  For initial testing, none will be available so we will check localStorage

        const chatSupportWallet = await getSidSvcs().getChatSupportAddress(appData.Item, currentAppId)
        const { signingKey } = chatSupportWallet
        const { privateKey } = signingKey
        const seed = privateKey
        const idWallet = new IdentityWallet(getConsent, { seed })
        const box = await handle3BoxConnection(idWallet)
        const space = await connectToSpace(box, currentAppId)
        const mainThread = await accessThread(space, currentAppId)
        let mainThreadPosts
        mainThread.onUpdate(async () => {
          console.log("New User - Getting posts...")
          mainThreadPosts = await getPosts(mainThread)
          fetchAllPosts(space, mainThreadPosts)
          setGlobal({ mainThreadPosts })
        })
        const mainThreadHash = mainThread.address.split('orbitdb/')[1].split('/3box')[0]
        mainThreadPosts = await getPosts(mainThread)
        fetchAllPosts(space, mainThreadPosts)
        setGlobal({ idWallet, box, space, mainThread, mainThreadPosts, liveChatId: mainThreadHash })
      }

    } else {
      setGlobal({ loading: false, projectFound: false })
      //If there's nothing returned from the DB but something is still in local storage, what do we do?
      //TODO: should we remove from localstorage here?
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

      // //  Post this data to the DB
      // const { apps } = await getGlobal();
      // const thisApp = apps[currentAppId];
      // thisApp.currentSegments = segments;
      // apps[currentAppId] = thisApp;

      // try {
      //   const anObject = appData.Item;
      //   anObject.apps = apps;
      //   anObject[process.env.REACT_APP_ORG_TABLE_PK] = org_id;
      //   await dc.organizationDataTablePut(anObject);

      // } catch (suppressedError) {
      //   const ERROR_MSG =
      //     "There was a problem creating the segment, please try again. If the problem continues, contact support@simpleid.xyz.";
      //   setGlobal({ error: ERROR_MSG });
      //   console.log(`ERROR: problem writing to DB.\n${suppressedError}`);
      // }

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

    const appData = await dc.organizationDataTableGet(org_id)
    const thisApp = appData.Item.apps[currentAppId]
    if(thisApp.currentSegments) {
      this.fetchSegmentData(appData)
    } else {
      setGlobal({ processing: false })
    }
  }

  async fetchSegmentData(appData) {
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
    console.log("Calling handleData from cloudUser...")
    return await handleData(payload)
  }

  async createProject(anOrgId, theAppObj) {
    // #JustinRideToTheMoon
    //
    // History:  setGlobal( {..., notificationId: data.appId }) was at the
    //           start of dataProcessing::handleData.  When called with create
    //           project as the type, appId is undefined, so we preserve that
    //           behavior here with notificationId --> undefined in case
    //           it's required for side effects:
    //           Also, I'm confused about orgData as in many cases in data
    //           processing, it would actually be appData... (TODO ask Justin)
    setGlobal({ orgData: theAppObj, notificationId: undefined })

    return await getSidSvcs().createAppId(anOrgId, theAppObj)
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

async function getConsent({ type, origin, spaces }) {
  // For testing purposes a function that just returns
  // true can be used. In prodicution systems the user
  // should be prompted for input.
  return true
}

async function handle3BoxConnection(idWallet) {
  return new Promise(async (resolve, reject) => {
    const threeIdProvider = idWallet.get3idProvider()
    try {
      const box = await Box.openBox(null, threeIdProvider)
      resolve(box)
    } catch(e) {
      reject(e)
    }
  })
}

async function connectToSpace(box, spaceId) {
  return new Promise(async (resolve, reject) => {
    try {
      const space = await box.openSpace(spaceId)
      resolve(space)
    } catch(e) {
      reject(e)
    }
  })
}

async function accessThread(space, threadId, firstModAddress) {
  return new Promise(async (resolve, reject) => {
    try {
      let thread
      if(firstModAddress) {
        thread = await space.joinThread(threadId, { firstModerator: firstModAddress })
      } else {
        thread = await space.joinThread(threadId)
      }
      resolve(thread)
    } catch(e) {
      reject(e)
    }
  })
}

async function getPosts(thread) {
  return new Promise(async (resolve, reject) => {
    try {
      const posts = await thread.getPosts()
      resolve(posts)
    } catch(e) {
      console.log("Fetching posts error: ", e)
      reject(e)
    }
  })
}

async function fetchAllPosts(space, mainThreadPosts) {
  if(mainThreadPosts) {
    const openThreads = []
    const closedThreads = []
    for(const thread of mainThreadPosts) {
      //  TODO - Clean this all up
      //  There is a combination of parsing and not happening here
      //  We should be parsing posts going forward because they include a
      //  name and a message
      let threadJson = undefined
      try {
        threadJson = JSON.parse(thread.message)
      } catch(e) {
        console.log("not json")
      }

      let thisThread = undefined
      let authorName = undefined
      if(threadJson) {
        const { name, message } = threadJson
        authorName = name
        thisThread = await space.joinThreadByAddress(message)
      } else {
        thisThread = await space.joinThreadByAddress(thread.message)
      }

      thisThread.onUpdate(() => {
        const { ourMessage } = getGlobal()
        //  If there's a new post we need to fetch posts again
        fetchAllPosts(space, mainThreadPosts)
        //  Play notification but only for the inbound messages
        if(!ourMessage) {
          //const audio = new Audio(require('../assets/sounds/notification.mp3'))
          //audio.play()
        }
        setGlobal({ ourMessage: false })
      })
      let posts = await thisThread.getPosts()
      if(posts && posts.length > 0) {
        //  Check if the most recent message is a closed message
        const mostRecentMessage = posts[posts.length - 1]
        const { message } = mostRecentMessage
        const messageText = JSON.parse(message)
        thread['postCount'] = posts.length
        if(authorName) {
          thread['name'] = authorName
        }
        if(messageText.message !== "CONVERSATION CLOSED") {
          openThreads.push(thread)
          setGlobal({ openChatThreads: openThreads })
        } else {
          closedThreads.push(thread)
          setGlobal({ closedChatThreads: closedThreads })
        }
      }
    }
  }
}
