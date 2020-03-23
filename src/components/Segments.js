import React, { setGlobal } from 'reactn'
import StickyNav from './StickyNav'
import Modal from 'react-bootstrap/Modal'
import Table from 'react-bootstrap/Table'
import Card from 'react-bootstrap/Card'
import InputGroup from 'react-bootstrap/InputGroup'
import FormControl from 'react-bootstrap/FormControl'
import SegmentTable from './SegmentTable'
import { putInOrganizationDataTable, getFromOrganizationDataTable } from '../utils/awsUtils.js'
import filters from '../utils/filterOptions.json'
import DatePicker from 'react-date-picker'
import uuid from 'uuid/v4'
import { setLocalStorage } from '../utils/misc'
import LoadingModal from './LoadingModal'
import { getCloudUser } from './../utils/cloudUser.js'
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
const listToArray = require('list-to-array')

export default class Segments extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      show: false,
      seg: "",
      existingSeg: false,
      allUsers: true,
      filterType: "Choose...",
      rangeType: "Before",
      operatorType: "More Than",
      newSegName: "",
      date: new Date(),
      amount: 0,
      contractAddress: "",
      existingSegmentToFilter: "Choose...",
      tokenType: "Ether",
      tokenAddress: "",
      showSegmentModal: false,
      segmentToShow: {},
      dashboardShow: "Yes",
      loadingMessage: "Creating segment",
      listOfAddresses: "",
      operator: "",
      conditions: {},
      condition: {},
      importModalOpen: false,
      importAddress: ""
    }
  }

  deleteSegment = async(seg, confirm) => {
    const { sessionData, SESSION_FROM_LOCAL, apps, org_id } = this.global
    const { currentSegments } = sessionData
    this.setState({ seg })
    if(confirm) {
      const index = currentSegments.map(a => a.id).indexOf(seg.id)
      if(index > -1) {
        currentSegments.splice(index, 1)
        sessionData.currentSegments = currentSegments
        //Update in DB
        const thisApp = apps[sessionData.id]
        thisApp.currentSegments = currentSegments
        setGlobal({ sessionData, apps })
        const orgData = await getFromOrganizationDataTable(org_id)

        try {
          const anObject = orgData.Item
          anObject.apps = apps
          anObject[process.env.REACT_APP_ORG_TABLE_PK] = org_id
          await putInOrganizationDataTable(anObject)
        } catch (suppressedError) {
          console.log(`ERROR: problem writing to DB.\n${suppressedError}`)
        }

        setLocalStorage(SESSION_FROM_LOCAL, JSON.stringify(sessionData))
        this.setState({ show: false })
      } else {
        console.log("Error with index")
      }
    } else {
      this.setState({ show: true })
    }
  }

  closeModal = () => {
    this.setState({ show: false })
  }

  clearState = () => {
    this.setState({
      conditions: {},
      tokenType: "Ether",
      newSegName: "",
      filterType: "Choose...",
      contractAddress: "",
      tokenAddress: "",
      rangeType: "Before",
      operatorType: "More Than",
      date: new Date(),
      amount: 0,
      listOfAddresses: ""
    })
  }

  createSegment = async () => {
    const { sessionData, apps, org_id, SESSION_FROM_LOCAL } = this.global
    const { currentSegments } = sessionData
    const { listOfAddresses, newSegName, tokenType, tokenAddress, filterType, rangeType, operatorType, amount, date, contractAddress, allUsers, existingSegmentToFilter, dashboardShow } = this.state
    let { conditions } = this.state
    let { filterConditions } = conditions
    const showOnDashboard = dashboardShow === "Yes" ? true : false

    const filterToUse = filters.filter(a => a.filter === filterType)[0]
    const segId = uuid()
    let addrArray = []
    if(listOfAddresses) {
      addrArray = listToArray(listOfAddresses)
    }
    const segmentCriteria = {
      appId: sessionData.id,
      showOnDashboard: showOnDashboard,
      id: segId,
      name: newSegName,
      startWithExisting: !allUsers,
      existingSegmentToFilter: allUsers === false ? existingSegmentToFilter : null,
      conditions: conditions && conditions.id ? conditions : undefined,
      filter: filterToUse,
      dateRange: filterToUse.type === "Date Range" ? {
        rangeType,
        date: Date.parse(date)
      } : null,
      numberRange: filterToUse.type === "Number Range" ? {
        operatorType,
        tokenType,
        tokenAddress: tokenType === "ERC-20" ? tokenAddress : undefined,
        amount
      } : null,
      contractAddress: filterToUse.type === "Contract" ? contractAddress : null,
      userCount: addrArray.length > 0 ? addrArray.length : null
    }

    setGlobal({ showSegmentNotification: true, segmentProcessingDone: false, segmentName: segmentCriteria.name })
    toast.success("Creating Segments. You'll get a notification when it's complete.", {
      position: toast.POSITION.TOP_RIGHT,
      autoClose: 3000
    })
    if(filterConditions && filterConditions.length > 0) {
      this.addFilter()
      conditions = this.state.conditions
      this.setState({ conditions })
      segmentCriteria.conditions = conditions
    }

    //Now we fetch the actual results

    //If the segment needs to be process via api, use the processData call
    if(addrArray.length === 0) {
      try {
        getCloudUser().processData('segment', segmentCriteria)
        this.clearState()
      } catch(e) {
        console.log(e)
      }
    } else {
      this.clearState()
      segmentCriteria.userCount = addrArray.length
      segmentCriteria.users = addrArray
      segmentCriteria.userCount = addrArray.length
      const segments = currentSegments ? currentSegments : []
      segments.push(segmentCriteria)
      sessionData.currentSegments = segments

      const thisApp = apps[sessionData.id]
      thisApp.currentSegments = segments
      apps[sessionData.id] = thisApp
      this.clearState()
      setGlobal({ sessionData, apps })
      // Put the new segment in the analytics data for the user signed in to this
      // id:
      //      Each App (SimpleID Customer) will have an app_id
      //      Each App can have multiple Customer Users (e.g. Cody at Lens and one of his Minions)
      //      A segment will be stored in the DB under the primary key 'app_id' in
      //      the appropriate user_id's segment storage:


      // TODO: probably want to wait on this to finish and throw a status/activity
      //       bar in the app:
      const orgData = await getFromOrganizationDataTable(org_id)

      try {
        const anObject = orgData.Item
        anObject.apps = apps
        anObject[process.env.REACT_APP_ORG_TABLE_PK] = org_id
        await putInOrganizationDataTable(anObject)
        setLocalStorage(SESSION_FROM_LOCAL, JSON.stringify(sessionData))
        setGlobal({ showSegmentNotification: true, segmentProcessingDone: true })
      } catch (suppressedError) {
        const ERROR_MSG = "There was a problem creating the segment, please try again. If the problem continues, contact support@simpleid.xyz."
        setGlobal({ error: ERROR_MSG })
        console.log(`ERROR: problem writing to DB.\n${suppressedError}`)
      }
    }
  }

  updateSegment = async () => {
    const { sessionData, apps, org_id, SESSION_FROM_LOCAL } = this.global
    const { currentSegments } = sessionData
    const { conditions, listOfAddresses, segmentToShow, newSegName, tokenType, tokenAddress, filterType, rangeType, operatorType, amount, date, contractAddress, allUsers, existingSegmentToFilter, dashboardShow } = this.state
    const showOnDashboard = dashboardShow === "Yes" ? true : false
    const filterToUse = filters.filter(a => a.filter === filterType)[0]

    this.setState({ editSegment: false, showSegmentModal: false })

    let addrArray = []
    if(listOfAddresses) {
      addrArray = listToArray(listOfAddresses)
    }

    //First we set the segment criteria to be stored
    const segmentCriteria = {
      appId: sessionData.id,
      showOnDashboard: showOnDashboard,
      id: segmentToShow.id,
      name: newSegName,
      startWithExisting: !allUsers,
      existingSegmentToFilter: allUsers === false ? existingSegmentToFilter : null,
      conditions: conditions && conditions.id ? conditions : undefined,
      filter: filterToUse,
      dateRange: filterToUse.type === "Date Range" ? {
        rangeType,
        date: Date.parse(date)
      } : null,
      numberRange: filterToUse.type === "Number Range" ? {
        operatorType,
        tokenType,
        tokenAddress: tokenType === "ERC-20" ? tokenAddress : undefined,
        amount
      } : null,
      contractAddress: filterToUse.type === "Contract" ? contractAddress : null,
      userCount: addrArray.length > 0 ? addrArray.length : segmentToShow.userCount,
      users: segmentToShow.users
    }

    const { filterConditions } = conditions
    let updatedConditions
    if(filterConditions && filterConditions.length > 0) {
      this.addFilter()
      updatedConditions = this.state.conditions
      this.setState({ conditions: updatedConditions })
      segmentCriteria.conditions = conditions
    } else {
      updatedConditions = {}
      this.setState({ conditions: updatedConditions })
    }
    segmentCriteria['update'] = true
    //Now we fetch the actual results

    //If the segment needs to be process via api, use the processData call
    if(addrArray.length === 0) {
      try {
        getCloudUser().processData('segment', segmentCriteria)
        this.clearState()
      } catch(e) {
        console.log(e)
      }
    } else {
      this.clearState()
      segmentCriteria.userCount = addrArray.length
      segmentCriteria.users = addrArray
      segmentCriteria.userCount = addrArray.length
      const segments = currentSegments ? currentSegments : []
      let thisSegment = segments.filter(a => a.id === segmentCriteria.id)[0]
      if(thisSegment) {
        thisSegment = segmentCriteria
      }
      const index = await segments.map((x) => {return x.id }).indexOf(segmentCriteria.id)
      if(index > -1) {
        segments[index] = thisSegment
      } else {
        console.log("Error with index, not updating")
      }
      sessionData.currentSegments = segments

      const thisApp = apps[sessionData.id]
      thisApp.currentSegments = segments
      apps[sessionData.id] = thisApp
      this.clearState()
      setGlobal({ sessionData, apps })
      // Put the new segment in the analytics data for the user signed in to this
      // id:
      //      Each App (SimpleID Customer) will have an app_id
      //      Each App can have multiple Customer Users (e.g. Cody at Lens and one of his Minions)
      //      A segment will be stored in the DB under the primary key 'app_id' in
      //      the appropriate user_id's segment storage:


      // TODO: probably want to wait on this to finish and throw a status/activity
      //       bar in the app:
      const orgData = await getFromOrganizationDataTable(org_id)

      try {
        const anObject = orgData.Item
        anObject.apps = apps
        anObject[process.env.REACT_APP_ORG_TABLE_PK] = org_id
        await putInOrganizationDataTable(anObject)
        setLocalStorage(SESSION_FROM_LOCAL, JSON.stringify(sessionData))
        setGlobal({ showSegmentNotification: true, segmentProcessingDone: true })
      } catch (suppressedError) {
        const ERROR_MSG = "There was a problem creating the segment, please try again. If the problem continues, contact support@simpleid.xyz."
        setGlobal({ error: ERROR_MSG })
        console.log(`ERROR: problem writing to DB.\n${suppressedError}`)
      }
    }
  }

  handleDateChange = (date) => {
    console.log("CHANGING DATE...", date)
    this.setState({ date })
  }

  handleSegmentModal = (seg) => {
    this.setState({ segmentToShow: seg, showSegmentModal: true })
  }

  handleEditSegment = async (seg, singleCondition) => {
    //  This function is re-used across both the edit segment functionality and the edit signle criteria functionality
    //  So we need to know a few things:
    //  We need to know if this is a singleCondition being edited (see singleCondition param)
    //  We need to know the segment or condition (represented by seg param)
    //  If this is a single condition in a filter, we need to set state appropriately (see the condition state variable below)

    await this.setState({ segmentToShow: seg, condition: singleCondition ? seg : undefined })
    const { segmentToShow, tokenAddress, contractAddress, filterType, operatorType, amount, rangeType, tokenType } = this.state
    let thisSeg = segmentToShow
    if(seg.conditions && seg.conditions.filterConditions && seg.conditions.filterConditions.length > 0) {
      await this.setState({ conditions: seg.conditions })
      const { filterConditions } = seg.conditions
      const lastCondition = filterConditions[filterConditions.length - 1]
      const index = filterConditions.map(condition => condition.id).indexOf(lastCondition.id)
      thisSeg = lastCondition
      if(index > -1) {
        filterConditions.splice(index, 1)
        let conditions = seg.conditions
        conditions['filterConditions'] = filterConditions
        await this.setState({ conditions: conditions })
      } else {
        console.log("Error with index")
      }
    }

    const filterToUse = filters.filter(a => a.filter === thisSeg.filter.filter)[0]

    this.setState({
      showSegmentModal: false,
      editSegment: true,
      newSegName: segmentToShow.name,
      contractAddress: thisSeg.contractAddress || contractAddress,
      filterType: filterToUse.filter || filterType,
      rangeType: thisSeg.dateRange ? thisSeg.dateRange.rangeType : rangeType,
      operatorType: thisSeg.numberRange ? thisSeg.numberRange.operatorType : operatorType,
      amount: thisSeg.numberRange ? thisSeg.numberRange.amount : amount,
      tokenType: thisSeg.numberRange ? thisSeg.numberRange.tokenType : tokenType,
      tokenAddress: thisSeg.numberRange ? thisSeg.numberRange.tokenAddress : tokenAddress,
      listOfAddresses: thisSeg.filter.type === "Paste" ? thisSeg.users.join(',') : ""
    })
  }

  handleCloseSegmentModal = () => {
    this.setState({
      showSegmentModal: false,
      editSegment: false
    })
    this.clearState()
  }

  handleRefreshData = async () => {
    toast.success("Refreshing Dashboard Data...", {
      position: toast.POSITION.TOP_RIGHT,
      autoClose: 2000
    })
    getCloudUser().fetchOrgDataAndUpdate()
  }

  addFilter = (condition) => {
    const { conditions, operator, listOfAddresses, tokenType, tokenAddress, filterType, rangeType, operatorType, amount, date, contractAddress, allUsers, existingSegmentToFilter, dashboardShow } = this.state
    const showOnDashboard = dashboardShow === "Yes" ? true : false
    const filterToUse = filters.filter(a => a.filter === filterType)[0]
    let addrArray = []

    if(listOfAddresses) {
      addrArray = listToArray(listOfAddresses)
    }

    //First we set the segment criteria to be stored
    const segmentCriteria = {
      id: uuid(),
      startWithExisting: !allUsers,
      existingSegmentToFilter: allUsers === false ? existingSegmentToFilter : null,
      filter: filterToUse,
      dateRange: filterToUse.type === "Date Range" ? {
        rangeType,
        date: Date.parse(date)
      } : null,
      numberRange: filterToUse.type === "Number Range" ? {
        operatorType,
        tokenType,
        tokenAddress: tokenType === "ERC-20" ? tokenAddress : undefined,
        amount
      } : null,
      contractAddress: filterToUse.type === "Contract" ? contractAddress : null,
      userCount: addrArray.length > 0 ? addrArray.length : null
    }
    let { filterConditions } = conditions
    const thisOperator = operator ? operator : "And"
    this.setState({ operator: thisOperator })

    conditions['operator'] = thisOperator
    conditions['showOnDashboard'] = showOnDashboard
    if(condition && condition.id) {
      console.log(condition)
      const index = filterConditions.map(condition => condition.id).indexOf(condition.id)
      if(index > -1) {
        filterConditions[index] = segmentCriteria
      } else {
        console.log("Error with index")
      }
    } else {
      if(filterConditions) {
        filterConditions.push(segmentCriteria)
      } else {
        filterConditions = []
        filterConditions.push(segmentCriteria)
      }
    }

    conditions['filterConditions'] = filterConditions
    //this.clearState()
  }

  handleOperatorChange = (e) => {
    const { conditions } = this.state
    const operatorType = e.target.value
    conditions['operator'] = operatorType
    this.setState({ conditions, operator: operatorType })
  }

  deleteCondition = (condition) => {
    const { conditions } = this.state
    const { filterConditions } = conditions
    const index = filterConditions.map(a => a.id).indexOf(condition.id)
    if(index > -1) {
      filterConditions.splice(index, 1)
      conditions['filterConditions'] = filterConditions
      this.setState({ conditions })
    } else {
      console.log("Error with index")
    }
  }

  importUsers = () => {
    const { sessionData } = this.global
    const { importAddress } = this.state
    const importWalletsCmdObj = {
      command: 'importWallets',
      data: {
        appId: sessionData.id,
        contractAddress: importAddress,
        options: {
          transactions_per_page: 100,
          max_transactions: 1000
        }
      }
    }

    console.log('Calling import addresses from wallets:\n', JSON.stringify(importWalletsCmdObj, 0, 2))
    toast.success("Importing users. You'll get a notification when it's complete.", {
      position: toast.POSITION.TOP_RIGHT,
      autoClose: 3000
    })
    getCloudUser().processData('import', importWalletsCmdObj)
    this.setState({ importModalOpen: false, importAddress: "" })
  }

  renderMultipleConditions() {
    const { conditions, operator, editSegment } = this.state
    const { filterConditions } = conditions

    if(filterConditions && filterConditions.length > 0) {
      return (
        <div>
          {
            filterConditions.map(condition => {
              return (
                <div key={condition.id} className="form-group col-md-12">
                  <p>
                  {
                    filterConditions.map(a => a.id).indexOf(condition.id) === 0 && filterConditions.length === 1 ?
                    <select onChange={this.handleOperatorChange} className="custom-select" value={operator}>
                      <option value="And">And</option>
                      <option value="Or">Or</option>
                    </select> :
                    filterConditions.map(a => a.id).indexOf(condition.id) === 0 ?
                    <select onChange={this.handleOperatorChange} className="custom-select" value={operator}>
                      <option value="And">And</option>
                      <option value="Or">Or</option>
                    </select> :
                    <select className="custom-select" disabled value={operator}>
                      <option value="And">And</option>
                      <option value="Or">Or</option>
                    </select>
                    // <button onClick={() => this.setState({ operator: operator === "And" ? "Or" : "And"})} className="btn btn-flat">{operator}</button> :
                    // <button className="btn btn-flat" disabled>{operator}</button>
                  }
                  <span>Filter type:
                    {
                      editSegment ?
                      <button disabled className="btn btn-flat">{condition.filter.filter}</button> :
                      <button className="clickable a-el-fix" onClick={() => this.handleEditSegment(condition, true)}>{condition.filter.filter}</button>
                    }
                    <button onClick={() => this.deleteCondition(condition)} className="btn btn-flat"><i className="material-icons segment-icon">clear</i></button></span>
                  </p>
                </div>
              )
            })
          }
        </div>
      )
    } else {
      return (
        <div/>
      )
    }
  }

  renderCreateSegment(condition) {
    const { listOfAddresses, tokenAddress, tokenType, editSegment, dashboardShow, filterType, newSegName, rangeType, operatorType, amount, contractAddress } = this.state
    const filterToUse = filters.filter(a => a.filter === filterType)[0]
    const createCriteria = (filterType !== "Choose" && newSegName ? true : false) || (condition && condition.id)

    return (
      <div>
      {this.renderMultipleConditions()}
      <div className="form-group col-md-12">
        <label htmlFor="chartSty">First, Choose a Filter</label>
        <select value={filterType} onChange={(e) => this.setState({ filterType: e.target.value })} id="chartSty" className="form-control">
          <option value="Choose...">Choose...</option>
          {
            filters.map(filter => {
              return (
                <option key={filter.filter} value={filter.filter}>{filter.filter}</option>
              )
            })
          }
        </select>
      </div>
      {
        filterToUse && filterToUse.type === "Contract" ?
        <div className="form-group col-md-12">
          <label htmlFor="contractAddress">Enter The Contract Address</label>
          <input value={contractAddress} onChange={(e) => this.setState({ contractAddress: e.target.value })} type="text" className="form-control" id="contractAddress" placeholder="Contract Address" />
        </div> :
        filterToUse && filterToUse.type === "Date Range" ?
        <div className="row form-group col-md-12">
          <div className="col-lg-6 col-md-6 col-sm-12 mb-4">
            <label htmlFor="chartSty">Make a Selection</label>
            <select value={rangeType} onChange={(e) => this.setState({ rangeType: e.target.value })} id="chartSty" className="form-control">
              <option value="Choose...">Choose...</option>
              <option value="Before">Before</option>
              <option value="After">After</option>
              {/* TODO: Add this later <option value="Between">Between</option>*/}
            </select>
          </div>
          <div className="col-lg-6 col-md-6 col-sm-12 mb-4">
            <DatePicker
              className="date-picker"
              onChange={this.handleDateChange}
              value={this.state.date}
            />
          </div>
        </div> :
        filterToUse && filterToUse.type === "Number Range" ?
        <div className="row form-group col-md-12">
          <div className="col-lg-6 col-md-6 col-sm-12 mb-4">
            <label htmlFor="chartSty">Make a Selection</label>
            <select value={operatorType} onChange={(e) => this.setState({ operatorType: e.target.value })} id="chartSty" className="form-control">
              <option value="Choose...">Choose...</option>
              <option value="More Than">More Than</option>
              <option value="Less Than">Less Than</option>
              {/* TODO: Add this later <option value="Between">Between</option>*/}
            </select>
          </div>
          <div className="col-lg-6 col-md-6 col-sm-12 mb-4">
            <label htmlFor="tileName">Enter Amount</label>
            <input value={amount} onChange={(e) => this.setState({ amount: e.target.value })} type="number" className="form-control" id="tileName" placeholder="Wallet Balance Amount" />
          </div>
          <div className="col-lg-6 col-md-6 col-sm-12 mb-4">
            <label htmlFor="tileName">Choose Token</label>
            <select value={tokenType} onChange={(e) => this.setState({ tokenType: e.target.value })} id="chartSty" className="form-control">
              <option value="Choose...">Choose...</option>
              <option value="Ether">Ether</option>
              <option value="ERC-20">Other ERC-20 Token</option>
            </select>
          </div>
          {
            tokenType === "ERC-20" ?
            <div className="col-lg-6 col-md-6 col-sm-12 mb-4">
              <label htmlFor="erc20Address">Enter ERC-20 Token Address</label>
              <input value={tokenAddress} onChange={(e) => this.setState({ tokenAddress: e.target.value })} type="text" className="form-control" id="erc20Address" placeholder="Enter Token Address" />
            </div> :
            <div />
          }
        </div> :
        filterToUse && filterToUse.type === "Paste" ?
        <div className="col-lg-12 col-md-12 col-sm-12 mb-4">
          <label htmlFor="pastedAddress">Paste comma delimited list of wallet addresses</label>
          <textarea value={listOfAddresses} className="form-control" onChange={(e) => this.setState({ listOfAddresses: e.target.value })}></textarea>
        </div> :
        <div />
      }

      {
        filterToUse && filterToUse.type !== "Paste" ?
        <div className="form-group col-md-12">
          <button onClick={this.addFilter} className="btn btn-secondary">Add Another Filter</button>
        </div> :
        <div />
      }


      <div className="form-group col-md-12">
        <label htmlFor="dashboardShow">Show on Dashboard</label>
        <select value={dashboardShow} onChange={(e) => this.setState({ dashboardShow: e.target.value })} id="chartSty" className="form-control">
          <option value="Choose...">Choose...</option>
          <option value="Yes">Yes</option>
          <option value="No">No</option>
        </select>
      </div>
      {
        editSegment && !condition ?
        <div>
          <div className="form-group col-md-12">
            <label htmlFor="tileName">Update Segment Name</label>
            <input onChange={(e) => this.setState({ newSegName: e.target.value })} value={newSegName} type="text" className="form-control" id="tileName" placeholder="Give it a name" />
          </div>
          <div className="form-group col-md-12">
            <label htmlFor="chartSty">Update The Segment</label><br/>
            {
              createCriteria ?
              <button onClick={this.updateSegment} className="btn btn-primary">Update Segment</button> :
              <button disabled className="btn">Update Segment</button>
            }

          </div>
        </div> :
        editSegment && condition && condition.id ?
        <div>
          <div className="form-group col-md-12">
            <label htmlFor="chartSty">Update The Filter Condition</label><br/>
            {
              createCriteria ?
              <button onClick={() => this.addFilter(condition)} className="btn btn-primary">Update Filter</button> :
              <button disabled className="btn">Update Filter</button>
            }

          </div>
        </div> :
        <div>
          <div className="form-group col-md-12">
            <label htmlFor="tileName">Then, Give It A Name</label>
            <input onChange={(e) => this.setState({ newSegName: e.target.value })} value={newSegName} type="text" className="form-control" id="tileName" placeholder="Give it a name" />
          </div>
          <div className="form-group col-md-12">
            <label htmlFor="chartSty">Finally, Create The Segment</label><br/>
            {
              createCriteria ?
              <button onClick={this.createSegment} className="btn btn-primary">Create Segment</button> :
              <button className="btn" disabled>Create Segment</button>
            }

          </div>
        </div>
      }
    </div>
    )
  }

  render() {
    const { sessionData, processing, currentAppId } = this.global
    const { currentSegments } = sessionData
    const { importAddress, importModalOpen, loadingMessage, condition, editSegment, showSegmentModal, segmentToShow, show, seg, existingSeg, newSegName, existingSegmentToFilter } = this.state
    const segments = currentSegments ? currentSegments : []

    return(
      <main className="main-content col-lg-10 col-md-9 col-sm-12 p-0 offset-lg-2 offset-md-3">
        <StickyNav />

        <div className="main-content-container container-fluid px-4">
          <div className="page-header row no-gutters py-4">
            <div className="col-lg-6 col-md-6 col-sm-12 mb-4">
              <span className="text-uppercase page-subtitle">Segments</span>
              <h3 className="page-title">Group People Using Your App <span onClick={this.handleRefreshData} className="clickable refresh"><i className="fas fa-sync-alt"></i></span></h3>
            </div>
            <div className="col-lg-6 col-md-6 col-sm-12 mb-4 text-right">
              <span className="text-uppercase page-subtitle">Import Users</span><br/>
              <button onClick={() => this.setState({ importModalOpen: true })} style={{fontSize: "16px", margin: "5px"}} className="btn btn-success">Import By Smart Contract</button>
            </div>
          </div>
          <div className="row">
            <div className="col-lg-6 col-md-6 col-sm-12 mb-4">
              <h5>Current Segments</h5>
              {
                segments.length > 0 ?
                <Card>
                  <Card.Body>
                  <Table responsive>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>User Count</th>
                      <th></th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                  {
                    segments.map(seg => {
                      return (
                        <tr key={seg.id}>
                          <td className="clickable link-color" onClick={() => this.handleSegmentModal(seg)}>{seg.name}</td>
                          <td>{seg.userCount}</td>
                          {
                            seg.id === `1-${currentAppId}` ?<td className="clickable" onClick={() => this.setState({ importModalOpen: true })}><strong>Import Users</strong></td> :
                            <td className="clickable" onClick={() => this.handleEditSegment(seg)}>Edit</td>
                          }
                          {
                            seg.id === `1-${currentAppId}` ?
                            <td disabled></td> :
                            <td className="clickable text-danger" onClick={() => this.deleteSegment(seg, false)}>Delete</td>
                          }
                        </tr>
                      )
                    })
                  }
                  </tbody>
                </Table>
                  </Card.Body>
                </Card>
                 :
               <ul className="tile-list">
                 <li className="card"><span className="card-body">You haven't created any segments yet, let's do that now!.</span></li>
               </ul>
              }

              <ToastContainer />

              <Modal className="custom-modal" show={show} onHide={this.closeModal}>
                <Modal.Header closeButton>
                  <Modal.Title>Are you sure?</Modal.Title>
                </Modal.Header>
                <Modal.Body>You're about to delete the segment <strong><u>{seg.name}</u></strong>. Are you sure you want to do this? It can't be undone.</Modal.Body>
                <Modal.Footer>
                  <button className="btn btn-secondary" onClick={this.closeModal}>
                    Cancel
                  </button>
                  <button className="btn btn-danger" onClick={() => this.deleteSegment(seg, true)}>
                    Delete
                  </button>
                </Modal.Footer>
              </Modal>

              <Modal className="custom-modal" show={showSegmentModal} onHide={() => this.setState({ showSegmentModal: false, segmentToShow: {}})}>
                <Modal.Header closeButton>
                  <Modal.Title>{segmentToShow.name}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                  <SegmentTable seg={segmentToShow} />
                </Modal.Body>
                <Modal.Footer>
                  <button className="btn btn-secondary" onClick={() => this.setState({ showSegmentModal: false, segmentToShow: {}})}>
                    Close
                  </button>
                </Modal.Footer>
              </Modal>

              <Modal className="custom-modal" show={editSegment} onHide={this.handleCloseSegmentModal}>
                <Modal.Header closeButton>
                  <Modal.Title>{newSegName}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                  {this.renderCreateSegment(condition)}
                </Modal.Body>
                <Modal.Footer>
                  <button className="btn btn-secondary" onClick={this.handleCloseSegmentModal}>
                    Close
                  </button>
                </Modal.Footer>
              </Modal>

              <Modal className="custom-modal" show={importModalOpen} onHide={() => this.setState({ importModalOpen: false})}>
                <Modal.Header closeButton>
                  <Modal.Title>Import Users</Modal.Title>
                </Modal.Header>
                <Modal.Body>You can import your users based on your smart contracts. Simply enter a smart contract address and we will import all of the addresses that have interacted with that address.</Modal.Body>
                <Modal.Body>
                  <InputGroup className="mb-3">
                    <FormControl type="text" value={importAddress} onChange={(e) => this.setState({ importAddress: e.target.value })} placeholder="0x..." />
                  </InputGroup>

                  </Modal.Body>
                <Modal.Footer>
                  {
                    importAddress.length > 10 && importAddress.length < 50 ?
                    <button className="btn btn-primary" onClick={this.importUsers}>
                      Import
                    </button> :
                    <button className="btn btn-primary" disabled>
                      Import
                    </button>
                  }

                  <button className="btn btn-secondary" onClick={() => this.setState({ importModalOpen: false})}>
                    Cancel
                  </button>
                </Modal.Footer>
              </Modal>

            </div>
            <div className="col-lg-6 col-md-6 col-sm-12 mb-4">
              <h5>Create a Segment</h5>
                {/*<div className="form-group col-md-12">
                  <label htmlFor="inputSeg">First, Start With Existing Segment or Start With All Users</label>
                  <fieldset>
                    <div className="custom-control custom-radio mb-1">
                      <input onChange={() => this.setState({ allUsers: !allUsers, existingSeg: !existingSeg })} type="radio" id="formsRadioDefault" name="formsRadioDefault" className="custom-control-input" checked={existingSeg} />
                      <label className="custom-control-label" for="formsRadioDefault">Use Existing Segment</label>
                    </div>
                    <div className="custom-control custom-radio mb-1">
                      <input onChange={() => this.setState({ allUsers: !allUsers, existingSeg: !existingSeg })} type="radio" id="formsRadioChecked" name="formsRadioChecked" className="custom-control-input" checked={allUsers} />
                      <label className="custom-control-label" for="formsRadioChecked">Start With All Users</label>
                    </div>
                  </fieldset>
                </div>*/}
                {
                  existingSeg ?
                  <div className="form-group col-md-12">
                    <label htmlFor="inputSeg">Now, Choose a Segment</label>
                    <select value={existingSegmentToFilter} onChange={(e) => this.setState({ existingSegmentToFilter: e.target.value })} id="inputSeg" className="form-control">
                      <option value="Choose...">Choose...</option>
                      {
                        segments.map(seg => {
                          return (
                          <option value={seg.name} key={seg.id}>{seg.name}</option>
                          )
                        })
                      }
                    </select>
                  </div> :
                  <div />
                }
                {this.renderCreateSegment()}
              </div>
          </div>

          <Modal className="custom-modal" show={processing} >
            <Modal.Body>
              <LoadingModal messageToDisplay={`${loadingMessage}...`} />
            </Modal.Body>
          </Modal>

        </div>
      </main>
    )
  }
}
