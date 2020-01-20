import React, { setGlobal } from 'reactn';
import StickyNav from './StickyNav';
import Modal from 'react-bootstrap/Modal';
import Accordion from 'react-bootstrap/Accordion';
import Card from 'react-bootstrap/Card';
import DemoTable from './DemoTable';
import { putInOrganizationDataTable, getFromOrganizationDataTable } from '../utils/awsUtils.js';
import filters from '../utils/filterOptions.json';
import DatePicker from 'react-date-picker';
import uuid from 'uuid/v4';
import { setLocalStorage } from '../utils/misc';
import LoadingModal from './LoadingModal';
const ERROR_MSG = "There was a problem creating the segment, please try again. If the problem continues, contact support@simpleid.xyz."

export default class Segments extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      show: false,
      seg: "",
      existingSeg: false,
      allUsers: true,
      filterType: "Choose...",
      rangeType: "Choose...",
      operatorType: "Choose...", 
      newSegName: "", 
      date: new Date(), 
      amount: 0, 
      contractAddress: "", 
      existingSegmentToFilter: "Choose...", 
      tokenType: "Choose...", 
      tokenAddress: ""
    }
  }

  deleteSegment = async(seg, confirm) => {
    const { sessionData, SESSION_FROM_LOCAL, apps, org_id } = this.global;
    const { currentSegments } = sessionData;
    this.setState({ seg });
    if(confirm) {
      const index = currentSegments.map(a => a.id).indexOf(seg.id);
      if(index > -1) {
        currentSegments.splice(index, 1);
        sessionData.currentSegments = currentSegments;
        //Update in DB
        const thisApp = apps[sessionData.id];
        thisApp.currentSegments = currentSegments;
        setGlobal({ sessionData, apps });
        const orgData = await getFromOrganizationDataTable(org_id);

        try {
          const anObject = orgData.Item
          anObject.apps = apps;
          anObject[process.env.REACT_APP_OD_TABLE_PK] = org_id
          await putInOrganizationDataTable(anObject)
        } catch (suppressedError) {
          console.log(`ERROR: problem writing to DB.\n${suppressedError}`)
        }

        setLocalStorage(SESSION_FROM_LOCAL, JSON.stringify(sessionData));
        this.setState({ show: false });
      } else {
        console.log("Error with index");
      }
    } else {
      this.setState({ show: true });
    }
  }

  closeModal = () => {
    this.setState({ show: false });
  }

  createSegment = async () => {
    const { sessionData, SESSION_FROM_LOCAL, org_id, apps, simple } = this.global;
    const { currentSegments } = sessionData;
    const { newSegName, tokenType, tokenAddress, filterType, rangeType, operatorType, amount, date, contractAddress, allUsers, existingSegmentToFilter } = this.state;
    const segments = currentSegments ? currentSegments : [];
    const filterToUse = filters.filter(a => a.filter === filterType)[0];
    const segId = uuid();
    setGlobal({ processing: true });
    //First we set the segment criteria to be stored
    const segmentCriteria = {
      appId: sessionData.id,
      id: segId,
      name: newSegName, 
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
      userCount: null
    }

    //Now we fetch the actual results

    //This state should trigger a UI element showing the segment being created (could take a while)
    setGlobal({ processingSegment: true });
    
    //Here we need to use the iframe to process the segment criteria and return the necessary data
    const data = await simple.processData('segment', segmentCriteria);
    
    if(data) {
      if(filterToUse.filter === "Total Transactions") {
        segmentCriteria.totalTransactions = data;
      } else {
        segmentCriteria.userCount = data.length;
        segmentCriteria.users = data;
      }
    }

    //Then we store the segment with an empty slot for the user count
    //TODO: we need to also look at showing the wallets and other meta data (see demo app)

    segments.push(segmentCriteria);
    sessionData.currentSegments = segments;

    const thisApp = apps[sessionData.id]
    thisApp.currentSegments = segments
    apps[sessionData.id] = thisApp;

    setGlobal({ sessionData, apps });
    // Put the new segment in the analytics data for the user signed in to this
    // id:
    //      Each App (SimpleID Customer) will have an app_id
    //      Each App can have multiple Customer Users (e.g. Cody at Lens and one of his Minions)
    //      A segment will be stored in the DB under the primary key 'app_id' in
    //      the appropriate user_id's segment storage:
    
    
    // TODO: probably want to wait on this to finish and throw a status/activity
    //       bar in the app:
    const orgData = await getFromOrganizationDataTable(org_id);

    try {
      const anObject = orgData.Item
      anObject.apps = apps;
      anObject[process.env.REACT_APP_OD_TABLE_PK] = org_id
      await putInOrganizationDataTable(anObject)
      setLocalStorage(SESSION_FROM_LOCAL, JSON.stringify(sessionData));
    } catch (suppressedError) {
      setGlobal({ processing: false, error: ERROR_MSG });
      console.log(`ERROR: problem writing to DB.\n${suppressedError}`)
    }
    setGlobal({ processing: false });
    this.setState({ tokenType: "Choose...", newSegName: "", filterType: "Choose...", contractAddress: "", rangeType: "", operatorType: "", date: new Date(), amount: 0 });
  }

  handleDateChange = (date) => {
    this.setState({ date });
  }

  render() {
    const { sessionData, processing } = this.global;
    const { currentSegments } = sessionData;
    const { show, tokenAddress, tokenType, seg, existingSeg, filterType, newSegName, rangeType, operatorType, amount, contractAddress, existingSegmentToFilter } = this.state;
    const segments = currentSegments ? currentSegments : [];
  
    const filterToUse = filters.filter(a => a.filter === filterType)[0];
    return(
      <main className="main-content col-lg-10 col-md-9 col-sm-12 p-0 offset-lg-2 offset-md-3">
        <StickyNav />

        <div className="main-content-container container-fluid px-4">
          <div className="page-header row no-gutters py-4">
            <div className="col-12 col-sm-4 text-center text-sm-left mb-0">
              <span className="text-uppercase page-subtitle">Segments</span>
              <h3 className="page-title">Group People Using Your App</h3>
            </div>
          </div>
          <div className="row">
            <div className="col-lg-6 col-md-6 col-sm-12 mb-4">
              <h5>Current Segments</h5>
              {
                segments.length > 0 ?
                <ul className="tile-list">
                  {
                    segments.map(seg => {
                      return (
                        <Accordion className="clickable accordion-tile" key={seg.id} defaultActiveKey="1">
                          <Card className="standard-tile">
                            <Card.Header>
                              <Accordion.Toggle as={"li"} variant="link" eventKey="0">
                                <span className="seg-title">{seg.name}</span><br/><span className="seg-count">{seg.totalTransactions ? seg.totalTransactions : seg.userCount} {seg.totalTransactions ? "transactions" : "users"}</span><span onClick={() => this.deleteSegment(seg, false)} className="right clickable text-danger">Delete</span>
                              </Accordion.Toggle>
                            </Card.Header>
                            <Card.Body>
                              <Accordion.Collapse eventKey="0">
                                <DemoTable seg={seg} />
                              </Accordion.Collapse>
                            </Card.Body>
                          </Card>
                        </Accordion>
                      )
                    })
                  }
                </ul> :
               <ul className="tile-list">
                 <li className="card"><span className="card-body">You haven't created any segments yet, let's do that now!.</span></li>
               </ul>
              }
              <Modal show={show} onHide={this.closeModal}>
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
            </div>
            <div className="col-lg-6 col-md-6 col-sm-12 mb-4">
              <h5>Create a Segment</h5>
                {/*<div class="form-group col-md-12">
                  <label htmlFor="inputSeg">First, Start With Existing Segment or Start With All Users</label>
                  <fieldset>
                    <div class="custom-control custom-radio mb-1">
                      <input onChange={() => this.setState({ allUsers: !allUsers, existingSeg: !existingSeg })} type="radio" id="formsRadioDefault" name="formsRadioDefault" class="custom-control-input" checked={existingSeg} />
                      <label class="custom-control-label" for="formsRadioDefault">Use Existing Segment</label>
                    </div>
                    <div class="custom-control custom-radio mb-1">
                      <input onChange={() => this.setState({ allUsers: !allUsers, existingSeg: !existingSeg })} type="radio" id="formsRadioChecked" name="formsRadioChecked" class="custom-control-input" checked={allUsers} />
                      <label class="custom-control-label" for="formsRadioChecked">Start With All Users</label>
                    </div>
                  </fieldset>
                </div>*/}
                {
                  existingSeg ?
                  <div class="form-group col-md-12">
                    <label htmlFor="inputSeg">Now, Choose a Segment</label>
                    <select value={existingSegmentToFilter} onChange={(e) => this.setState({ existingSegmentToFilter: e.target.value })} id="inputSeg" class="form-control">
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
                <div class="form-group col-md-12">
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
                  <div class="form-group col-md-12">
                    <label htmlFor="tileName">Enter The Contract Address</label>
                    <input value={contractAddress} onChange={(e) => this.setState({ contractAddress: e.target.value })} type="text" class="form-control" id="tileName" placeholder="Contract Address" />
                  </div> :
                  filterToUse && filterToUse.type === "Date Range" ? 
                  <div className="row form-group col-md-12">
                    <div className="col-lg-6 col-md-6 col-sm-12 mb-4">
                      <label htmlFor="chartSty">Make a Selection</label>
                      <select value={rangeType} onChange={(e) => this.setState({ rangeType: e.target.value })} id="chartSty" class="form-control">
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
                      <select value={operatorType} onChange={(e) => this.setState({ operatorType: e.target.value })} id="chartSty" class="form-control">
                        <option value="Choose...">Choose...</option>
                        <option value="More Than">More Than</option>
                        <option value="Less Than">Less Than</option>
                        {/* TODO: Add this later <option value="Between">Between</option>*/}
                      </select>
                    </div>
                    <div className="col-lg-6 col-md-6 col-sm-12 mb-4">
                      <label htmlFor="tileName">Enter Amount</label>
                      <input value={amount} onChange={(e) => this.setState({ amount: e.target.value })} type="number" class="form-control" id="tileName" placeholder="Wallet Balance Amount" />
                    </div>
                    <div className="col-lg-6 col-md-6 col-sm-12 mb-4">
                      <label htmlFor="tileName">Choose Token</label>
                      <select value={tokenType} onChange={(e) => this.setState({ tokenType: e.target.value })} id="chartSty" class="form-control">
                        <option value="Choose...">Choose...</option>
                        <option value="Ether">Ether</option>
                        <option value="ERC-20">Other ERC-20 Token</option>
                      </select>
                    </div>
                    {
                      tokenType === "ERC-20" ?
                      <div className="col-lg-6 col-md-6 col-sm-12 mb-4">
                        <label htmlFor="tileName">Enter ERC-20 Token Address</label>
                        <input value={tokenAddress} onChange={(e) => this.setState({ tokenAddress: e.target.value })} type="text" class="form-control" id="tileName" placeholder="Enter Token Address" />
                      </div> : 
                      <div />
                    }
                  </div> :
                  <div />
                }
                <div class="form-group col-md-12">
                  <label htmlFor="tileName">Then, Give It A Name</label>
                  <input onChange={(e) => this.setState({ newSegName: e.target.value })} value={newSegName} type="text" class="form-control" id="tileName" placeholder="Give it a name" />
                </div>
                <div class="form-group col-md-12">
                  <label htmlFor="chartSty">Finally, Create The Segment</label><br/>
                  <button onClick={this.createSegment} className="btn btn-primary">Create Segment</button>
                </div>
              </div>
          </div>
          
          <Modal show={processing} >
            <Modal.Body>
                <LoadingModal messageToDisplay={"Creating segment..."} />
            </Modal.Body>
          </Modal>

        </div>
      </main>
    )
  }
}
