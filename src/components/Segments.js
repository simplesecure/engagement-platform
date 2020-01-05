import React, { setGlobal } from 'reactn';
import StickyNav from './StickyNav';
import Modal from 'react-bootstrap/Modal';
import Accordion from 'react-bootstrap/Accordion';
import Card from 'react-bootstrap/Card';
import DemoTable from './DemoTable';
import { getFromAnalyticsDataTable,
         putInAnalyticsDataTable } from '../awsUtils.js';

export default class Segments extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      show: false,
      seg: "",
      existingSeg: false,
      allUsers: true,
      filterType: "Choose...",
      newSegName: ""
    }
  }

  deleteSegment = (seg, confirm) => {
    const { currentSegments } = this.global;
    this.setState({ seg });
    if(confirm) {
      const index = currentSegments.map(a => a.id).indexOf(seg.id);
      if(index > -1) {
        currentSegments.splice(index, 1);
        setGlobal({ currentSegments });
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
    const { currentSegments } = this.global;
    const { newSegName } = this.state;
    const newSegment = {
      id: "23456",
      name: newSegName,
      userCount: 2302
    }
    currentSegments.push(newSegment);

    // Put the new segment in the analytics data for the user signed in to this
    // id:
    //      Each App (SimpleID Customer) will have an app_id
    //      Each App can have multiple Customer Users (e.g. Cody at Lens and one of his Minions)
    //      A segment will be stored in the DB under the primary key 'app_id' in
    //      the appropriate user_id's segment storage:
    //
    const app_id = 'This should be a UUID for the App.'
    const user_id = 'This should be systum UUID or the Cognito identity pool sub.'
    //
    // TODO: probably want to wait on this to finish and throw a status/activity
    //       bar in the app:
    try {
      const anObject = {
        users: {
        }
      }
      anObject.users[user_id] = {
        segments: currentSegments
      }
      anObject[process.env.REACT_APP_AD_TABLE_PK] = app_id
      await putInAnalyticsDataTable(anObject)
    } catch (suppressedError) {
      console.log(`ERROR: problem writing to DB.\n${suppressedError}`)
    }

    setGlobal({ currentSegments });
    this.setState({ newSegName: "", filterType: "Choose..." });
  }

  render() {
    const { currentSegments } = this.global;
    const { show, seg, existingSeg, allUsers, filterType, newSegName } = this.state;
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
                currentSegments.length > 0 ?
                <ul className="tile-list">
                  {
                    currentSegments.map(seg => {
                      return (
                        <Accordion className="clickable accordion-tile" key={seg.id} defaultActiveKey="1">
                          <Card className="standard-tile">
                            <Card.Header>
                              <Accordion.Toggle as={"li"} variant="link" eventKey="0">
                                <span className="seg-title">{seg.name}</span><br/><span className="seg-count">{seg.userCount} users</span><span onClick={() => this.deleteSegment(seg, false)} className="right clickable text-danger">Delete</span>
                              </Accordion.Toggle>
                            </Card.Header>
                            <Card.Body>
                              <Accordion.Collapse eventKey="0">
                                <DemoTable />
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
                <div class="form-group col-md-12">
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
                </div>
                {
                  existingSeg ?
                  <div class="form-group col-md-12">
                    <label htmlFor="inputSeg">Now, Choose a Segment</label>
                    <select id="inputSeg" class="form-control">
                      <option selected>Choose...</option>
                      {
                        currentSegments.map(seg => {
                          return (
                          <option key={seg.id}>{seg.name}</option>
                          )
                        })
                      }
                    </select>
                  </div> :
                  <div />
                }
                <div class="form-group col-md-12">
                  <label htmlFor="chartSty">Next, Choose a Filter</label>
                  <select value={filterType} onChange={(e) => this.setState({ filterType: e.target.value })} id="chartSty" class="form-control">
                    <option value="Choose...">Choose...</option>
                    <option value="contract">Contract Transactions</option>
                    <option value=">7">Last Activity > 7 Days</option>
                    <option value="AUM>10k">AUM > $10,000</option>
                    <option value="act>100">Total Activities > 100</option>
                  </select>
                </div>
                {
                  filterType === "contract" ?
                  <div class="form-group col-md-12">
                    <label htmlFor="tileName">Enter The Contract Address</label>
                    <input type="text" class="form-control" id="tileName" placeholder="Contract Address" />
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
        </div>
      </main>
    )
  }
}
