import { setGlobal } from "reactn"
import uuid from "uuid/v4"
import { toast } from "react-toastify"
import { getWeb2Analytics } from "../utils/web2Analytics"
import { runClientOperation } from "../utils/cloudUser.js"
import { getLog } from './../utils/debugScopes'

const log = getLog('segmentHelpers')
const listToArray = require("list-to-array")

export const clearState = (that, filter=false) => {
  if (!filter) {
    that.setState({
      conditions: {}
    })
  }
  that.setState({
    tokenType: "",
    newSegName: "",
    filterType: "",
    contractAddress: "",
    tokenAddress: "",
    rangeType: "",
    operatorType: "",
    date: new Date(),
    listOfAddresses: "",
    showSegmentModal: false,
    editSegment: false,
    isCreateSegment: false
  });
}

export const createSegment = async (that) => {
  const { sessionData, apps, allFilters } = that.global
  const { currentSegments, network } = sessionData
  const {
    listOfAddresses,
    newSegName,
    tokenType,
    tokenAddress,
    filterType,
    rangeType,
    operatorType,
    walletAmount,
    date,
    contractAddress,
    allUsers,
    existingSegmentToFilter,
    dashboardShow,
    contractEventInput,
    contractEvent
  } = that.state
  let { conditions } = that.state
  let { filterConditions } = conditions
  const showOnDashboard = dashboardShow === "Yes" ? true : false

  const filterToUse = allFilters.filter((a) => a.filter === filterType)[0]
  const segId = uuid()
  let addrArray = []
  if (listOfAddresses) {
    addrArray = listToArray(listOfAddresses)
  }
  let segmentCriteria = {
    firstRun: true,
    appId: sessionData.id,
    network,
    showOnDashboard: showOnDashboard,
    id: segId,
    name: newSegName,
    startWithExisting: !allUsers,
    existingSegmentToFilter:
      allUsers === false ? existingSegmentToFilter : null,
    conditions: conditions && conditions.id ? conditions : undefined,
    filter: filterToUse,
    dateRange:
      filterToUse.type === "Date Range"
        ? {
            rangeType,
            date: Date.parse(date),
          }
        : null,
    numberRange:
      filterToUse.type === "Wallet Balance"
        ? {
            operatorType,
            tokenType,
            tokenAddress: tokenType === "ERC-20" ? tokenAddress : undefined,
            walletAmount,
          }
        : null,
    contractAddress: filterToUse.type === "Smart Contract Transactions" ? contractAddress : null,
    userCount: addrArray.length > 0 ? addrArray.length : null,
  }

  setGlobal({
    showSegmentNotification: true,
    segmentProcessingDone: false,
    segmentName: segmentCriteria.name,
  })

  // toast.success(
  //   "Creating Segments: you will see it go active below when it's finished processing.",
  //   {
  //     position: toast.POSITION.TOP_RIGHT,
  //     autoClose: 3000,
  //   }
  // )
  if (filterConditions && filterConditions.length > 0) {
    addFilter(that)
    conditions = that.state.conditions
    that.setState({ conditions })
    segmentCriteria.conditions = conditions
    //  TODO handle multiple conditions that include web2 analytics
  }

  if (addrArray.length === 0) {
    //  Quick solution for the web2 analytics stuff. Will break on multiple conditions though. See todo above
    if (segmentCriteria.filter.type === "web2") {
      //  Send request to web2 analytics handler
      const web2AnalyticsCmdObj = {
        command: "getWeb2Analytics",
        data: {
          appId: sessionData.id,
          event: segmentCriteria.filter.filter.split("Web2: ")[1],
        },
      }

      const web2AnalyticsData = await getWeb2Analytics(web2AnalyticsCmdObj)

      const data = web2AnalyticsData.data
      let userCount
      let users
      if (data) {
        userCount = data.length
        users = data
      } else {
        userCount = 0
        users = []
      }
      segmentCriteria.userCount = userCount
      segmentCriteria.users = users
    }
  } else {
    clearState(that)
    segmentCriteria.userCount = addrArray.length
    segmentCriteria.users = addrArray
  }

  //should eventually move to this..........
  segmentCriteria = createNewSegmentCriteria(that, segmentCriteria)
  
  const segments = currentSegments ? currentSegments : []
  segments.push(segmentCriteria)
  sessionData.currentSegments = segments

  const thisApp = apps[sessionData.id]
  thisApp.currentSegments = segments
  apps[sessionData.id] = thisApp
  clearState(that)
  setGlobal({ sessionData, apps, showSegmentNotification: true, segmentProcessingDone: true })
  
  // Order is important here -- the code below modifies the empty segment we add above, if it were earlier,
  // then you would see two segments until a real-time update or refresh.
  try {
    const operationData = {
      segmentObj: segmentCriteria
    }
    await runClientOperation('addSegment', undefined, sessionData.id, operationData)
  } catch (error) {
    const errorMsg = `Creating segment failed. Please refresh the page and try again.\n` +
                      `If that fails, contact support@simpleid.xyz.\n`
    const userErrorMsg = errorMsg +
                          `More detailed error information appears in the browser's console.\n`
    const consoleErrorMsg = errorMsg +
                            error.message
    log.error(consoleErrorMsg)
    toast.error(userErrorMsg, {
      position: toast.POSITION.TOP_RIGHT,
      autoClose: 2000,
    })
    return
  }
}

