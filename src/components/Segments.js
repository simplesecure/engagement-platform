import React from "reactn";
import { Dialog, CornerDialog } from 'evergreen-ui'
import {
  Button,
  Grid,
  Segment,
  Header,
  Dropdown,
  Input,
  Label,
  Icon,
  Dimmer,
  Loader,
  Message
} from 'semantic-ui-react'
import SideNav from '../components/SideNav';
import SegmentTable from "./SegmentTable";
import { getCloudServices } from "../utils/cloudUser";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  createSegment,
  updateSegment,
  deleteSegment,
  addFilter,
  clearState
} from './SegmentHelpers'
import ProcessingBlock from './ProcessingBlock'
import MonitoredSmartContracts from './MonitoredSmartContracts'
import uuid from 'uuid/v4'
import ReactGA from 'react-ga'
import { validURL } from "../utils/misc";

export default class Segments extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      show: false,
      seg: "",
      existingSeg: false,
      allUsers: true,
      filterType: "",
      rangeType: null,
      operatorType: null,
      newSegName: "",
      date: new Date(),
      amount: 0,
      contractAddress: null,
      existingSegmentToFilter: null,
      tokenType: null,
      tokenAddress: "0x0000000000000000000000000000000000000000",
      showSegmentModal: false,
      segmentToShow: {},
      dashboardShow: "",
      loadingMessage: "Creating segment",
      operator: "",
      conditions: {},
      condition: {},
      importModalOpen: false,
      importAddress: "",
      proxyAddress: "",
      selectedNetwork: "mainnet",
      webhookOpen: false,
      isCreateSegment: false,
      walletAmount: 0,
      walletAmountType: 'eth',
      eventAmount: 0,
      contractEventInput: null,
      eventAmountType: 'eth',
      contractEvent: null,
      isLoading: false,
      showMonitoredDelete: false,
      addressToUnmonitor: null,
      dataToUnMonitor: null,
      showViewSegment: false,
      viewSegment: null,
      showTransactions: false,
      webhookUrl: ''
    }
    ReactGA.pageview('/segments')
    this.contractOptions = {}
    this.contracts = []
    this.dataInputs = []
    this.dataInputTypes = []
    this.contractOptions = []
    this.tokenOptions = []
  }

  closeModal = () => {
    this.setState({ show: false });
  };

  closeMonitoredModal = () => {
    this.setState({ showMonitoredDelete: false });
  };

  handleDateChange = (date) => {
    console.log("CHANGING DATE...", date);
    this.setState({ date });
  };

  handleSegmentModal = (data, showTransactions) => {
    this.setState({ segmentToShow: data, showSegmentModal: true, showTransactions });
  };

  handleCloseSegmentModal = () => {
    this.setState({
      showSegmentModal: false,
      editSegment: false,
      isCreateSegment: false
    });
    clearState(this);
  };

  handleRefreshData = async () => {
    toast.success("Refreshing Dashboard Data...", {
      position: toast.POSITION.TOP_RIGHT,
      autoClose: 2000,
    });
    getCloudServices().fetchOrgDataAndUpdate();
  };

  handleOperatorChange = (value) => {
    const { conditions } = this.state;
    const operatorType = value;
    conditions["operator"] = operatorType;
    this.setState({ conditions, operator: operatorType });
  };

  deleteCondition = (condition) => {
    const { conditions } = this.state;
    const { filterConditions } = conditions;
    const index = filterConditions.map((a) => a.id).indexOf(condition.id);
    if (index > -1) {
      filterConditions.splice(index, 1);
      conditions["filterConditions"] = filterConditions;
      this.setState({ conditions });
    } else {
      console.log("Error with index");
    }
  };

  importUsers = async () => {
    const { sessionData, currentAppId } = this.global
    const { importAddress } = this.state
    ReactGA.event({
      category: 'Import',
      action: 'Adding New Smart Contract Import',
      label: importAddress
    })
    const orgData = await getCloudServices().monitorContract(sessionData.id, importAddress)
    await getCloudServices().getContractEventCount(sessionData.id, importAddress, false)
    const appData = orgData.apps[currentAppId]
    this.setState({
      importModalOpen: false,
      importAddress: "",
      isLoading: false
    })
    React.setGlobal({
      sessionData: appData
    })
  };

  renderMultipleConditions() {
    const { conditions, editSegment, operator } = this.state;
    const { filterConditions } = conditions;
    if (filterConditions && filterConditions.length > 0) {
      return (
        <div>
          {filterConditions.map((condition) => {
            return (
              <div key={condition.id} className="form-group col-md-12">
                {
                  filterConditions
                  .map((a) => a.id)
                  .indexOf(condition.id) === 0 && filterConditions.length === 1 ? (
                    <div>
                      <Dropdown
                        placeholder='Operator...'
                        value={operator}
                        compact
                        disabled={operator !== ""}
                        onChange={(e, {value}) => this.handleOperatorChange(value)}
                        openOnFocus={false}
                        selection
                        options={[
                          { key: 'and', text: 'And', value: 'and' },
                          { key: 'or', text: 'Or', value: 'or' }
                        ]}
                      />
                      <br />
                      <br />
                    </div>
                  ) : filterConditions
                      .map((a) => a.id)
                      .indexOf(condition.id) === 0 ? (
                    <div>
                      <Dropdown
                        placeholder='Operator...'
                        value={operator}
                        compact
                        disabled={operator !== ""}
                        onChange={(e, {value}) => this.handleOperatorChange(value)}
                        openOnFocus={false}
                        selection
                        options={[
                          { key: 'and', text: 'And', value: 'and' },
                          { key: 'or', text: 'Or', value: 'or' }
                        ]}
                      />
                      <br />
                      <br />
                    </div>
                  ) : null
                }
                <span>
                  {editSegment ? <div /> : (
                    <Button.Group>
                      <Button primary disabled>
                        <Button.Content visible>{condition.filter.filter}</Button.Content>
                      </Button>
                      <Button onClick={() => this.deleteCondition(condition)} color='red'>Delete</Button>
                    </Button.Group>
                  )}
                </span>
              </div>
            )
          })}
        </div>
      )
    } else {
      return <div />;
    }
  }

  renderFilterConditions(filterToUse) {
    const {
      contractAddress,
      operatorType,
      tokenAddress,
      contractEvent,
      contractEventInput,
      eventAmount,
      eventAmountType,
      walletAmount,
      walletAmountType,
      // web2Event,
      // rangeType,
      // delayBlocks,
      // tokenType,
    } = this.state
    const { type } = filterToUse
    if (type === "Smart Contract Intersection") {
      return (
        <div className="form-group col-md-12">
          <label htmlFor="contractAddress">Select Smart Contract</label>
          <Dropdown
            placeholder='Choose contract...'
            fluid
            search
            selection
            openOnFocus={false}
            value={contractAddress}
            onChange={(e, {value}) => this.setState({ contractAddress: value })}
            options={this.contractOptions}
          />
        </div>
      )
    // } else if (type === "Date Range") {
    //   return (
    //     <div className="row form-group col-md-12">
    //       <div className="col-lg-6 col-md-6 col-sm-12 mb-4">
    //         <label htmlFor="chartSty">Make a Selection</label>
    //         <Dropdown
    //           placeholder='Range...'
    //           onChange={(e, {value}) => this.setState({ rangeType: value })}
    //           value={rangeType}
    //           openOnFocus={false}
    //           fluid
    //           selection
    //           options={[
    //             { key: 'choose...', text: 'Choose...', value: 'choose...' },
    //             { key: 'before', text: 'Before', value: 'Before' },
    //             { key: 'after', text: 'After', value: 'After' }
    //           ]}
    //         />
    //       </div>
    //       <div className="col-lg-6 col-md-6 col-sm-12 mb-4">
    //         <DatePicker
    //           className="date-picker"
    //           onChange={this.handleDateChange}
    //           value={this.state.date}
    //         />
    //       </div>
    //     </div>
    //   )
    } else if (type === "Wallet Balance") {
      return (
        <div className="row form-group col-md-12">
          <div className="col-12">
            <label htmlFor="tileName">Choose Token Type</label>
            <Dropdown
              placeholder='Choose token...'
              value={tokenAddress}
              onChange={(e, {value}) => this.setState({ tokenAddress: value })}
              openOnFocus={false}
              fluid
              selection
              options={this.tokenOptions}
            />
            <br/>
          </div>
          <div className="col-lg-4 col-md-4 col-sm-12 mb-4">
            <label htmlFor="chartSty">Make a Selection</label>
            <Dropdown
              placeholder='Range...'
              value={operatorType}
              onChange={(e, {value}) => this.setState({ operatorType: value })}
              openOnFocus={false}
              fluid
              selection
              options={[
                { key: 'equal', text: 'Equal', value: '==' },
                { key: 'more than', text: 'More Than', value: '>' },
                { key: 'more than equal', text: 'More Than || Equal', value: '>=' },
                { key: 'less than', text: 'Less Than', value: '<' },
                { key: 'less than equal', text: 'Less Than || Equal', value: '<=' }
              ]}
            />
          </div>
          <div className="col-lg-4 col-md-4 col-sm-12 mb-4">
            <label htmlFor="tileName">Enter Amount</label>
            <Input
              placeholder="Wallet Balance Amount"
              type="number"
              value={walletAmount}
              fluid
              onChange={(e, {value}) => this.setState({ walletAmount: value })}
            />
          </div>
          <div className="col-lg-4 col-md-4 col-sm-12 mb-4">
            <label htmlFor="tileName">Amount Type</label>
            <Dropdown
              placeholder='Type...'
              value={walletAmountType}
              onChange={(e, {value}) => this.setState({ walletAmountType: value })}
              openOnFocus={false}
              fluid
              selection
              options={[
                { key: 'eth', text: 'eth/ERC-20', value: 'eth' },
                { key: 'wei', text: 'wei', value: 'wei' },
              ]}
            />
          </div>
        </div>
      )
    // } else if (type === "Delay Range") {
    //   return (
    //     <div className="form-group col-md-12">
    //       <label htmlFor="contractAddress">Enter The Number of Blocks</label>
    //       <Input
    //         placeholder="Number of Eth Blocks"
    //         fluid
    //         type="number"
    //         value={delayBlocks}
    //         onChange={(e, {value}) => this.setState({ delayBlocks: value })}
    //       />
    //     </div>
    //   )
    } else if (type === "Smart Contract Events") {
      const isAmount = (eventAmountType === 'eth' || eventAmountType === 'wei' || eventAmountType === 'int')
      const isAddress = eventAmountType === 'address'
      const defaultOperatorTypes = [
        { key: 'equal', text: 'Equal', value: '==' },
        { key: 'not equal', text: 'Not Equal', value: '!=' },
        { key: 'more than', text: 'More Than', value: '>' },
        { key: 'more than equal', text: 'More Than || Equal', value: '>=' },
        { key: 'less than', text: 'Less Than', value: '<' },
        { key: 'less than equal', text: 'Less Than || Equal', value: '<=' }
      ]
      const boolOperatorTypes = [
        { key: 'equal', text: 'Equal', value: '==' },
        { key: 'not equal', text: 'Not Equal', value: '!=' }
      ]
      const addrOperatorTypes = [
        { key: 'equal', text: 'Equal', value: '==' },
        { key: 'not equal', text: 'Not Equal', value: '!=' },
        { key: 'all matches', text: 'All Matches', value: '*' }
      ]
      const eventAmountValueDisabled = (eventAmountType === 'boolean') || (eventAmount === "0x0000000000000000000000000000000000000000")
      const opertarorTypeOptions = isAmount ? defaultOperatorTypes : isAddress ? addrOperatorTypes : boolOperatorTypes
      let eventAmountTypeOptions = []
      if (contractEventInput && contractEvent && this.dataInputTypes[contractEvent][contractEventInput]) {
        eventAmountTypeOptions = this.dataInputTypes[contractEvent][contractEventInput]
        if (eventAmountTypeOptions.key === 'uint256') {
          eventAmountTypeOptions = [
            { key: 'eth', text: 'eth/ERC-20', value: 'eth' },
            { key: 'wei', text: 'wei', value: 'wei' },
            { key: 'int', text: 'int', value: 'int' }
          ]
        }
        else {
          eventAmountTypeOptions = [eventAmountTypeOptions]
        }
      }
      return (
        <div className="col-md-12">
          <label htmlFor="contractAddress">Pick Smart Contract</label>
          <Dropdown
            placeholder='Choose Contract...'
            value={contractAddress}
            onChange={(e, {value}) => this.setState({ contractAddress: value })}
            openOnFocus={false}
            fluid
            selection
            options={this.contracts}
          />
          <br />
          {contractAddress ? (
            <div className="row form-group">
              <div className="col-lg-6 col-md-6 col-sm-12 mb-4">
                <label htmlFor="contractAddress">Pick Event</label>
                <Dropdown
                  placeholder='Choose Event...'
                  value={contractEvent}
                  onChange={(e, {value}) => this.setState({ contractEvent: value })}
                  openOnFocus={false}
                  fluid
                  selection
                  options={this.contractOptions[contractAddress]}
                />
              </div>
              <div className="col-lg-6 col-md-6 col-sm-12 mb-4">
                <label htmlFor="contractAddress">Pick Input To Track</label>
                <Dropdown
                  placeholder='Choose Input...'
                  value={contractEventInput}
                  onChange={(e, {value}) => {
                    this.setState({ contractEventInput: value })
                    const opt = this.dataInputTypes[contractEvent][value]
                    if (opt.key !== 'uint256') {
                      this.setState({ eventAmountType: opt.key })
                    }
                  }}
                  openOnFocus={false}
                  fluid
                  selection
                  options={this.dataInputs[contractEvent]}
                />
              </div>
            </div>
          ) : null}
          {contractEventInput ? (
            <div className="row form-group">
              <div className="col-lg-4 col-md-4 col-sm-12 mb-4">
                <label htmlFor="tileName">Input Type</label>
                <Dropdown
                  placeholder='Choose...'
                  value={eventAmountType}
                  onChange={(e, {value}) => {
                    if (value === 'boolean') {
                      this.setState({ eventAmountType: value, eventAmount: 'true' })
                    }
                    else {
                      this.setState({ eventAmountType: value, eventAmount: null })
                    }
                  }}
                  openOnFocus={false}
                  fluid
                  selection
                  options={eventAmountTypeOptions}
                />
              </div>
              <div className="col-lg-4 col-md-4 col-sm-12 mb-4">
                <label htmlFor="chartSty">Comparison Logic</label>
                <Dropdown
                  placeholder='Range...'
                  value={operatorType}
                  onChange={(e, {value}) => {
                      if (eventAmountType === 'address') {
                        if (value === '*')
                          this.setState({ eventAmount: "0x0000000000000000000000000000000000000000", operatorType: '!=' })
                        else
                          this.setState({ eventAmount: 0, operatorType: value})
                      } else if (eventAmountType === 'boolean') {
                        this.setState({ eventAmount: 'true', operatorType: value })
                      }
                      else {
                        this.setState({ operatorType: value})
                      }
                    }
                  }
                  openOnFocus={false}
                  fluid
                  selection
                  options={opertarorTypeOptions}
                />
              </div>
              <div className="col-lg-4 col-md-4 col-sm-12 mb-4">
                <label htmlFor="tileName">Enter Value</label>
                <Input
                  placeholder="Event Value"
                  fluid
                  type={isAmount ? 'number' : 'text'}
                  disabled={eventAmountValueDisabled}
                  value={eventAmount}
                  onChange={(e, {value}) => this.setState({ eventAmount: value })}
                />
              </div>
            </div>
          ) : null}
        </div>
      )
    }
    // } else if (type === "Web2 Selection") {
    //   let web2Events = []
    //   if (web2Analytics && web2Analytics.data) {
    //     const events = web2Analytics.data
    //     events.forEach(it => {
    //       web2Events.push({
    //         key: it,
    //         value: it,
    //         text: it
    //       })
    //     })
    //     return (
    //       <div className="form-group col-md-12">
    //         <label htmlFor="contractAddress">Pick Smart Contract</label>
    //         <Dropdown
    //           placeholder='Choose Contract...'
    //           value={web2Event}
    //           onChange={(e, {value}) => this.setState({ web2Event: value })}
    //           openOnFocus={false}
    //           fluid
    //           selection
    //           options={web2Events}
    //         />
    //       </div>
    //     )
    //   } else {
    //     return (
    //       <Message>
    //         You haven't imported stored any Web2 events yet.
    //       </Message>
    //     )
    //   }
    // }
  }

  setFilterType = (value) => {
    this.contractOptions = {}
    this.contracts = []
    this.dataInputs = []
    this.dataInputTypes = []
    this.contractOptions = []
    this.tokenOptions = []
    const { contractData, sessionData, tokenData } = this.global
    const { monitoring } = sessionData
    if (value === "Wallet Balance") {
      tokenData.forEach(e => {
        this.tokenOptions.push({
          key: e.address,
          value: e.address,
          text: e.name
        })
      })
      this.setState({ filterType: value })
    } else if (value === "Smart Contract Events") {
      contractData.forEach(element => {
        const { address, mappings, name, proxy_contract, implementation_contract } = element
        // dont care about these events for the proxy contract
        if (implementation_contract) {
          return
        }
        // if not monitoring the contract, then don't populate the events
        // if underlying implementation contract, thne we need to get those events
        if (!Object.keys(monitoring).find(key => (address === key || key === (proxy_contract && proxy_contract.toLowerCase())))) {
          return
        }
        const contractValue = `${name}: ${address}`
        this.contracts.push({
          key: contractValue,
          text: contractValue,
          value: address
        })
        const { eventMap } = mappings
        let options = []
        eventMap.forEach((item) => {
          const nm = item.name
          const { inputs } = item
          let inputOptions = []
          let inputOptionTypes = {}
          inputs.forEach((it) => {
            // enabling non uint256 types here
            // if (!it.indexed || it.type === 'uint256') {
            let { indexed, name, type } = it
            if (!indexed && name !== "") {
              inputOptions.push({
                key: name,
                text: name,
                value: name
              })
              type = type === 'bool' ? 'boolean' : type
              inputOptionTypes[name] = {
                key: type,
                text: type,
                value: type
              }
            }
          })
          if (inputOptions.length) {
            this.dataInputs[nm] = inputOptions
            this.dataInputTypes[nm] = inputOptionTypes
            options.push({
              key: nm,
              text: nm,
              value: nm
            })
          }
        })
        this.contractOptions[address] = options
      })
      let defaultAddress = this.contracts.length ? this.contracts[0].value : ''
      this.setState({ filterType: value, contractAddress: defaultAddress })
    } else if (value === "Smart Contract Intersection") {
      contractData.forEach(el => {
        if (el.is_active && !el.proxy_contract && Object.keys(monitoring).indexOf(el.address) < 0) {
          this.contractOptions.push({
            key: el.address,
            value: el.address,
            text: `${el.name}: ${el.address}`
          })
        }
      })
      this.setState({ filterType: value })
    }
  }

  renderCreateSegment(condition, disabled) {
    const { allFilters } = this.global
    const {
      tokenAddress,
      tokenType,
      editSegment,
      filterType,
      newSegName,
      webhookUrl
    } = this.state;
    const filterToUse = allFilters.filter((a) => a.filter === filterType)[0];
    const erc20Balance = tokenType === "ERC-20";
    const createCriteria =
      (filterType !== "Choose" && newSegName && erc20Balance !== true
        ? true
        : false) ||
      (filterType !== "Choose" &&
        newSegName &&
        erc20Balance === true &&
        tokenAddress) ||
      (condition && condition.id);
    let options = allFilters
    options.forEach(filter => {
      filter.text = filter.filter
      filter.key = filter.filter
      filter.value = filter.filter
      filter.disabled = filter.disabled
    })
    return (
      <div>
        {this.renderMultipleConditions()}
        <div className="form-group col-md-12">
          <label htmlFor="chartSty">Choose a Filter</label>
          <Dropdown
            placeholder='Choose a Filter...'
            value={filterType}
            onChange={(e, {value}) => this.setFilterType(value)}
            fluid
            openOnFocus={false}
            selection
            options={options}
          />
        </div>
        {filterToUse ? this.renderFilterConditions(filterToUse) : null}
        {filterToUse &&
        (filterType !=="Smart Contract Events") ? (
          <div className="form-group col-md-12">
            <Button disabled={disabled} onClick={() => {
              this.setState({filterType: null})
              addFilter(this)}
            } positive>
              Add Another Filter
            </Button>
          </div>
        ) : (
          <div />
        )}
        <div>
          <div className="form-group col-md-12">
            <label htmlFor="tileName">Specify a webhook URL</label>
            <Input
              placeholder="https://webhook.url"
              fluid
              type="url"
              value={webhookUrl}
              onChange={(e, {value}) => this.setState({ webhookUrl: value })}
            />
          </div>
          <div className="form-group col-md-12">
            <label htmlFor="tileName">Then, Give It A Name</label>
            <Input
              placeholder="Give it a name"
              fluid
              type="text"
              value={newSegName}
              onChange={(e, {value}) => this.setState({ newSegName: value })}
            />
          </div>
        </div>
      </div>
    );
  }
  deleteMonitoredContract = async(address, data, confirm) => {
    if (confirm) {
      const { sessionData, currentAppId } = this.global
      const orgData = await getCloudServices().unmonitorContract(sessionData.id, address)
      // TODO: Segments might depend on this monitored contract--here is my TODO for that with scenarios 
      //       from the server code that unmonitors a contract. <-- Prabhaav
      //
      //          2. TODO: Traverse the segements and if they depend upon this contract do one of the following:
      //              i) disable them
      //              ii) remove them
      //              iii) return a warning listing them and ask for confirmation
      //              iv) something else
      //                  - thinking this through made me realize you don't even need to monitor contracts--you just
      //                    need to select them in segments you create.
      //
      //              ... <-- code ... TODO
      //
      const appData = orgData.apps[currentAppId]
      ReactGA.event({
        category: 'Import',
        action: 'Remove Smart Contract Import',
        label: address
      })
      React.setGlobal({
        sessionData: appData
      })
      this.setState({addressToUnmonitor: null, dataToUnMonitor: null, showMonitoredDelete: false})
    }
    else {
      this.setState({showMonitoredDelete: true, addressToUnmonitor: address, dataToUnMonitor: data})
    }
  }
  handleWebhookUrlWork = async () => {
    const { webhookUrl } = this.state
    const url = `http://localhost:3003/?url=${webhookUrl}`
    await fetch(url);
    // const jsonData = await result.json();
    console.log("Webhook triggerred")
    // this.setState({ webhookUrl: value })
  }
  render() {
    const { sessionData, processing, anOrgStatusObj, currentAppId } = this.global;
    const { currentSegments, monitoring } = sessionData;
    const {
      importAddress,
      // proxyAddress,
      importModalOpen,
      loadingMessage,
      condition,
      editSegment,
      showSegmentModal,
      segmentToShow,
      show,
      showMonitoredDelete,
      seg,
      newSegName,
      webhookOpen,
      webhookUrl,
      isCreateSegment,
      filterType,
      tokenAddress,
      operatorType,
      walletAmount,
      walletAmountType,
      contractAddress,
      eventAmountType,
      contractEvent,
      contractEventInput,
      eventAmount,
      isLoading,
      addressToUnmonitor, 
      dataToUnMonitor,
      showViewSegment,
      viewSegment,
      showTransactions
    } = this.state;
    const segments = currentSegments ? currentSegments : [];
    // const defaultSegments = ['All Users', 'Monthly Active Users', 'Weekly Active Users']
    const status = anOrgStatusObj ? anOrgStatusObj[currentAppId] : null
    let message = null
    if (status && Object.keys(status).length) {
      message = (
        <React.Fragment>
          <CornerDialog
            title="SimpleID Data Processing"
            isShown={true}
            hasFooter={false}
          >
          {
            Object.keys(status).map((key, index) => {
              let data = status[key]
                return (
                  <div>
                    <h3>{data.status}</h3>
                    <p>{data.description}</p>
                  </div>
                )
              }
            )
          }
          </CornerDialog>
        </React.Fragment>
      )
    }
    let createSegmentDisabled = false
    let addAnotherFilter = false
    const isAmount = (eventAmountType === 'eth' || eventAmountType === 'wei' || eventAmountType === 'int')
    if (!newSegName.length) {
      createSegmentDisabled = true
    } //give it a name 
    else if (
      !filterType // no filter
      || (filterType === "Wallet Balance" && (!tokenAddress || !operatorType || walletAmount < 0 || !walletAmountType))
      || (filterType === "Smart Contract Intersection" && (!contractAddress))
      || (filterType === "Smart Contract Events" && (!eventAmountType || !contractEvent || !contractEventInput || !operatorType
       || (isAmount && eventAmount < 0) || (!isAmount && !eventAmount)))
    ) {
      createSegmentDisabled = true
      addAnotherFilter = true
    }
    else if (eventAmountType === "address" && (eventAmount.length < 42 || eventAmount.length > 43)) {
      createSegmentDisabled = true
      addAnotherFilter = true
    }
    else if (isAmount && isNaN(eventAmount)) {
      createSegmentDisabled = true
      addAnotherFilter = true
    }
    return (
      <div>
        <SideNav />
        <main className="main-content col-lg-10 col-md-9 col-sm-12 p-0 offset-lg-2 offset-md-3">
          <div className="main-content-container container-fluid px-4">
            <div className="page-header row no-gutters py-4">
              <div className="col-lg-6 col-md-6 col-sm-12 mb-4">
                <span className="text-uppercase page-subtitle">Segments</span>
                <h3 className="page-title">
                  Group Wallets Using Your App{" "}
                </h3>
              </div>
              <div className="col-lg-6 col-md-6 col-sm-12 mb-4 text-right">
                <ProcessingBlock />
              </div>
            </div>
            <Grid stackable columns={1}>
              {message}
              <Grid.Column key='datainput'>
                <Grid stackable>
                  <Grid.Column width={12} key='segment creation'>
                    <Header as='h3'>Cohort Analysis</Header>
                    <Button
                      content='Create User Segment'
                      icon='write'
                      labelPosition='left'
                      onClick={() => {
                        ReactGA.event({
                          category: 'Segment',
                          action: 'Clicked Create User Segment Button',
                        })
                        this.setState({isCreateSegment: true})}
                      }
                      primary
                      disabled={monitoring && !Object.keys(monitoring).length}
                    />
                    {/*<Link to="/block">
                      <Button
                        color='orange'
                        icon='sitemap'
                        labelPosition='left'
                        content='Create Advanced Segment'
                      />
                    </Link>*/}
                  </Grid.Column>
                  <Grid.Column width={4} key='import users'>
                    <Header as='h3'>Add Users</Header>
                    <Button
                      onClick={() => {
                        ReactGA.event({
                          category: 'Import',
                          action: 'Clicked Import Smart Contract Button',
                        })
                        this.setState({ importModalOpen: true })}
                      }
                      positive
                      icon='download'
                      labelPosition='left'
                      content='Import Smart Contract'
                    />
                  </Grid.Column>
                </Grid>
              </Grid.Column>
              <Grid.Column key='curmonitored'>
                <Header as='h3'>Monitored Contracts & Segments</Header>
                {monitoring && Object.keys(monitoring).length ? (
                <Grid columns={2}>
                {
                  Object.entries(monitoring).map(([key,value]) => {
                    const { latest_block_id, 
                            wallet_count,
                            recent_wallets,
                            // most_valuable_wallets,
                            // daily_transactions,
                            contract_name } = value
                    const disableWallets = wallet_count < 1
                    return (
                      <Grid.Column key={contract_name}>
                        <Segment key={uuid()} color='green' raised padded>
                          <Header as='h3' dividing>
                            <Header.Content><u><a rel="noopener noreferrer" href={`https://etherscan.io/address/${key}`} target="_blank">{contract_name}</a></u></Header.Content>
                            <Header.Subheader color='grey' style={{marginTop: 5}}>
                               Updated at block: <a rel="noopener noreferrer" href={`https://etherscan.io/block/${latest_block_id}`} target="_blank">{latest_block_id}</a>
                            </Header.Subheader>
                            {!disableWallets && value.hasOwnProperty('wallet_count')? (
                              <Label as='button' color='red' attached='top right' onClick={() => this.handleSegmentModal({name: contract_name, wallets: recent_wallets}, false)}>
                                {wallet_count}
                              </Label>
                            ) : (
                              <Label as='a' color='grey' attached='top right'>
                                0
                              </Label>
                            )
                            }
                          </Header>
                          <Button.Group>
                            <Button disabled={disableWallets} onClick={() => this.handleSegmentModal({name: contract_name, wallets: recent_wallets}, false)} icon basic>
                              <Icon name='address book outline' size='large' color='black' />
                              <p className='name'>Wallets</p>
                            </Button>
                            {/* <Button disabled={currentAppId !== '8d7312fa-5731-467b-bdd1-d18e5f84776a'} icon basic>
                              <Icon name='globe' size='large' color='green' onClick={() => this.setState({ webhookOpen: true })} />
                              <p className='name'>Connect</p>
                            </Button> */}
                            <Button onClick={() => this.deleteMonitoredContract(key, value, false)} icon basic>
                              <Icon color='red' name='trash alternate outline' size='large' />
                              <p className='name'>Delete</p>
                            </Button>
                          </Button.Group>
                        </Segment>
                      </Grid.Column>
                    )
                  })
                }
                </Grid>
              ) : null}
              </Grid.Column>
              <Grid.Column key='currsegs'>
                {/* <Header as='h3'>Current Segments</Header> */}
                {segments.length > 0 ? (
                <Grid columns={2}>
                {
                  segments.map(segment => {
                    const {name, users, version, id, resultData } = segment
                    let { blockId, userCount } = segment
                    if (version === '2.0' && resultData) {
                      blockId = resultData.block_id
                    }
                    if (!blockId) blockId = 'processing...'
                    const disableWallets = userCount < 1
                    let sId = name + userCount
                    if (name === 'All Users') return null
                    return (
                      <Grid.Column key={id}>
                        <Segment key={sId} color='blue' raised padded>
                          <Header as='h3' dividing>
                            <Header.Content>{name}</Header.Content>
                            <Header.Subheader color='grey' style={{marginTop: 5}}>
                               Updated at block: <a rel="noopener noreferrer" href={`https://etherscan.io/block/${blockId}`} target="_blank">{blockId}</a>
                            </Header.Subheader>
                            {!disableWallets && userCount ? (
                              <Label as='button' color='red' attached='top right' onClick={() => this.handleSegmentModal({name, wallets: users}, true)}>
                                {userCount}
                              </Label>
                            ) : userCount === "0" ? (
                              <Label as='a' color='grey' attached='top right'>
                                0
                              </Label>
                            ) : (
                              <Label as='a' color='grey' attached='top right'>
                                ....
                              </Label>
                            )
                            }
                          </Header>
                          <Button.Group>
                            <Button disabled={version !== '2.0' || !users} onClick={() => this.handleSegmentModal({name, wallets: users}, true)} icon basic>
                              <Icon name='list alternate outline' size='large' color='black' />
                              <p className='name'>TX Hash</p>
                            </Button>
                            <Button disabled={version !== '2.0' || !segment.filters} onClick={() => this.setState({showViewSegment: true, viewSegment: segment})} icon basic>
                              <Icon name='search' size='large' color='blue' />
                              <p className='name'>View</p>
                            </Button>
                            {/* <Button disabled={currentAppId !== '8d7312fa-5731-467b-bdd1-d18e5f84776a' || !users} icon basic>
                              <Icon name='globe' size='large' color='green' onClick={() => this.setState({ webhookOpen: true })} />
                              <p className='name'>Connect</p>
                            </Button> */}
                            <Button onClick={() => deleteSegment(this, segment, false)} icon basic>
                              <Icon color='red' name='trash alternate outline' size='large' />
                              <p className='name'>Delete</p>
                            </Button>
                          </Button.Group>
                        </Segment>
                      </Grid.Column>
                    )
                  })
                }
                </Grid>
              ) : null}
              {
                ((!segments || !segments.length) && (!monitoring || !Object.keys(monitoring).length)) ? (
                  <Message>
                    You haven't created any segments or started monitoring contracts yet, let's do that now!
                  </Message>
                ) : null
              }
              <Dialog
                isShown={showMonitoredDelete}
                title="Remove Monitored Contract?"
                onConfirm={() => this.deleteMonitoredContract(addressToUnmonitor, dataToUnMonitor, true)}
                onCancel={() => this.closeMonitoredModal()}
                onCloseComplete={() => this.closeMonitoredModal()}
                confirmLabel='Delete'
                intent="danger"
                width={640}
              >
                You're about to remove the monitored contract{" "}
                <strong>
                  <u>{dataToUnMonitor ? dataToUnMonitor.contract_name : null}</u>
                </strong>.
              </Dialog>
              <Dialog
                isShown={show}
                title="Delete Segment?"
                onConfirm={() => deleteSegment(this, seg, true)}
                onCancel={() => this.closeModal()}
                onCloseComplete={() => this.closeModal()}
                confirmLabel='Delete'
                intent="danger"
                width={640}
              >
                You're about to delete the segment{" "}
                <strong>
                  <u>{seg.name}</u>
                </strong>
                . Are you sure you want to do this? It can't be undone.
              </Dialog>
              <Dialog
                isShown={showSegmentModal}
                title={segmentToShow.name}
                onCloseComplete={() => this.setState({ showSegmentModal: false, segmentToShow: {}, showTransactions: false })}
                confirmLabel='Close'
                hasCancel={false}
                width={640}
              >
                <SegmentTable wallets={segmentToShow.wallets} showTransactions={showTransactions}  />
              </Dialog>
              <Dialog
                isShown={editSegment}
                title={newSegName}
                onCloseComplete={() => this.handleCloseSegmentModal()}
                hasFooter={false}
                width={640}
              >
                {editSegment ? this.renderCreateSegment(condition, addAnotherFilter) : '({close})'}
              </Dialog>
              <Dialog
                isShown={isCreateSegment}
                title='New Segment'
                onCloseComplete={() => {
                  ReactGA.event({
                    category: 'Segment',
                    action: 'Cancelled Create User Segment',
                  })
                  this.handleCloseSegmentModal()
                }}
                onCancel={() => {
                  this.handleCloseSegmentModal()
                }}
                onConfirm={() => createSegment(this)}
                confirmLabel="Create Segment"
                isConfirmDisabled={createSegmentDisabled}
                width={640}
                minHeightContent='40vh'
              >
                {isCreateSegment ? this.renderCreateSegment(null, addAnotherFilter): '({close})'}
              </Dialog>
              <Dialog
                isShown={importModalOpen}
                title="Import Smart Contract"
                onConfirm={() => {
                  this.setState({isLoading: true})
                  this.importUsers()}
                }
                onCancel={() => {
                  ReactGA.event({
                    category: 'Import',
                    action: 'Cancelled Import Smart Contract',
                  })
                  this.setState({ importModalOpen: false })}
                }
                onCloseComplete={() => this.setState({ importModalOpen: false })}
                confirmLabel='Import'
                isConfirmDisabled={!importAddress}
                width={640}
              >
                <MonitoredSmartContracts isLoading={isLoading} setImportAddress={(importAddress) => this.setState({importAddress})}/>
              </Dialog>
              <Dialog
                isShown={webhookOpen}
                title="Setup a webhook URL for your segment"
                onCancel={() => this.setState({ webhookOpen: false })}
                confirmLabel='Save'
                onCloseComplete={() => console.log('blah')}
                width={640}
              >
                You can add a webhook url where we will send segment updates to.
                <div>
                  <div className="top-15">
                    <Input
                      fluid
                      value={webhookUrl}
                      onChange={(e, {value}) => this.setState({ webhookUrl: value })}
                      placeholder="Enter webhook url..."
                    />
                  </div>
                </div>
              </Dialog>
              {viewSegment ? <Dialog
                isShown={showViewSegment}
                title={`Properties of Segment: ${viewSegment.name}`}
                onCloseComplete={() => this.setState({ showViewSegment: false, viewSegment: null })}
                hasCancel={false}
                confirmLabel='Close'
                width={640}
              >
                {
                  viewSegment.filters.map(filter => {
                    return (
                      <div>
                          <h3>Segment Type: {filter.type.toUpperCase()}</h3>
                          <div><h3>Segment Properties: </h3>{
                            Object.entries(filter.params).map
                            ( ([key, value]) => <li><b>&nbsp;&nbsp;{key}</b>: {value}</li> )
                            }
                            <li><b>&nbsp;&nbsp;Webhook:</b> {viewSegment.webHook.url}</li>
                          </div>
                          <br/>
                      </div>
                    )
                  })
                }
              </Dialog> : null}
            </Grid.Column>
          </Grid>
          <Dimmer active={processing}>
            <Loader inline='centered' indeterminate>{`${loadingMessage}...`}</Loader>
          </Dimmer>
          </div>
        </main>
      </div>
    )
  }
}
