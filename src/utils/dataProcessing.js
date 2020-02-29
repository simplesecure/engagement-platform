import { walletAnalyticsDataTableGet,
         organizationDataTablePut } from './dynamoConveniences.js';
import { getSidSvcs } from './sidServices.js'
import { getLog } from './debugScopes.js'
const useTestAddresses = localStorage.getItem('sid-use-test-addresses')
const SID_ANALYTICS_APP_ID = '00000000000000000000000000000000'
const BN = require('bignumber.js')

const rp = require('request-promise')

const log = getLog('dataProcessing')

const ALETHIO_KEY = process.env.REACT_APP_ALETHIO_KEY;
const ALETHIO_URL = process.env.REACT_APP_ALETHIO_URL;
const ROOT_EMAIL_SERVICE_URL = process.env.REACT_APP_EMAIL_SVC_URL

const headers = { Authorization: `Bearer ${ALETHIO_KEY}`, 'Content-Type': 'application/json' }
let addresses = []
export async function handleData(dataToProcess) {
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
    const currentSegments = thisApp.currentSegments;
    const updatedSegments = []
    let saveToDb = false

    for(const seg of currentSegments) {
      seg['appId'] = data.app_id
      const dataForProcessing = {
        type: 'segment',
        data: seg
      }
      const results = await handleData(dataForProcessing)

      log.debug("RESULTS: ", results)
      if(results && results.length > seg.userCount) {
        seg.users = results;
        seg.userCount = results.length
        saveToDb = true
        updatedSegments.push(seg)
      } else {
        updatedSegments.push(seg)
      }
    }

    log.debug("UPDATED SEGMENTS: ", updatedSegments)

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
  } else if(type === 'segment') {
    let results;
    //Need to fetch user list that matches segment criteria
    //TODO: AC return the entire user list here so we can use it to plug into analytics service and filter
    try {
      log.debug(data.appId);
      
      const appData = await walletAnalyticsDataTableGet(data.appId);
      let users = undefined
      if(useTestAddresses) {
        users = require('./testAddresses.json').addresses
      } else {
        users = Object.keys(appData.Item.analytics);
      }
      log.debug(appData);
      if(data.conditions && data.conditions.filterConditions) {
        //  This is a segment with multiple filters combined
        //  Start by pulling out the operator
        const { conditions } = data
        const { operator, filterConditions } = conditions
        let usersToReturn = []
        if(operator === "Or") {
          //  Any matching criteria should be used to create segment
          for(const condition of filterConditions) {
            const filterType = condition.filter ? condition.filter.filter : condition.name
            const data = condition
            let usersToSend;
            if(filterType === "Last Seen") {
              usersToSend = appData.Item.analytics
            } else { 
              usersToSend = users
            }
            const results = await runFilters(filterType, data, usersToSend)
            usersToReturn.push(...results)
          }
          return usersToReturn
        } else {
          //  Only users that match all conditions should be included
          usersToReturn = users
          for(const condition of filterConditions) {
            const filterType = condition.filter ? condition.filter.filter : condition.name
            const data = condition
            let usersToSend;
            if(filterType === "Last Seen") {
              usersToSend = appData.Item.analytics
            } else { 
              usersToSend = usersToReturn
            }
            const results = await runFilters(filterType, data, usersToSend)
            usersToReturn = results
          }
          return usersToReturn
        }
      } else {
        const filterType = data.filter ? data.filter.filter : data.name
        switch(filterType) {
          case "Smart Contract Transactions":
            results = await filterByContract(users, data.contractAddress);
            break;
          case "All Users":
            //placeholder for all users
            results = users;
            break;
          case "Last Seen":
            //placeholder for Last Seen
            results = await filterByLastSeen(users, data);
            break;
          case "Wallet Balance":
            //placeholder for Wallet Balance
            results = await filterByWalletBalance(users, data.numberRange)
            break;
          case "Total Transactions":
            //placeholder for Total Transactions
            results = await fetchTotalTransactions(users);
            break;
          default:
            break;
        }
        return results;
      }
    } catch(e) {
      log.error("Error: ", e)
      return e
    }
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

    return await handleEmails(dataForEmailService, ROOT_EMAIL_SERVICE_URL)
  } else if(type === 'create-project') {
    const { appObject, orgId } = data;
    const createProject = await getSidSvcs().createAppId(orgId, appObject)
    log.debug(createProject)
    return createProject
  }
}

export async function runFilters(filterType, data, users) {
  return new Promise(async (resolve, reject) => {
    let results;
    try {
      switch(filterType) {
        case "Smart Contract Transactions":
          results = await filterByContract(users, data.contractAddress);
          break;
        case "All Users":
          //placeholder for all users
          results = users;
          break;
        case "Last Seen":
          //placeholder for Last Seen
          results = await filterByLastSeen(users, data);
          break;
        case "Wallet Balance":
          //placeholder for Wallet Balance
          results = await filterByWalletBalance(users, data.numberRange)
          break;
        case "Total Transactions":
          //placeholder for Total Transactions
          results = await fetchTotalTransactions(users);
          break;
        default:
          break;
      }
       resolve(results)
    } catch(e) {
      reject(e)
    }
  })
}