function _ethToWei(anEthValue) {
  // TODO: Prabhaav, is this correct:
  //
  //          weiPerEth =  1,000,000,000,000,000,000 
  //
  // TODO: Prabhaav, numbers this large have to use BigInt (the 'n' at the end
  //       of the literal below signifies to js to type it as a bigint).
  //       All the things downstream have to use BigInt to capture it and return
  //       it or you get failures like:
  //
  //        Unhandled Rejection (TypeError): Cannot mix BigInt and other types, use explicit conversions
  //
  //  const weiPerEth =  1000000000000000000n 
  //
  //  If you're wondering why you need to use BigInt it's b/c:
  //
  //        Numeric literals with absolute values equal to 2^53 or greater are too large to be represented accurately as integers.ts(80008)
  //
  const wrongWeiPerEth = 1000     // <-- TODO Prabhaav make this the constant above and fix all errors
  const weiPerEth = wrongWeiPerEth
  const weiValue = anEthValue * weiPerEth
  return weiValue
}

export const createNewSegmentCriteria = (that, segmentCriteria) => {
  const { allFilters, contractData } = that.global
  let {
    tokenAddress,
    operatorType,
    contractAddress,
    contractEventInput,
    contractEvent,
    filterType,
    walletAmount,
    walletAmountType,
    eventAmount,
    eventAmountType,
  } = that.state
  let { conditions } = that.state
  const { filterConditions } = conditions
  let filterToUse = allFilters.filter((a) => a.filter === filterType)[0]
  let filters = []
  if (filterConditions && filterConditions.length) {
    filterConditions.forEach(f => {
      filterToUse = f.filter
      if (f.walletBalance) {
        if (walletAmountType === 'eth') {
          walletAmount = _ethToWei(f.walletBalance.walletAmount)
        }
        else {
          walletAmount = f.walletBalance.walletAmount
        }
        walletAmountType = f.walletBalance.walletAmountType
        operatorType = f.walletBalance.operatorType
        tokenAddress = f.walletBalance.tokenAddress
      }
      else if (f.contractEvent) {
        if (eventAmountType === 'eth') {
          eventAmount = _ethToWei(f.contractEvent.eventAmount)
        }
        else {
          eventAmount = f.contractEvent.eventAmount
        }
        eventAmountType = f.contractEvent.eventAmountType
        operatorType = f.contractEvent.operatorType
        contractEvent = f.contractEvent.contractEvent
        contractEventInput = f.contractEvent.contractEventInput
        contractAddress = f.contractEvent.contractAddress
      }
      else if (f.contractAddress) {
        contractAddress = f.contractAddress
      }
      filters = addFiltersForNewSegmentCriteria(
        contractData,
        filters,
        filterToUse,
        tokenAddress,
        operatorType,
        walletAmount,
        walletAmountType,
        eventAmount,
        eventAmountType,
        contractAddress,
        contractEventInput,
        contractEvent
      )
    })
  }
  else {
    if (walletAmountType === 'eth') {
      walletAmount = _ethToWei(walletAmount)
    }
    if (eventAmountType === 'eth') {
      eventAmount = _ethToWei(eventAmount)
    }
    filters = addFiltersForNewSegmentCriteria(
      contractData,
      filters,
      filterToUse,
      tokenAddress,
      operatorType,
      walletAmount,
      walletAmountType,
      eventAmount,
      eventAmountType,
      contractAddress,
      contractEventInput,
      contractEvent
    )
  }
  segmentCriteria.version = '2.0'
  segmentCriteria.logic = conditions.operator ? conditions.operator.toLowerCase() : 'and'
  segmentCriteria.actions = undefined
  segmentCriteria.filter = {
    children: undefined
  }
  segmentCriteria.filters = filters
  return segmentCriteria
}

