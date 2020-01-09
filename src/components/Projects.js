import React, { setGlobal } from 'reactn';
import { Redirect } from 'react-router-dom';
import StickyNav from './StickyNav';
import Modal from 'react-bootstrap/Modal'
import uuid from 'uuid/v4';
import { putInOrganizationDataTable } from '../utils/awsUtils';
import { setLocalStorage } from '../utils/misc';

export default class Projects extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      projectName: "", 
      show: false, 
      proj: {}
    }
  }

  createProject = async () => {
    const { apps, org_id, SESSION_FROM_LOCAL } = this.global;
    const { projectName } = this.state;
    const newProject = {
      id: uuid(), 
      dateCreated: new Date(), 
      projectName
    }
    apps.push(newProject);
    setGlobal({ sessionData: apps[0], apps });
    this.setState({ projectName: "" });
    //Now update the DB
    try {
      const anObject = {
        apps: []
      }
      anObject.apps.push(newProject);
      anObject[process.env.REACT_APP_OD_TABLE_PK] = org_id;
      await putInOrganizationDataTable(anObject);  
      const data = apps[0];
      setLocalStorage(SESSION_FROM_LOCAL, JSON.stringify(data));
    } catch (suppressedError) {
      console.log(`ERROR: problem writing to DB.\n${suppressedError}`)
    }
  }

  deleteProject = async (proj, confirm) => {
    const { apps, org_id, SESSION_FROM_LOCAL } = this.global;
  
    if(confirm === false) {
      this.setState({ proj, show: true });
    } else {
      const index = apps.map(a => a.id).indexOf(proj.id);
      if(index > -1) {
        apps.splice(index, 1);
        const data = apps[0];
        setGlobal({ sessionData: data ? data : [], apps });
        this.setState({ show: false });
        //Now we update in the DB
        try {
          const anObject = {
            apps
          }
          anObject[process.env.REACT_APP_OD_TABLE_PK] = org_id
          await putInOrganizationDataTable(anObject)
          const data = apps.length > 0 ? apps[0] : {}
          setLocalStorage(SESSION_FROM_LOCAL, JSON.stringify(data));
        } catch (suppressedError) {
          console.log(`ERROR: problem writing to DB.\n${suppressedError}`)
        }
      } else {
        console.log("Error with index");
      }
    }
  }

  closeModal = () => {
    this.setState({ show: false });
  }

  render() {
    const { apps } = this.global;
    console.log(apps);
    const { projectName, proj, show } = this.state;
    const applications = apps ? apps : [];
    if (!window.location.href.includes('/projects')) {
      return <Redirect to='/projects' />
    }
    return (
      <main className="main-content col-lg-10 col-md-9 col-sm-12 p-0 offset-lg-2 offset-md-3">
          
        <StickyNav />
        <div className="main-content-container container-fluid px-4">
          {
            applications ?
            <div className="page-header row no-gutters py-4">
              <div className="col-12 col-sm-4 text-center text-sm-left mb-0">
                <span className="text-uppercase page-subtitle">Projects</span>
                <h3 className="page-title">Review Your Projects</h3>
              </div>
            </div> : 
            <div className="page-header row no-gutters py-4">
              <div className="col-12 col-sm-4 text-center text-sm-left mb-0">
                <span className="text-uppercase page-subtitle">Get Started</span>
                <h3 className="page-title">Add a Project to Begin</h3>
              </div>
            </div>
          }
            <div className="row">
              <div className="col-lg-6 col-md-6 col-sm-12 mb-4">
                {
                  applications.length > 0 ? 
                  <div>
                    <h5>Projects</h5>
                    <ul className="tile-list">
                    {
                      applications.map(app => {
                        return (
                          <li className="card text-center" key={app.id}>
                            <span className="card-body standard-tile project-title">{app.projectName}</span><br/>
                            <span className="card-body standard-tile">App ID: <br/>{app.id}</span>
                            <span onClick={() => this.deleteProject(app, false)} className="right clickable text-danger">Delete</span>
                          </li>
                          )
                      })
                    }
                    </ul>
                  </div> : 
                  <div>
                    <h5>No Projects Created Yet</h5>
                    <p>Add a new project to get started. Once you do and once your app is integrated, you'll be able use SimpleID.</p>
                  </div>
                }
              </div>

              <div className="col-lg-6 col-md-6 col-sm-12 mb-4">

                {
                  applications.length === 1 ? 
                  <div>
                    <h5>Upgrade to Create More Projects</h5>
                    <div className="form-group col-md-12">
                      <label htmlFor="inputSeg">Please contact us to discuss upgrading</label><br/>
                      <a href="mailto:hello@simpleid.xyz"><button className="btn btn-primary">Contact Us</button></a>
                    </div> 
                  </div> : 
                  <div>
                    <h5>Add a Project</h5>
                    <div className="form-group col-md-12">
                      <label htmlFor="inputSeg">First, Give Your Project a Name</label>
                      <input type="text" value={projectName} onChange={(e) => this.setState({ projectName: e.target.value })} class="form-control" id="tileName" placeholder="Give it a name" />                           
                    </div>
                    <div className="form-group col-md-12">
                      <label htmlFor="inputSeg">Then, Create It</label><br/>
                      <button onClick={this.createProject} className="btn btn-primary">Create Project</button>
                    </div>
                  </div>
                }
                
              </div>

              <Modal show={show} onHide={this.closeModal}>
                <Modal.Header closeButton>
                  <Modal.Title>Are you sure?</Modal.Title>
                </Modal.Header>
                <Modal.Body>You're about to delete the project <strong><u>{proj.name}</u></strong>. Are you sure you want to do this? It can't be undone.</Modal.Body>
                <Modal.Footer>
                  <button className="btn btn-secondary" onClick={this.closeModal}>
                    Cancel
                  </button>
                  <button className="btn btn-danger" onClick={() => this.deleteProject(proj, true)}>
                    Delete
                  </button>
                </Modal.Footer>
              </Modal>

            </div>
        </div>
      </main>
    )
  }
}