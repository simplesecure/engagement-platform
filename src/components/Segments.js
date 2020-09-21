import React from "reactn";
import { Link } from "react-router-dom";
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
import DatePicker from "react-date-picker";
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
import contracts from './contracts.json'
import erc20 from './erc20.json'

export default class Segments extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      show: false,
      seg: "",
      existingSeg: false,
      allUsers: true,
      filterType: "",
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
      webhook: "",
      isCreateSegment: false
    }
  }

  closeModal = () => {
    this.setState({ show: false });
  };

  handleDateChange = (date) => {
    console.log("CHANGING DATE...", date);
    this.setState({ date });
  };

  handleSegmentModal = (seg) => {
    this.setState({ segmentToShow: seg, showSegmentModal: true });
  };

  handleEditSegment = async (seg, singleCondition) => {
    //  This function is re-used across both the edit segment functionality and the edit signle criteria functionality
    //  So we need to know a few things:
    //  We need to know if this is a singleCondition being edited (see singleCondition param)
    //  We need to know the segment or condition (represented by seg param)
    //  If this is a single condition in a filter, we need to set state appropriately (see the condition state variable below)
    const { allFilters } = this.global;
    await this.setState({
      segmentToShow: seg,
      condition: singleCondition ? seg : undefined,
    });
    const {
      segmentToShow,
      tokenAddress,
      contractAddress,
      filterType,
      operatorType,
      amount,
      rangeType,
      tokenType,
    } = this.state;
    let thisSeg = segmentToShow;
    if (
      seg.conditions &&
      seg.conditions.filterConditions &&
      seg.conditions.filterConditions.length > 0
    ) {
      await this.setState({ conditions: seg.conditions });
      const { filterConditions } = seg.conditions;
      const lastCondition = filterConditions[filterConditions.length - 1];
      const index = filterConditions
        .map((condition) => condition.id)
        .indexOf(lastCondition.id);
      thisSeg = lastCondition;
      if (index > -1) {
        filterConditions.splice(index, 1);
        let conditions = seg.conditions;
        conditions["filterConditions"] = filterConditions;
        await this.setState({ conditions: conditions });
      } else {
        console.log("Error with index");
      }
    }

    const filterToUse = allFilters.filter(
      (a) => a.filter === thisSeg.filter.filter
    )[0];

    this.setState({
      showSegmentModal: false,
      editSegment: true,
      newSegName: segmentToShow.name,
      contractAddress: thisSeg.contractAddress || contractAddress,
      filterType: (filterToUse) ? filterToUse.filter || filterType : null,
      rangeType: thisSeg.dateRange ? thisSeg.dateRange.rangeType : rangeType,
      operatorType: thisSeg.numberRange
        ? thisSeg.numberRange.operatorType
        : operatorType,
      amount: thisSeg.numberRange ? thisSeg.numberRange.amount : amount,
      tokenType: thisSeg.numberRange
        ? thisSeg.numberRange.tokenType
        : tokenType,
      tokenAddress: thisSeg.numberRange
        ? thisSeg.numberRange.tokenAddress
        : tokenAddress
    });
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

  handleOperatorChange = (e) => {
    const { conditions } = this.state;
    const operatorType = e.target.value;
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
    const { sessionData } = this.global
    const { importAddress } = this.state
    await getCloudServices().importWallets(sessionData.id, importAddress)
    this.setState({ importModalOpen: false, importAddress: "" })
  };

  renderMultipleConditions() {
    const { conditions, editSegment } = this.state;
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
                        compact
                        onChange={this.handleOperatorChange}
                        openOnFocus={false}
                        selection
                        options={[
                          { key: 'and', text: 'And', value: 'And' },
                          { key: 'or', text: 'Or', value: 'Or' }
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
                        compact
                        onChange={this.handleOperatorChange}
                        openOnFocus={false}
                        selection
                        options={[
                          { key: 'and', text: 'And', value: 'And' },
                          { key: 'or', text: 'Or', value: 'Or' }
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
      rangeType,
      operatorType,
      amount,
      tokenType,
      tokenAddress,
      delayBlocks,
      contractEvent,
      contractEventInput,
      web2Event
    } = this.state
    const { web2Analytics, contractData } = this.global
    const { type } = filterToUse
    const contractOptions = []
    contracts.forEach(el => {
      contractOptions.push({
        key: el.address,
        value: el.address,
        text: `${el.name} (${el.account}): ${el.address}`
      })
    })
    if (type === "Smart Contract Transactions") {
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
            options={contractOptions}
          />
        </div>
      )
    } else if (type === "Date Range") {
      return (
        <div className="row form-group col-md-12">
          <div className="col-lg-6 col-md-6 col-sm-12 mb-4">
            <label htmlFor="chartSty">Make a Selection</label>
            <Dropdown
              placeholder='Range...'
              onChange={(e, {value}) => this.setState({ rangeType: value })}
              value={rangeType}
              openOnFocus={false}
              fluid
              selection
              options={[
                { key: 'choose...', text: 'Choose...', value: 'choose...' },
                { key: 'before', text: 'Before', value: 'Before' },
                { key: 'after', text: 'After', value: 'After' }
              ]}
            />
          </div>
          <div className="col-lg-6 col-md-6 col-sm-12 mb-4">
            <DatePicker
              className="date-picker"
              onChange={this.handleDateChange}
              value={this.state.date}
            />
          </div>
        </div>
      )
    } else if (type === "Number Range") {
      const erc20Options = []
      erc20.forEach(e => {
        erc20Options.push({
          key: e.address,
          value: e.address,
          text: e.name
        })
      })
      return (
        <div className="row form-group col-md-12">
          <div className="col-12">
            <label htmlFor="tileName">Choose Token Type</label>
            <Dropdown
              placeholder='Choose token...'
              value={tokenType}
              onChange={(e, {value}) => this.setState({ tokenAddress: value })}
              openOnFocus={false}
              fluid
              selection
              options={erc20Options}
            />
            <br/>
          </div>
          <div className="col-lg-6 col-md-6 col-sm-12 mb-4">
            <label htmlFor="chartSty">Make a Selection</label>
            <Dropdown
              placeholder='Range...'
              value={operatorType}
              onChange={(e, {value}) => this.setState({ operatorType: value })}
              openOnFocus={false}
              fluid
              selection
              options={[
                { key: 'choose...', text: 'Choose...', value: 'choose...' },
                { key: 'more than', text: 'More Than', value: 'More Than' },
                { key: 'less than', text: 'Less Than', value: 'Less Than' }
              ]}
            />
          </div>
          <div className="col-lg-6 col-md-6 col-sm-12 mb-4">
            <label htmlFor="tileName">Enter Amount</label>
            <Input
              placeholder="Wallet Balance Amount"
              type="number"
              value={amount}
              fluid
              onChange={(e, {value}) => this.setState({ amount: value })}
            />
          </div>
        </div>
      )
    } else if (type === "Delay Range") {
      return (
        <div className="form-group col-md-12">
          <label htmlFor="contractAddress">Enter The Number of Blocks</label>
          <Input
            placeholder="Number of Eth Blocks"
            fluid
            type="number"
            value={delayBlocks}
            onChange={(e, {value}) => this.setState({ delayBlocks: value })}
          />
        </div>
      )
    } else if (type === "Smart Contract Events") {
      let contractOptions = {}
      let contracts = []
      let dataInputs = []
      if (!contractData) {
        return (
          <Message>
            You haven't imported any smart contracts to trigger on.
          </Message>
        )
      }
      else {
        contractData.forEach(element => {
          const { address, mappings, name } = element
          const contractValue = `${name}: ${address}`
          contracts.push({
            key: contractValue,
            text: contractValue,
            value: address
          })
          const { events, eventMap } = mappings
          let options = []
          events.forEach((item) => {
            options.push({
              key: item,
              text: item,
              value: item
            })
          })
          contractOptions[address] = options
          eventMap.forEach((item) => {
            const nm = item.name
            const { inputs } = item
            let inputOptions = []
            inputs.forEach((it) => {
              if (!it.indexed || it.type === 'uint256') {
                inputOptions.push({
                  key: it.name,
                  text: it.name,
                  value: it.name
                })
              }
            })
            dataInputs[nm] = inputOptions
          })
        })
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
              options={contracts}
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
                    options={contractOptions[contractAddress]}
                  />
                </div>
                <div className="col-lg-6 col-md-6 col-sm-12 mb-4">
                  <label htmlFor="contractAddress">Pick Input To Track</label>
                  <Dropdown
                    placeholder='Choose Input...'
                    value={contractEventInput}
                    onChange={(e, {value}) => this.setState({ contractEventInput: value })}
                    openOnFocus={false}
                    fluid
                    selection
                    options={dataInputs[contractEvent]}
                  />
                </div>
              </div>
            ) : null}
            {contractEventInput ? (
              <div className="row form-group">
                <div className="col-lg-6 col-md-6 col-sm-12 mb-4">
                  <label htmlFor="chartSty">Comparison Logic</label>
                  <Dropdown
                    placeholder='Range...'
                    value={operatorType}
                    onChange={(e, {value}) => this.setState({ operatorType: value })}
                    openOnFocus={false}
                    fluid
                    selection
                    options={[
                      { key: 'choose...', text: 'Choose...', value: 'choose...' },
                      { key: 'equal', text: 'Equal', value: '==' },
                      { key: 'more than', text: 'More Than', value: '>' },
                      { key: 'more than equal', text: 'More Than || Equal', value: '>=' },
                      { key: 'less than', text: 'Less Than', value: '<' },
                      { key: 'less than equal', text: 'Less Than || Equal', value: '<=' }
                    ]}
                  />
                </div>
                <div className="col-lg-6 col-md-6 col-sm-12 mb-4">
                  <label htmlFor="tileName">Enter Amount</label>
                  <Input
                    placeholder="Event Amount"
                    fluid
                    type="number"
                    value={amount}
                    onChange={(e, {value}) => this.setState({ amount: value })}
                  />
                </div>
              </div>
            ) : null}
          </div>
        )
      }
    } else if (type === "Web2 Selection") {
      let web2Events = []
      if (web2Analytics && web2Analytics.data) {
        const events = web2Analytics.data
        events.forEach(it => {
          web2Events.push({
            key: it,
            value: it,
            text: it
          })
        })
        return (
          <div className="form-group col-md-12">
            <label htmlFor="contractAddress">Pick Smart Contract</label>
            <Dropdown
              placeholder='Choose Contract...'
              value={web2Event}
              onChange={(e, {value}) => this.setState({ web2Event: value })}
              openOnFocus={false}
              fluid
              selection
              options={web2Events}
            />
          </div>
        )
      } else {
        return (
          <Message>
            You haven't imported stored any Web2 events yet.
          </Message>
        )
      }
    }
  }

  renderCreateSegment(condition) {
    const { allFilters } = this.global
    const {
      tokenAddress,
      tokenType,
      editSegment,
      dashboardShow,
      filterType,
      newSegName
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
      filter.disabled = !filter.enabled
    })
    return (
      <div>
        {this.renderMultipleConditions()}
        <div className="form-group col-md-12">
          <label htmlFor="chartSty">Choose a Filter</label>
          <Dropdown
            placeholder='Choose a Filter...'
            value={filterType}
            onChange={(e, {value}) => this.setState({ filterType: value })}
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
            <Button onClick={() => {
              this.setState({filterType: null})
              addFilter(this)}
            } positive>
              Add Another Filter
            </Button>
          </div>
        ) : (
          <div />
        )}

        {/*<div className="form-group col-md-12">
          <label htmlFor="dashboardShow">Show on Dashboard</label>
          <Dropdown
            value={dashboardShow}
            placeholder='Show on dashboard...'
            onChange={(e, { value }) => {
              this.setState({ dashboardShow: value })
            }}
            openOnFocus={false}
            fluid
            selection
            options={[
              { key: 'yes', text: 'Yes', value: 'Yes' },
              { key: 'no', text: 'No', value: 'No' }
            ]}
          />
          </div>*/}
        {0 && editSegment && !condition ? (
          <div>
            <div className="form-group col-md-12">
              <label htmlFor="tileName">Update Segment Name</label>
              <Input
                placeholder="Give it a name"
                fluid
                onChange={(e, {value}) => this.setState({ newSegName: value })}
                value={newSegName}
                type="text"
                id="tileName"
              />
            </div>
            <div className="form-group col-md-12">
              <label htmlFor="chartSty">Update The Segment</label>
              <br />
              {createCriteria ? (
                <Button
                  onClick={() => updateSegment(this)}
                  primary
                >
                  Update Segment
                </Button>
              ) : (
                <Button disabled>
                  Update Segment
                </Button>
              )}
            </div>
          </div>
        ) : editSegment && condition && condition.id ? (
          <div>
            <div className="form-group col-md-12">
              <label htmlFor="chartSty">Update The Filter Condition</label>
              <br />
              {createCriteria ? (
                <Button onClick={() => {
                  addFilter(this, condition)}
                } positive>
                  Update Filter
                </Button>
              ) : (
                <Button disabled>
                  Update Filter
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div>
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
        )}
      </div>
    );
  }

  render() {
    const { sessionData, processing, anOrgStatusObj, currentAppId } = this.global;
    const { currentSegments } = sessionData;
    const {
      importAddress,
      proxyAddress,
      importModalOpen,
      loadingMessage,
      condition,
      editSegment,
      showSegmentModal,
      segmentToShow,
      show,
      seg,
      newSegName,
      webhookOpen,
      webhook,
      isCreateSegment
    } = this.state;
    const segments = currentSegments ? currentSegments : [];
    const defaultSegments = ['All Users', 'Monthly Active Users', 'Weekly Active Users']
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
                    <Header as='h3'>Create a Segment</Header>
                    <Button
                      content='Create User Segment'
                      icon='write'
                      labelPosition='left'
                      onClick={() => this.setState({isCreateSegment: true})}
                      primary
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
                    <Header as='h3'>Import Wallets</Header>
                    <Button
                      onClick={() => this.setState({ importModalOpen: true })}
                      positive
                      icon='download'
                      labelPosition='left'
                      content='Monitor Smart Contract'
                    />
                  </Grid.Column>
                </Grid>
              </Grid.Column>
              <Grid.Column key='currsegs'>
                <Header as='h3'>Current Segments</Header>
                {segments.length > 1 ? (
                <Grid columns={2}>
                {
                  segments.map(segment => {
                    const disableButton = defaultSegments.indexOf(segment.name) < 0
                    const disableWallets = segment.userCount < 1
                    let { blockId, version } = segment
                    if (!blockId && version === '2.0') {
                      if (segment.resultData) {
                        blockId = segment.resultData.block_id
                      }
                    }
                    if (segment.name === 'All Users') return null
                    return (
                      <Grid.Column key={segment.id}>
                        <Segment raised padded>
                          <Header as='h3' dividing>
                            <Header.Content>{segment.name}</Header.Content>
                            <Header.Subheader color='grey' style={{marginTop: 5}}>
                               Updated at block: <a rel="noopener noreferrer" href={`https://etherscan.io/block/${blockId}`} target="_blank">{blockId}</a>
                            </Header.Subheader>
                            {!disableWallets && segment.hasOwnProperty('userCount')? (
                              <Label as='button' color='red' attached='top right' onClick={() => this.handleSegmentModal(segment)}>
                                {segment.userCount}
                              </Label>
                            ) : (
                              <Label as='a' color='grey' attached='top right'>
                                0
                              </Label>
                            )
                            }
                          </Header>
                          <Button.Group>
                            <Button disabled={disableWallets || version === '2.0'} onClick={() => this.handleSegmentModal(segment)} icon basic>
                              <Icon name='users' size='large' color='black' />
                              <p className='name'>Wallets</p>
                            </Button>
                            {/* disable this feature for R1
                            {disableButton ? <Button onClick={() => this.handleEditSegment(segment)} icon basic>
                              <Icon name='edit' size='large' color='blue' />
                              <p className='name'>Edit</p>
                            </Button> : null}*/}
                            <Button disabled={true} icon basic>
                              <Icon name='globe' size='large' color='green' onClick={() => this.setState({ webhookOpen: true })} />
                              <p className='name'>Connect</p>
                            </Button>
                            {disableButton ? <Button onClick={() => deleteSegment(this, segment, false)} icon basic>
                              <Icon color='red' name='trash alternate outline' size='large' />
                              <p className='name'>Delete</p>
                            </Button> : null}
                          </Button.Group>
                        </Segment>
                      </Grid.Column>
                    )
                  })
                }
                </Grid>
              ) : (
                <Message>
                  You haven't created any segments yet, let's do that now!
                </Message>
              )}
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
                onCloseComplete={() => this.setState({ showSegmentModal: false, segmentToShow: {} })}
                confirmLabel='Close'
                hasCancel={false}
                width={640}
              >
                <SegmentTable segment={segmentToShow} />
              </Dialog>
              <Dialog
                isShown={editSegment}
                title={newSegName}
                onCloseComplete={() => this.handleCloseSegmentModal()}
                hasFooter={false}
                width={640}
              >
                {editSegment ? this.renderCreateSegment(condition) : '({close})'}
              </Dialog>
              <Dialog
                isShown={isCreateSegment}
                title='New Segment'
                onCloseComplete={() => {
                  this.handleCloseSegmentModal()
                }}
                onConfirm={() => createSegment(this)}
                confirmLabel="Create Segment"
                width={640}
                minHeightContent='40vh'
              >
                {isCreateSegment ? this.renderCreateSegment(): '({close})'}
              </Dialog>
              <Dialog
                isShown={importModalOpen}
                title="Monitor Smart Contract"
                onConfirm={() => this.importUsers()}
                onCancel={() => this.setState({ importModalOpen: false })}
                onCloseComplete={() => this.setState({ importModalOpen: false })}
                confirmLabel='Import'
                isConfirmDisabled={!importAddress}
                width={640}
              >
                You can import wallets to monitor based on their interactions with smart contracts.
                <MonitoredSmartContracts setImportAddress={(importAddress) => this.setState({importAddress})}/>
                {/*
                <div>
                  <div className="top-15">
                    <label htmlFor="chartSty">Enter <b>smart contract</b> address to monitor: </label>
                    <Input
                      fluid
                      value={importAddress}
                      onChange={(e, {value}) => this.setState({ importAddress: value })}
                      placeholder="0xa1b2c3d4e5f6g7h8i9j..."
                    />
                  </div>
                  {/* <div className="top-15">
                    <label htmlFor="chartSty">Enter <b>proxy</b> smart contract to assocaite & import: </label>
                    <Input
                      fluid
                      value={proxyAddress}
                      onChange={(e, {value}) => this.setState({ proxyAddress: value })}
                      placeholder="0x123456789..."
                    />
                  </div>
                </div> */}
              </Dialog>
              <Dialog
                isShown={webhookOpen}
                title="Setup a webhook URL for your segment"
                onCancel={() => this.setState({ webhookOpen: false })}
                confirmLabel='Save'
                width={640}
              >
                You can add a webhook url where we will send segment updates to.
                <div>
                  <div className="top-15">
                    <Input
                      fluid
                      value={webhook}
                      onChange={(e, {value}) => this.setState({ webhook: value })}
                      placeholder="Enter webhook url..."
                    />
                  </div>
                </div>
              </Dialog>
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