export const addFiltersForNewSegmentCriteria = (
  contractData,
  filters,
  filterToUse,
  tokenAddress,
  operatorType,
  walletAmount,
  walletAmountType,
  eventAmount,
  eventAmountType,
  contractAddress,
  contractEventInput,
  contractEvent ) => {
  if (filterToUse.filter === "Smart Contract Events") {
    let implementation_address = ''
    let proxy_address = ''
    const idx = Object.keys(contractData).find(key => contractAddress === contractData[key].address)
    if (contractData[idx] && contractData[idx].proxy_contract) {
      implementation_address = contractAddress
      proxy_address = contractData[idx].proxy_contract
    }
    else {
      implementation_address = contractAddress
      proxy_address = contractAddress
    }
    filters.push(
      {
        type: 'event',
        params: {
          contract_address: contractAddress.toLowerCase(),
          implementation_address,
          proxy_address,
          event_name: contractEvent,
          input_name: contractEventInput,
          operator: operatorType,
          value: eventAmount,
          eventAmountType
        }
      }
    )
  } else if (filterToUse.filter === "Wallet Balance") {
    filters.push(
      {
        type: 'balance',
        params: {
          tokenAddress,
          operator: operatorType,
          value: walletAmount,
          walletAmountType
        }
      }
    )
  } else if (filterToUse.filter === "Smart Contract Transactions") {
    filters.push(
      {
        type: 'transaction',
        params: {
          contract_address: contractAddress.toLowerCase()
        }
      }
    )
  }
  return filters
}

export const deleteSegment = async (that, seg, confirm) => {
  const method = 'SegmentHelpers::deleteSegment'
  const { sessionData, apps } = that.global
  const { currentSegments } = sessionData
  // log.debug(currentSegments)
  that.setState({ seg })
  if (confirm) {
    const index = currentSegments.map((a) => a.id).indexOf(seg.id)
    if (index <= -1) {
      throw new Error(`${method}: could not find segment to delete in data model (id=${seg.id}).\n` +
                      `Please refresh the page and try again. If that fails contact support@simpleid.xyz.\n`)
    }

    try {
      const operationData = {
        segmentId: seg.id
      }
      await runClientOperation('deleteSegment', undefined, sessionData.id, operationData)
    } catch (error) {
      const errorMsg = `Deleting segment failed. Please refresh the page and try again.\n` +
                       `If that fails, contact support@simpleid.xyz.\n`
      const userErrorMsg = errorMsg +
                          `More detailed error information appears in the browser's console.\n`
      const consoleErrorMsg = errorMsg +
                              error.message
      log.error(consoleErrorMsg)
      toast.error(userErrorMsg, {
        position: toast.POSITION.TOP_RIGHT,
        autoClose: 2000,
      })
      return
    }

    currentSegments.splice(index, 1)
    sessionData.currentSegments = currentSegments
    //Update in DB  <-- I think he means local storage
    const thisApp = apps[sessionData.id]


    thisApp.currentSegments = currentSegments
    setGlobal({ sessionData, apps })

    that.setState({ show: false })
  } else {
    that.setState({ show: true })
  }
}

export const addFilter = (that, condition) => {
  const { allFilters } = that.global
  const {
    conditions,
    operator,
    listOfAddresses,
    tokenType,
    tokenAddress,
    filterType,
    rangeType,
    operatorType,
    date,
    contractAddress,
    allUsers,
    existingSegmentToFilter,
    dashboardShow,
    contractEvent,
    contractEventInput,
    walletAmount,
    walletAmountType,
    eventAmount,
    eventAmountType,
  } = that.state
  const showOnDashboard = dashboardShow === "Yes" ? true : false
  const filterToUse = allFilters.filter((a) => a.filter === filterType)[0]
  let addrArray = []

  if (listOfAddresses) {
    addrArray = listToArray(listOfAddresses)
  }

  //First we set the segment criteria to be stored
  const segmentCriteria = {
    id: uuid(),
    startWithExisting: !allUsers,
    existingSegmentToFilter:
      allUsers === false ? existingSegmentToFilter : null,
    filter: filterToUse,
    dateRange:
      filterToUse.type === "Date Range"
        ? {
            rangeType,
            date: Date.parse(date),
          }
        : null,
    walletBalance:
      filterToUse.type === "Wallet Balance"
        ? {
            operatorType,
            tokenType,
            tokenAddress,
            walletAmount,
            walletAmountType
          }
        : null,
    contractEvent:
      filterToUse.type === "Smart Contract Events"
        ? {
          contractAddress,
          contractEvent,
          contractEventInput,
          operatorType,
          eventAmount,
          eventAmountType
        } : null,
    contractAddress: filterToUse.type === "Smart Contract Transactions" ? contractAddress : null,
    userCount: addrArray.length > 0 ? addrArray.length : null,
  }
  let { filterConditions } = conditions
  const thisOperator = operator ? operator : "and"
  that.setState({ operator: thisOperator })

  conditions["operator"] = thisOperator
  conditions["showOnDashboard"] = showOnDashboard
  if (condition && condition.id) {
    log.debug(condition)
    const index = filterConditions
      .map((condition) => condition.id)
      .indexOf(condition.id)
    if (index > -1) {
      filterConditions[index] = segmentCriteria
    } else {
      log.error("Error with index")
    }
  } else {
    if (filterConditions) {
      filterConditions.push(segmentCriteria)
    } else {
      filterConditions = []
      filterConditions.push(segmentCriteria)
    }
  }

  conditions["filterConditions"] = filterConditions
  // clearState(that, true)
}
