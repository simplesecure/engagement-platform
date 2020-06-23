import React, { setGlobal } from "reactn";
import StickyNav from "./StickyNav";
import {
  Dialog,
  SideSheet
} from 'evergreen-ui'
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
  Modal
} from 'semantic-ui-react'
import BlockDiagram from './BlockDiagram'
import SideNav from '../components/SideNav';
import InputGroup from "react-bootstrap/InputGroup";
import FormControl from "react-bootstrap/FormControl";
import SegmentTable from "./SegmentTable";
import * as dc from "./../utils/dynamoConveniences.js";
import DatePicker from "react-date-picker";
import uuid from "uuid/v4";
import { setLocalStorage } from "../utils/misc";
import { getCloudUser } from "./../utils/cloudUser.js";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  createSegment,
  updateSegment,
  deleteSegment,
  addFilter,
  clearState
} from './SegmentHelpers'

const listToArray = require("list-to-array");
const NETWORK_OPTIONS = ["mainnet", "ropsten", "rinkeby", "goerli", "kovan"];

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
      listOfAddresses: "",
      operator: "",
      conditions: {},
      condition: {},
      importModalOpen: false,
      importAddress: "",
      selectedNetwork: "mainnet",
      showBlockDiagram: false
    };
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

  toggleBlocky = () => {
    this.setState({ showBlockDiagram: !this.state.showBlockDiagram })
  }

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
      filterType: filterToUse.filter || filterType,
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
        : tokenAddress,
      listOfAddresses:
        thisSeg.filter.type === "Paste" ? thisSeg.users.join(",") : "",
    });
  };

  handleCloseSegmentModal = () => {
    this.setState({
      showSegmentModal: false,
      editSegment: false,
    });
    clearState(this);
  };

  handleRefreshData = async () => {
    toast.success("Refreshing Dashboard Data...", {
      position: toast.POSITION.TOP_RIGHT,
      autoClose: 2000,
    });
    getCloudUser().fetchOrgDataAndUpdate();
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

  importUsers = () => {
    const { sessionData } = this.global;
    const { importAddress, network } = this.state;
    const importWalletsCmdObj = {
      command: "importWallets",
      data: {
        appId: sessionData.id,
        contractAddress: importAddress,
        network,
        options: {
          transactions_per_page: 100,
          max_transactions: 250000,
        },
      },
    };

    console.log(
      "Calling import addresses from wallets:\n",
      JSON.stringify(importWalletsCmdObj, 0, 2)
    );
    toast.success(
      <div>
        Importing users. You'll get a notification when it's complete. View
        progress by clicking Job Queue on the sidebar.
      </div>,
      {
        position: toast.POSITION.TOP_RIGHT,
        autoClose: 10000,
      }
    );
    getCloudUser().processData("import", importWalletsCmdObj);
    this.setState({ importModalOpen: false, importAddress: "" });
  };

  renderNetworksDrop() {
    return (
      <div>
        <label>Choose Ethereum Network</label>
        <select
          onChange={(e) => this.setState({ network: e.target.value })}
          className="form-control"
        >
          {NETWORK_OPTIONS.map((network) => {
            return <option value={network}>{network}</option>;
          })}
        </select>
      </div>
    );
  }

  renderMultipleConditions() {
    const { conditions, editSegment } = this.state;
    const { filterConditions } = conditions;

    if (filterConditions && filterConditions.length > 0) {
      return (
        <div>
          {filterConditions.map((condition) => {
            return (
              <div key={condition.id} className="form-group col-md-12">
                <p>
                  {
                    filterConditions.map((a) => a.id).indexOf(condition.id) ===
                      0 && filterConditions.length === 1 ? (
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
                    ) : filterConditions
                        .map((a) => a.id)
                        .indexOf(condition.id) === 0 ? (
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
                    ) : (
                      <Dropdown
                        placeholder='Operator...'
                        compact
                        onChange={this.handleOperatorChange}
                        openOnFocus={false}
                        disabled
                        selection
                        options={[
                          { key: 'and', text: 'And', value: 'And' },
                          { key: 'or', text: 'Or', value: 'Or' }
                        ]}
                      />
                    )
                    // <button onClick={() => this.setState({ operator: operator === "And" ? "Or" : "And"})} className="btn btn-flat">{operator}</button> :
                    // <button className="btn btn-flat" disabled>{operator}</button>
                  }
                  <br />
                  <br />
                  <span>
                    {editSegment ? <div /> : (
                      <Button.Group>
                        <Button onClick={() => this.handleEditSegment(condition, true)} animated>
                          <Button.Content visible>{condition.filter.filter}</Button.Content>
                          <Button.Content hidden>
                            <Icon name='wrench' />
                          </Button.Content>
                        </Button>
                        <Button.Or />
                        <Button onClick={() => this.deleteCondition(condition)} color='red'>Delete</Button>
                      </Button.Group>
                    )}
                  </span>
                </p>
              </div>
            );
          })}
        </div>
      );
    } else {
      return <div />;
    }
  }

  renderCreateSegment(condition) {
    const { allFilters, experimentalFeatures } = this.global;
    const {
      listOfAddresses,
      tokenAddress,
      tokenType,
      editSegment,
      dashboardShow,
      filterType,
      newSegName,
      rangeType,
      operatorType,
      amount,
      contractAddress,
    } = this.state;
    const showOnDashboard = dashboardShow === "Yes" ? true : false;
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
    options.map(filter => {
      filter.text = filter.filter
      filter.key = filter.filter
      filter.value = filter.filter
    })
    return (
      <div>
        {this.renderMultipleConditions()}
        <div className="form-group col-md-12">
          {experimentalFeatures ? this.renderNetworksDrop() : <div />}
        </div>
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
        {filterToUse && filterToUse.type === "Contract" ? (
          <div className="form-group col-md-12">
            <label htmlFor="contractAddress">Enter The Contract Address</label>
            <Input placeholder="Contract Address" fluid>
              <input
                type="text"
                value={contractAddress}
                onChange={(e) => this.setState({ contractAddress: e.target.value })}
              />
            </Input>
          </div>
        ) : filterToUse && filterToUse.type === "Date Range" ? (
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
        ) : filterToUse && filterToUse.type === "Number Range" ? (
          <div className="row form-group col-md-12">
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
              <Input placeholder="Wallet Balance Amount">
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => this.setState({ amount: e.target.value })}
                />
              </Input>
            </div>
            <div className="col-lg-6 col-md-6 col-sm-12 mb-4">
              <label htmlFor="tileName">Choose Token</label>
              <Dropdown
                placeholder='Token'
                value={tokenType}
                onChange={(e, {value}) => this.setState({ tokenType: value })}
                openOnFocus={false}
                fluid
                selection
                options={[
                  { key: 'choose...', text: 'Choose...', value: 'choose...' },
                  { key: 'ether', text: 'Ether', value: 'Ether' },
                  { key: 'erc-20', text: 'ERC-20', value: 'ERC-20' }
                ]}
              />
            </div>
            {tokenType === "ERC-20" ? (
              <div className="col-lg-6 col-md-6 col-sm-12 mb-4">
                <label htmlFor="erc20Address">Enter ERC-20 Token Address</label>
                <Input placeholder="Enter Token Address" fluid>
                  <input id="erc20Address" type="text" value={tokenAddress} onChange={(e) => this.setState({ tokenAddress: e.target.value })}/>
                </Input>
              </div>
            ) : (
              <div />
            )}
          </div>
        ) : filterToUse && filterToUse.type === "Paste" ? (
          <div className="col-lg-12 col-md-12 col-sm-12 mb-4">
            <label htmlFor="pastedAddress">
              Paste comma delimited list of wallet addresses
            </label>
            <textarea
              value={listOfAddresses}
              className="form-control"
              onChange={(e) =>
                this.setState({ listOfAddresses: e.target.value })
              }
            ></textarea>
          </div>
        ) : (
          <div />
        )}

        {filterToUse &&
        filterToUse.type !== "Paste" &&
        filterToUse.type !== "web2" ? (
          <div className="form-group col-md-12">
            <Button onClick={() => addFilter(this)} positive>
              Add Another Filter
            </Button>
          </div>
        ) : (
          <div />
        )}

        <div className="form-group col-md-12">
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
        </div>
        {editSegment && !condition ? (
          <div>
            <div className="form-group col-md-12">
              <label htmlFor="tileName">Update Segment Name</label>
              <Input placeholder="Give it a name" fluid>
                <input
                  onChange={(e) => this.setState({ newSegName: e.target.value })}
                  value={newSegName}
                  type="text"
                  id="tileName"
                />
              </Input>
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
                <Button
                  onClick={() => addFilter(this, condition)}
                  primary
                >
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
              <Input placeholder="Give it a name" fluid>
                <input type="text" value={newSegName} onChange={(e) => this.setState({ newSegName: e.target.value })}/>
              </Input>
            </div>
            <div className="form-group col-md-12">
              <label htmlFor="chartSty">Finally, Create The Segment</label>
              <br />
              {createCriteria ? (
                <Button
                  onClick={() => createSegment(this)}
                  primary
                >
                  Create Segment
                </Button>
              ) : (
                <div>
                  <Button primary disabled>
                    Create Segment
                  </Button>
                  <Button secondary onClick={() => this.toggleBlocky()}>
                    Create Block Diagram
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  render() {
    const {
      sessionData,
      processing,
      experimentalFeatures,
      plan,
      aBlockId
    } = this.global;
    const { currentSegments } = sessionData;

    const {
      importAddress,
      importModalOpen,
      loadingMessage,
      condition,
      editSegment,
      showSegmentModal,
      segmentToShow,
      show,
      seg,
      existingSeg,
      newSegName,
      existingSegmentToFilter,
      showBlockDiagram
    } = this.state;
    const segments = currentSegments ? currentSegments : [];
    const defaultSegments = ['All Users', 'Monthly Active Users', 'Weekly Active Users']
    if (showBlockDiagram) {
      return (
        <Modal
          basic
          dimmer
          closeOnDimmerClick={false}
          open={showBlockDiagram}
          onClose={() => this.toggleBlocky()}
        >
          <Modal.Actions textAlign="left">
            <Button
              onClick={() => this.toggleBlocky()}
              icon='close'
              labelPosition='right'
              content='Close'
            />
            <Button
              onClick={() => this.toggleBlocky()}
              primary
              icon='checkmark'
              labelPosition='right'
              content='Save'
            />
          </Modal.Actions>
          <Modal.Content>
            <BlockDiagram />
          </Modal.Content>
        </Modal>
      )
    }
    else {
      return (
        <div>
          <SideNav />
          <main className="main-content col-lg-10 col-md-9 col-sm-12 p-0 offset-lg-2 offset-md-3">
            <div className="main-content-container container-fluid px-4">
              <div className="page-header row no-gutters py-4">
                <div className="col-lg-6 col-md-6 col-sm-12 mb-4">
                  <span className="text-uppercase page-subtitle">Segments</span>
                  <h3 className="page-title">
                    Group People Using Your App{" "}
                    <span
                      onClick={this.handleRefreshData}
                      className="clickable refresh"
                    >
                      <i className="fas fa-sync-alt"></i>
                    </span>
                  </h3>
                </div>

                <br />
                {plan === "enterprise" || plan === "premium"  || plan === undefined ? (
                  <div className="col-lg-6 col-md-6 col-sm-12 mb-4 text-right">
                    <span className="text-uppercase page-subtitle">
                      Import Users
                    </span>
                    <div>
                      <Button
                        onClick={() => this.setState({ importModalOpen: true })}
                        positive
                      >
                        Import By Smart Contract
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div />
                )}
              </div>
              {/*<SideSheet
                isShown={showBlockDiagram}
                onCloseComplete={() => this.toggleBlocky()}
                containerProps={{
                  marginTop: 60,
                  display: 'flex',
                  flex: '1',
                  flexDirection: 'column'
                }}
              >
                <BlockDiagram />
              </SideSheet>*/}
              <Grid stackable columns={2}>
                <Grid.Column key='currsegs'>
                  <h5>Current Segments</h5>
                  {segments.length > 0 ? (
                    <Grid columns={2}>
                    {
                      segments.map(segment => {
                        const disableButton = defaultSegments.indexOf(segment.name) < 0
                        const disableWallets = segment.userCount < 1
                        return (
                          <Grid.Column key={segment.id}>
                            <Segment raised padded>
                              {!disableWallets ? (
                                <Label as='a' color='red' attached='top right'>
                                  {aBlockId}
                                </Label>
                                ) : null
                              }
                              <Header as='h3'>{segment.name}</Header>
                              <Button
                                disabled={disableWallets}
                                onClick={() => this.handleSegmentModal(segment)}
                                content='Wallets'
                                icon='id card outline'
                                label={{
                                  as: 'a',
                                  basic: true,
                                  color: 'grey',
                                  pointing: 'left',
                                  content: segment.userCount
                                }}
                              />
                              <Button.Group>
                                {/*<Button disabled={disableWallets} onClick={() => this.handleSegmentModal(segment)} icon basic>
                                  <Icon name='users' size='small' color='blue' />
                                  <p className='name'>Wallets</p>
                                </Button>*/}
                                <Button disabled={!disableButton} onClick={() => this.handleEditSegment(segment)} icon basic>
                                  <Icon name='edit' size='large' color='blue' />
                                  <p className='name'>Edit</p>
                                </Button>
                                <Button icon basic>
                                  <Icon name='fork' size='large' color='green' />
                                  <p className='name'>Connect</p>
                                </Button>
                                <Button disabled={!disableButton} onClick={() => deleteSegment(this, segment, false)} icon basic>
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
                  ) : (
                    <ul className="tile-list">
                      <li className="card">
                        <span className="card-body">
                          You haven't created any segments yet, let's do that now!.
                        </span>
                      </li>
                    </ul>
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
                    <SegmentTable seg={segmentToShow} />
                  </Dialog>
                  <Dialog
                    isShown={editSegment}
                    title={newSegName}
                    onCloseComplete={() => this.handleCloseSegmentModal()}
                    hasFooter={false}
                    width={640}
                  >
                    {this.renderCreateSegment(condition)}
                  </Dialog>
                  <Dialog
                    isShown={importModalOpen}
                    title="Import Wallets via Smart Contract"
                    onConfirm={() => this.importUsers()}
                    onCancel={() => this.setState({ importModalOpen: false })}
                    onCloseComplete={() => this.setState({ importModalOpen: false })}
                    confirmLabel='Import'
                    width={640}
                  >
                    You can import your users based on your smart contracts.
                    Simply enter a smart contract address and we will import all
                    of the addresses that have interacted with that address.
                    <div className="form-group col-md-12">
                      {experimentalFeatures ? this.renderNetworksDrop() : <div />}
                      <div className="top-15">
                        <label>Enter Contract Address</label>
                        <InputGroup className="mb-3 form-group">
                          <FormControl
                            type="text"
                            className="form-control"
                            value={importAddress}
                            onChange={(e) =>
                              this.setState({ importAddress: e.target.value })
                            }
                            placeholder="0x..."
                          />
                        </InputGroup>
                      </div>
                    </div>
                  </Dialog>
                </Grid.Column>
                <Grid.Column key='datainput'>
                  <h5>Create a Segment</h5>
                  {existingSeg ? (
                    <div className="form-group col-md-12">
                      <label htmlFor="inputSeg">Now, Choose a Segment</label>
                      <select
                        value={existingSegmentToFilter}
                        onChange={(e) =>
                          this.setState({ existingSegmentToFilter: e.target.value })
                        }
                        id="inputSeg"
                        className="form-control"
                      >
                        <option value="Choose...">Choose...</option>
                        {segments.map((seg) => {
                          return (
                            <option value={seg.name} key={seg.id}>
                              {seg.name}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                  ) : (
                    <div />
                  )}
                  {plan === "enterprise" ||
                  plan === "premium" ||
                  plan === undefined ||
                  segments.length < 4 ? (
                    this.renderCreateSegment()
                  ) : (
                    <div>
                      <h5>Upgrade to create more segments</h5>
                      <a
                        className="btn btn-primary"
                        href="mailto:support@simpleid.xyz"
                      >
                        Contact Us To Upgrade
                      </a>
                    </div>
                  )}
              </Grid.Column>
              <Dimmer active={processing}>
                <Loader inline='centered' indeterminate>{`${loadingMessage}...`}</Loader>
              </Dimmer>
            </Grid>
            </div>
          </main>
        </div>
      )
    }
  }
}
