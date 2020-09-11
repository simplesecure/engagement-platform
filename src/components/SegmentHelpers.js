import { setGlobal } from "reactn"
import uuid from "uuid/v4"
import { toast } from "react-toastify"
import { getWeb2Analytics } from "../utils/web2Analytics"
import { runClientOperation } from "../utils/cloudUser.js"
import log from "loglevel"

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
    amount: 0,
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
    amount,
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
      filterToUse.type === "Number Range"
        ? {
            operatorType,
            tokenType,
            tokenAddress: tokenType === "ERC-20" ? tokenAddress : undefined,
            amount,
          }
        : null,
    contractAddress: filterToUse.type === "Contract" ? contractAddress : null,
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

  if (filterToUse.type === "Smart Contract Selection") {
    segmentCriteria = {
      version: '2.0',
      id: uuid(),
      app_id: sessionData.id,
      filter: {
        children: undefined,
        filters: [
          {
            condition: 'event value',
            params: {
              address: contractAddress.toLowerCase(),
              event_name: contractEvent,
              input_name: contractEventInput,
              operator: operatorType,
              value: amount
            }
          }
        ]
      },
      actions: undefined
    }
  } 
  
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
    debugger
    await runClientOperation('addSegment', undefined, sessionData.id, operationData)
  } catch (error) {
    const errorMsg = `Creating segment failed. Please refresh the page and try again.\n` +
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
}


export const updateSegment = async (that) => {
  const {
    sessionData,
    apps,
    allFilters,
  } = that.global
  const { currentSegments } = sessionData
  const {
    conditions,
    listOfAddresses,
    segmentToShow,
    newSegName,
    tokenType,
    tokenAddress,
    filterType,
    rangeType,
    operatorType,
    amount,
    date,
    contractAddress,
    allUsers,
    existingSegmentToFilter,
    dashboardShow,
  } = that.state
  const showOnDashboard = dashboardShow === "Yes" ? true : false
  const filterToUse = allFilters.filter((a) => a.filter === filterType)[0]

  that.setState({ editSegment: false, showSegmentModal: false })

  let addrArray = []
  if (listOfAddresses) {
    addrArray = listToArray(listOfAddresses)
  }

  //First we set the segment criteria to be stored
  const segmentCriteria = {
    firstRun: true,
    appId: sessionData.id,
    showOnDashboard: showOnDashboard,
    id: segmentToShow.id,
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
      filterToUse.type === "Number Range"
        ? {
            operatorType,
            tokenType,
            tokenAddress: tokenType === "ERC-20" ? tokenAddress : undefined,
            amount,
          }
        : null,
    contractAddress: filterToUse.type === "Contract" ? contractAddress : null,
    userCount:
      addrArray.length > 0 ? addrArray.length : segmentToShow.userCount,
    users: segmentToShow.users,
  }

  const { filterConditions } = conditions
  let updatedConditions
  if (filterConditions && filterConditions.length > 0) {
    addFilter(that)
    updatedConditions = that.state.conditions
    that.setState({ conditions: updatedConditions })
    segmentCriteria.conditions = conditions
  } else {
    updatedConditions = {}
    that.setState({ conditions: updatedConditions })
  }
  segmentCriteria["update"] = true
  //Now we fetch the actual results

  //If the segment needs to be process via api, use the segments call
  if (addrArray.length === 0) {
    if (segmentCriteria.filter.type === "web2") {
      //  Send request to web2 analytics handler
      const web2AnalyticsCmdObj = {
        command: "getWeb2Analytics",
        data: {
          appId: sessionData.id,
          event: segmentCriteria.filter.filter.split("Web2: ")[1],
        },
      }
      try {
        const web2AnalyticsData = await getWeb2Analytics(web2AnalyticsCmdObj)
        // console.log(web2AnalyticsData)
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
      } catch (error) {
        console.log(error)
        toast.error(error.message, {
          position: toast.POSITION.TOP_RIGHT,
          autoClose: 2000,
        })
      }
    }
  } else {
    clearState(that)
    segmentCriteria.userCount = addrArray.length
    segmentCriteria.users = addrArray
  }


  const segments = currentSegments ? currentSegments : []

  let thisSegment = segments.filter((a) => a.id === segmentCriteria.id)[0]
  if (thisSegment) {
    thisSegment = segmentCriteria
  }
  const index = segments.findIndex((segment) => {return segment.id === segmentCriteria.id})
  if (index <= -1) {
    throw new Error(`SegmentHelpers::updateSegment: could not find segment to update in data model (id=${thisSegment.id}).\n` +
                    `Please refresh the page and try again. If that fails contact support@simpleid.xyz.\n`)
  }

  segments[index] = thisSegment
  sessionData.currentSegments = segments

  const thisApp = apps[sessionData.id]
  thisApp.currentSegments = segments
  apps[sessionData.id] = thisApp
  clearState(that)

  setGlobal({
    sessionData, apps,
    showSegmentNotification: true,
    segmentProcessingDone: true,
  })


  // Order is important here for the same reason as in crete segment (see above comment in create segment)
  //
  try {
    const operationData = {
      segmentObj: segmentCriteria
    }
    await runClientOperation('updateSegment', undefined, sessionData.id, operationData)
  } catch (error) {
    const errorMsg = `Updating segment failed. Please refresh the page and try again.\n` +
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

}

export const deleteSegment = async (that, seg, confirm) => {
  const method = 'SegmentHelpers::deleteSegment'
  const { sessionData, apps } = that.global
  const { currentSegments } = sessionData
  // console.log(currentSegments)
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
      console.log(consoleErrorMsg)
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
    amount,
    date,
    contractAddress,
    allUsers,
    existingSegmentToFilter,
    dashboardShow,
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
    numberRange:
      filterToUse.type === "Number Range"
        ? {
            operatorType,
            tokenType,
            tokenAddress: tokenType === "ERC-20" ? tokenAddress : undefined,
            amount,
          }
        : null,
    contractAddress: filterToUse.type === "Contract" ? contractAddress : null,
    userCount: addrArray.length > 0 ? addrArray.length : null,
  }
  let { filterConditions } = conditions
  const thisOperator = operator ? operator : "And"
  that.setState({ operator: thisOperator })

  conditions["operator"] = thisOperator
  conditions["showOnDashboard"] = showOnDashboard
  if (condition && condition.id) {
    console.log(condition)
    const index = filterConditions
      .map((condition) => condition.id)
      .indexOf(condition.id)
    if (index > -1) {
      filterConditions[index] = segmentCriteria
    } else {
      console.log("Error with index")
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