export async function filterByContract(userList, contractAddress) {
  const uri = `${ALETHIO_URL}/contracts/${contractAddress}/transactions?page[limit]=100`;
  await fetchFromURL(uri, "contract");
  const uniqueAddresses = [...new Set(addresses)];
  log.debug(uniqueAddresses);
  log.debug(userList)
  let resultingAddresses = []
  for(const addr of userList) {
    const match = uniqueAddresses.indexOf(addr.toLowerCase());
    log.debug(match);
    if(match > -1) {
      resultingAddresses.push(uniqueAddresses[match])
    }
  }
  return resultingAddresses;
}

export function fetchFromURL(url, functionType) {
  log.debug("API URL: ", url);
  const options = {
    method: 'GET',
    uri: url,
    headers,
    json: true
  }
  return rp(options)
  .then(async function (parsedBody) {
    if(functionType === "contract") {
      const transactions = parsedBody.data;
      const addressesToPush = transactions.map(a => a.relationships.from.data.id);
      addresses.push(...addressesToPush);
      if(parsedBody.meta.page.hasNext) {
        const newUrl = parsedBody.links.next;
        await fetchFromURL(newUrl, "contract");
      } else {
        return addresses;
      }
    } else {
      log.debug("FROM ALETHIO: ", parsedBody);
    }
  })
  .catch(function (err) {
    log.error(err.message);
  });
}

export async function filterByLastSeen(users, data) {
  const { dateRange } = data;
  //const datum = Date.parse(dateRange.date);

  let filteredList = []
  const usersToCycleThrough = Object.keys(users)
  for (const userKey of usersToCycleThrough) {
    if (users[userKey].last_seen && dateRange.rangeType === "Before" && parseInt(users[userKey].last_seen, 10) < dateRange.date) {
      filteredList.push(userKey);
    } else if(users[userKey].last_seen && dateRange.rangeType === "After" && parseInt(users[userKey].last_seen, 10) > dateRange.date) {
      filteredList.push(userKey);
    }
  }
  return filteredList;
}

export async function filterByWalletBalance(users, balanceCriteria) {
  // The below can be used when testing locally to use real addresses that have a
  // combination of ERC20 and Ether balances
  let filteredUsers = [];

  if(balanceCriteria.tokenType === "ERC-20") {
    const { tokenAddress } = balanceCriteria

    for(const user of users) {
      const url = `https://api.aleth.io/v1/accounts/${user}/tokenBalances?filter[token]=${tokenAddress}`
      const results = await tokenBalanceFetch(url)
      if(results === 'error') {
        return "error"
      } else {
        const updatedFilteredUsers = await conditionCheck(results, user, balanceCriteria, filteredUsers)
        if(updatedFilteredUsers) {
          filteredUsers = updatedFilteredUsers
        }
      }
    }
  } else {
    for(const user of users) {
      const url = `${ALETHIO_URL}/accounts/${user}`
      const results = await etherBalanceFetch(url)
      const updatedFilteredUsers = await conditionCheck(results, user, balanceCriteria, filteredUsers)
      if(updatedFilteredUsers) {
        filteredUsers = updatedFilteredUsers
      }
    }
  }

  return filteredUsers;
}

export async function fetchTotalTransactions(users) {
  let txCount = 0;
  for(const user of users) {
    const url = `${ALETHIO_URL}/accounts/${user}/transactions`
    const results = await transactionCountFetch(url)

    txCount = txCount + results;
  }

  return txCount;
}

export async function transactionCountFetch(url) {
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${ALETHIO_KEY}` }
  var options = {
    uri: url,
    method: 'GET',
    headers,
    json: true
  }

  const res = await rp(options)
  if(res.data[0].attributes.txNonce) {
    return res.data[0].attributes.txNonce
  } else {
    return 0
  }
}


export async function tokenBalanceFetch(url, tokenAddress) {
  var options = {
    uri: url,
    headers: {Authorization: `Bearer ${ALETHIO_KEY}`},
    json: true
  }

  try {
    const post = await rp(options)
    const data = post.data[0]
    let result = undefined
    if(data) {
      const attributes = data.attributes
      const balance = attributes.balance
      if(attributes && balance) {
        const balanceWeiBN = new BN(balance)

        const decimals = 18
        const decimalsBN = new BN(decimals)
        const divisor = new BN(10).pow(decimalsBN)
        const beforeDecimal = parseFloat(balanceWeiBN.div(divisor))
        result = beforeDecimal
      } else {
        result = 0
      }
    } else {
      result = 0
    }

    return result
  } catch(e) {
    return 0
  }
}

export async function etherBalanceFetch(url) {
  var options = {
    uri: url,
    headers,
    json: true
  }

  try {
    const post = await rp(options)
    const balance = post.data.attributes.balance
    const balanceWeiBN = new BN(balance)

    const decimals = 18
    const decimalsBN = new BN(decimals)
    const divisor = new BN(10).pow(decimalsBN)

    const beforeDecimal = parseFloat(balanceWeiBN.div(divisor))
    return beforeDecimal
  } catch(e) {
    return 0
  }
}

export async function conditionCheck(fetchedAmount, user, conditional, matchingUsers) {
  const { operatorType, amount } = conditional
  new Promise((resolve) => {
    if(operatorType === 'More Than') {
      if(fetchedAmount > parseFloat(amount)) {
        matchingUsers.push(user)
      }
      resolve(matchingUsers)
    } else {
      if(fetchedAmount < parseFloat(amount)) {
        matchingUsers.push(user)
      }

      resolve(matchingUsers)
    }
  })
}

export async function handleEmails(data, url) {
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
