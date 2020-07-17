import { setGlobal } from "reactn"
import { setLocalStorage } from "../utils/misc"
import uuid from "uuid/v4"
import { toast } from "react-toastify"
import * as dc from "./../utils/dynamoConveniences.js"
import { getWeb2Analytics } from "../utils/web2Analytics"
import { getCloudUser } from "./../utils/cloudUser.js"
import { runClientOperation } from "../utils/dataProcessing"

const listToArray = require("list-to-array")

// const updateOrgData = async (that, apps) => {
//   const { org_id, SESSION_FROM_LOCAL, sessionData } = that.global
//   // Put the new segment in the analytics data for the user signed in to this
//   // id:
//   //      Each App (SimpleID Customer) will have an app_id
//   //      Each App can have multiple Customer Users (e.g. Cody at Lens and one of his Minions)
//   //      A segment will be stored in the DB under the primary key 'app_id' in
//   //      the appropriate user_id's segment storage:

//   // TODO: probably want to wait on this to finish and throw a status/activity
//   //       bar in the app:
//   const orgData = await dc.organizationDataTableGet(org_id)

//   try {
//     const anObject = orgData.Item
//     anObject.apps = apps
//     anObject[process.env.REACT_APP_ORG_TABLE_PK] = org_id
//     await dc.organizationDataTablePut(anObject)
//     setLocalStorage(SESSION_FROM_LOCAL, JSON.stringify(sessionData))
//     setGlobal({ showSegmentNotification: true, segmentProcessingDone: true })
//   } catch (suppressedError) {
//     const ERROR_MSG =
//       "There was a problem creating the segment, please try again. If the problem continues, contact support@simpleid.xyz."
//     setGlobal({ error: ERROR_MSG })
//     console.log(`ERROR: problem writing to DB.\n${suppressedError}`)
//   }
// }

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
  const { sessionData, apps, allFilters, SESSION_FROM_LOCAL } = that.global
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
  const segmentCriteria = {
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

  toast.success(
    "Creating Segments. You'll get a notification when it's complete.",
    {
      position: toast.POSITION.TOP_RIGHT,
      autoClose: 3000,
    }
  )
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
        const segments = currentSegments ? currentSegments : []
        segments.push(segmentCriteria)
        sessionData.currentSegments = segments

        const thisApp = apps[sessionData.id]
        thisApp.currentSegments = segments
        apps[sessionData.id] = thisApp
        clearState(that)
        setGlobal({ sessionData, apps })

        // Replacing this:
        //   updateOrgData(apps)
        //
        // with clientCommand:
        const operationData = {
          segmentObj: segmentCriteria
        }
        await runClientOperation('createSegment', undefined, sessionData.id, operationData)
        setLocalStorage(SESSION_FROM_LOCAL, JSON.stringify(sessionData))
        setGlobal({ showSegmentNotification: true, segmentProcessingDone: true })
        // End Replacing
      } catch (error) {
        console.log(error)
        toast.error(error.message, {
          position: toast.POSITION.TOP_RIGHT,
          autoClose: 2000,
        })
      }
    } else {
      try {
        // Replacing this:
        //
        // getCloudUser().processData("segment", segmentCriteria)
        //
        // with clientCommand:
        //
        const operationData = {
          segmentObj: segmentCriteria
        }
        await runClientOperation('createSegment', undefined, sessionData.id, operationData)
        //
        // TODO: segment command on the server might do more things that we need to look at.
        // TODO: make the cloud user handling of "segment" and dataProcesing handling of "segment"
        //       go away.
        // TODO: make the bizarre queue stuff go away if possible too.
        //
        clearState(that)
      } catch (e) {
        console.log(e)
      }
    }
  } else {
    clearState(that)
    segmentCriteria.userCount = addrArray.length
    segmentCriteria.users = addrArray
    segmentCriteria.userCount = addrArray.length
    const segments = currentSegments ? currentSegments : []
    segments.push(segmentCriteria)
    sessionData.currentSegments = segments

    const thisApp = apps[sessionData.id]
    thisApp.currentSegments = segments
    apps[sessionData.id] = thisApp
    clearState(that)
    setGlobal({ sessionData, apps })

    // Replacing this:
    //   updateOrgData(apps)
    //
    // with clientCommand:
    const operationData = {
      segmentObj: segmentCriteria
    }
    await runClientOperation('createSegment', undefined, sessionData.id, operationData)
    setLocalStorage(SESSION_FROM_LOCAL, JSON.stringify(sessionData))
    setGlobal({ showSegmentNotification: true, segmentProcessingDone: true })
    // End Replacing
  }
}


