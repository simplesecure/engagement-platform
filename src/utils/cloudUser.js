import { setGlobal, getGlobal } from 'reactn'
import { handleData } from './dataProcessing.js'
import { getSidSvcs } from './sidServices.js'
import { getLog } from './debugScopes.js'
import { getFromOrganizationDataTable, getFromAnalyticsDataTable } from './awsUtils';
import { setLocalStorage } from './misc';
const IdentityWallet = require('identity-wallet')
const ethers = require('ethers')
const Box = require('3box')

const CHAT_WALLET_KEY = 'chat-wallet'
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
      appData = await getFromOrganizationDataTable(org_id);
      console.log(appData)

      
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
      const verificationData = await getFromAnalyticsDataTable(currentAppId)
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
        this.fetchSegmentData(appData);
      } else {
        this.fetchUsersCount(appData)
      }

      if(liveChat) {
        //  This is where we need to check for the chat support address
        //  This address is the one used to connect to 3Box without a web3 wallet
        //  If it's not available, need to create one
        //  For initial testing, none will be available so we will check localStorage

        const chatSupportWallet = await getChatSupportAddress()
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
    const { org_id, currentAppId } = await getGlobal();
    const payload = {
      app_id: currentAppId,
      appData,
      org_id
    }
    console.log(payload)
    this.processData('update-segments', payload)
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


// Singleton:
//
let cuInstance = undefined

export function getCloudUser() {
  if (!cuInstance) {
    cuInstance = new CloudUser()
  }
  return cuInstance
}

function getChatSupportAddress() {
  //  When the the chat wallet data is returned from the DB, this function will be 
  //  relegated to chat wallet creation only
  return new Promise((resolve, reject) => {
    const chatWallet = localStorage.getItem(CHAT_WALLET_KEY) ? JSON.parse(localStorage.getItem(CHAT_WALLET_KEY)) : undefined
    if(chatWallet) {
      //  If the chat wallet is found, 
      resolve(chatWallet)
    } else {
      try {
        const randomWallet = ethers.Wallet.createRandom()
        localStorage.setItem(CHAT_WALLET_KEY, JSON.stringify(randomWallet))
        resolve(randomWallet)
      } catch(e) {
        reject(e)
      }
    }
  })
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
          const audio = new Audio(require('../assets/sounds/notification.mp3'))
          audio.play()
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