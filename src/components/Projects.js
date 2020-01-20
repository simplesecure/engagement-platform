import React, { setGlobal } from 'reactn';
import { Link } from 'react-router-dom';
import StickyNav from './StickyNav';
import Modal from 'react-bootstrap/Modal'
import { putInOrganizationDataTable, getFromOrganizationDataTable } from '../utils/awsUtils';
import { setLocalStorage } from '../utils/misc';
import LoadingModal from './LoadingModal';
const ERROR_MSG = "Failed to create project, please try again. If this continues, please contact support@simpleid.xyz"

export default class Projects extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      projectName: "",
      show: false,
      proj: {}, 
      showACTest: false, 
      redirect: false
    }
  }

  componentDidMount() {
    if (!window.location.href.includes('/projects')) {
      const redirectLink = document.getElementById('hidden-redirect')
      if(redirectLink) {
        redirectLink.click()
      }
    }
  }

  acTerribleTest = async () => {
    const { simple, sessionData } = this.global
    const { currentSegments } = sessionData;

    const seg = currentSegments[0]
    const payload = {
      app_id: sessionData.id, 
      addresses: seg.users
    }
    simple.processData('AC Terrible Test', payload)
  }

  createProject = async () => {
    const { apps, org_id, simple } = this.global;
    const { projectName } = this.state;
    this.setGlobal({ processing: true });
    const newProject = {
      date_created: Date.now(),
      project_name: projectName
    }

    const payload = {
      orgId: org_id,
      appObject: newProject
    }
    try {
      const projectId = await simple.processData('create-project', payload);
      if(projectId) {
        apps[projectId] = newProject
        const appKeys = Object.keys(apps);
        const allApps = apps;
        const currentAppId = allApps[appKeys[0]]
        const data = allApps[appKeys[0]];
        setGlobal({ currentAppId, apps: allApps, sessionData: data, processing: false });
        this.setState({ projectName: "" });
      } else {
        setGlobal({ processing: false, error: "No app id returned"})
        console.log(`ERROR: no app id returned`)
      }
      //setLocalStorage(SESSION_FROM_LOCAL, JSON.stringify(appData));
    } catch (suppressedError) {
      console.log(`ERROR: problem writing to DB.\n${suppressedError}`)
      setGlobal({ processing: false, error: ERROR_MSG})
      // TODO: Justin ... (We should run these calls concurrent and retry on fail n times--then report the problem to the user)
    }
  }

  deleteProject = async (proj, confirm) => {
    const { apps, org_id, SESSION_FROM_LOCAL } = this.global;
    let updatedApps;
    if(confirm === false) {
      this.setState({ proj, show: true });
    } else {
      const key = proj.id
      delete apps[key]

      const appsCheck = Object.keys(apps);
      if(appsCheck.length === 0) {
        updatedApps = {}
        setGlobal({ apps: updatedApps })
      } else {
        setGlobal({ apps });
      }
      
      //TODO: Need to move this functionality to the iframe to avoid conflicts in how writes are handled

      this.setState({ show: false });
      //Now we update in the DB
      const orgData = await getFromOrganizationDataTable(org_id);

      try {
        const anObject = orgData.Item
        anObject.apps = updatedApps;
        anObject[process.env.REACT_APP_OD_TABLE_PK] = org_id
        await putInOrganizationDataTable(anObject)
        const appKeys = Object.keys(updatedApps);
        const currentAppId = updatedApps[appKeys[0]] ? updatedApps[appKeys[0]] : ""
        const data = appKeys.length > 0 ? updatedApps[appKeys[0]] : {}
        setGlobal({ currentAppId, sessionData: data, processing: false });
        setLocalStorage(SESSION_FROM_LOCAL, JSON.stringify(data));
      } catch (suppressedError) {
        console.log(`ERROR: problem writing to DB.\n${suppressedError}`)
      }
    }
  }

  closeModal = () => {
    this.setState({ show: false });
  }

  renderMain() {
    const { apps, processing } = this.global;
    const { projectName, proj, show, showACTest } = this.state;
    const appKeys = Object.keys(apps);
    let applications = [];
    for(const appKey of appKeys) {
      const thisApp = apps[appKey]
      thisApp.id = appKey
      applications.push(thisApp)
    }
    return (
      <div>

        <StickyNav />
        <Link style={{display: "none"}} id='hidden-redirect' to='/projects' />
        <div className="main-content-container container-fluid px-4">
          {
            applications ?
            <div className="page-header row no-gutters py-4">
              <div className="col-12 col-sm-4 text-center text-sm-left mb-0">
                <span className="text-uppercase page-subtitle">Projects</span>
                <h3 className="page-title">Review Your Projects</h3>
                {
                showACTest ? 
                <div className="form-group col-md-12">
                  <label htmlFor="inputSeg">AC Terrible Test</label><br/>
                  <button onClick={this.acTerribleTest} className="btn btn-primary">AC Terrible Test</button>
                </div> : 
                <div />
                } 
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
                            <span className="card-body standard-tile project-title">{app.project_name}</span><br/>
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
              
              <Modal show={processing}>                
                <Modal.Body>
                  <LoadingModal messageToDisplay={"Creating project..."} />
                </Modal.Body>                
              </Modal>
            </div>
        </div>
        </div>
    )
  }

  render() {
    return (
      <main className="main-content col-lg-10 col-md-9 col-sm-12 p-0 offset-lg-2 offset-md-3">
        {this.renderMain()}
      </main>
    )
  }
}