export const updateSegment = async (that) => {
  const {
    sessionData,
    apps,
    org_id,
    SESSION_FROM_LOCAL,
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

  //If the segment needs to be process via api, use the processData call
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
        const segments = currentSegments ? currentSegments : []
        segments.push(segmentCriteria)
        sessionData.currentSegments = segments

        const thisApp = apps[sessionData.id]
        thisApp.currentSegments = segments
        apps[sessionData.id] = thisApp
        clearState(that)
        setGlobal({ sessionData, apps })

        // Replacing this:
        //   updateOrgData(apps)
        //
        // with clientCommand:
        const operationData = {
          segmentObj: segmentCriteria
        }
        await runClientOperation('updateSegment', undefined, sessionData.id, operationData)
        setLocalStorage(SESSION_FROM_LOCAL, JSON.stringify(sessionData))
        setGlobal({ showSegmentNotification: true, segmentProcessingDone: true })
        // End Replacing
      } catch (error) {
        console.log(error)
        toast.error(error.message, {
          position: toast.POSITION.TOP_RIGHT,
          autoClose: 2000,
        })
      }
    } else {
      try {
        // Replacing this:
        //
        // getCloudUser().processData("segment", segmentCriteria)
        //
        // with clientCommand:
        //
        const operationData = {
          segmentObj: segmentCriteria
        }
        await runClientOperation('updateSegment', undefined, sessionData.id, operationData)
        //
        // TODO: segment command on the server might do more things that we need to look at.
        // TODO: make the cloud user handling of "segment" and dataProcesing handling of "segment"
        //       go away.
        // TODO: make the bizarre queue stuff go away if possible too.
        //
        clearState(that)
      } catch (e) {
        console.log(e)
      }
    }
  } else {
    clearState(that)
    segmentCriteria.userCount = addrArray.length
    segmentCriteria.users = addrArray
    segmentCriteria.userCount = addrArray.length
    const segments = currentSegments ? currentSegments : []
    let thisSegment = segments.filter((a) => a.id === segmentCriteria.id)[0]
    if (thisSegment) {
      thisSegment = segmentCriteria
    }
    const index = await segments
      .map((x) => {
        return x.id
      })
      .indexOf(segmentCriteria.id)
    if (index > -1) {
      segments[index] = thisSegment
    } else {
      console.log("Error with index, not updating")
    }
    sessionData.currentSegments = segments

    const thisApp = apps[sessionData.id]
    thisApp.currentSegments = segments
    apps[sessionData.id] = thisApp
    clearState(that)
    setGlobal({ sessionData, apps })

    // Replace this db update:
    //
    // const orgData = await dc.organizationDataTableGet(org_id)
    try {
      // const anObject = orgData.Item
      // anObject.apps = apps
      // anObject[process.env.REACT_APP_ORG_TABLE_PK] = org_id
      // await dc.organizationDataTablePut(anObject)
      //
      // With this server call:
      //
      const operationData = {
        segmentObj: segmentCriteria
      }
      await runClientOperation('updateSegment', undefined, sessionData.id, operationData)
      // End replace

      setLocalStorage(SESSION_FROM_LOCAL, JSON.stringify(sessionData))
      setGlobal({
        showSegmentNotification: true,
        segmentProcessingDone: true,
      })
    } catch (suppressedError) {
      const ERROR_MSG =
        "There was a problem creating the segment, please try again. If the problem continues, contact support@simpleid.xyz."
      setGlobal({ error: ERROR_MSG })
      console.log(`ERROR: problem writing to DB.\n${suppressedError}`)
    }
  }
}

export const deleteSegment = async (that, seg, confirm) => {
  const { sessionData, SESSION_FROM_LOCAL, apps, org_id } = that.global
  const { currentSegments } = sessionData
  // console.log(currentSegments)
  that.setState({ seg })
  if (confirm) {
    const index = currentSegments.map((a) => a.id).indexOf(seg.id)
    if (index > -1) {
      currentSegments.splice(index, 1)
      sessionData.currentSegments = currentSegments
      //Update in DB  <-- I think he means local storage
      const thisApp = apps[sessionData.id]
      thisApp.currentSegments = currentSegments
      setGlobal({ sessionData, apps })

      // Replacing this db update:
      //
      // const orgData = await dc.organizationDataTableGet(org_id)
      // try {
      //   const anObject = orgData.Item
      //   anObject.apps = apps
      //   anObject[process.env.REACT_APP_ORG_TABLE_PK] = org_id
      //   await dc.organizationDataTablePut(anObject)
      // } catch (suppressedError) {
      //   console.log(`ERROR: problem writing to DB.\n${suppressedError}`)
      // }
      // With this server call
      //
        const operationData = {
          segmentId: seg.id
        }
        await runClientOperation('deleteSegment', undefined, sessionData.id, operationData)
      //
      // End replace

      setLocalStorage(SESSION_FROM_LOCAL, JSON.stringify(sessionData))
      that.setState({ show: false })
    } else {
      console.log("Error with index")
    }
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
