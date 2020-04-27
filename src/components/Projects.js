import React, { setGlobal } from "reactn";
import { Link } from "react-router-dom";
import StickyNav from "./StickyNav";
import Modal from "react-bootstrap/Modal";
import Table from "react-bootstrap/Table";
import Card from "react-bootstrap/Card";
import * as dc from './../utils/dynamoConveniences.js'
import { setLocalStorage } from "../utils/misc";
import LoadingModal from "./LoadingModal";
import copy from "copy-to-clipboard";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { getCloudUser } from "./../utils/cloudUser.js";
import { getSidSvcs } from "../utils/sidServices";
const SID_EXPERIMENTAL_FEATURES = process.env.REACT_APP_SID_EXPERIMENTAL_FEATURES === 'true' ? true : false;
const moment = require('moment');
const ERROR_MSG =
  "Failed to create project, please try again. If this continues, please contact support@simpleid.xyz";

export default class Projects extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      projectName: "",
      show: false,
      proj: {},
      redirect: false,
      projectModalOpen: false, 
      keyReveal: false, 
      key: '', 
      updatedProjectName: '', 
      editName: false
    };
  }

  componentDidMount() {
    if (!window.location.href.includes("/projects")) {
      const redirectLink = document.getElementById("hidden-redirect");
      if (redirectLink) {
        redirectLink.click();
      }
    }
  }

  createProject = async () => {
    const { apps, org_id, SESSION_FROM_LOCAL } = this.global;

    const { projectName } = this.state;
    this.setGlobal({ processing: true });
    const newProject = {
      date_created: Date.now(),
      project_name: projectName
    };

    try {
      const projectId = await getCloudUser().createProject(org_id, newProject)
      let data;
      if (projectId) {
        apps[projectId] = newProject;
        const appKeys = Object.keys(apps);
        const allApps = apps;
        const currentAppId = allApps[appKeys[0]];
        data = allApps[appKeys[0]];
        setGlobal({
          currentAppId,
          apps: allApps,
          sessionData: data,
          processing: false
        });
        this.setState({ projectName: "" });
        setLocalStorage(SESSION_FROM_LOCAL, JSON.stringify(data));
        getCloudUser().fetchOrgDataAndUpdate();
      } else {
        setGlobal({ processing: false, error: "No app id returned" });
        console.log(`ERROR: no app id returned`);
      }
      setLocalStorage(SESSION_FROM_LOCAL, JSON.stringify(data));
    } catch (suppressedError) {
      console.log(`ERROR: problem writing to DB.\n${suppressedError}`);
      setGlobal({ processing: false, error: ERROR_MSG });
      // TODO: Justin ... (We should run these calls concurrent and retry on fail n times--then report the problem to the user)
    }
  };

  deleteProject = async (proj, confirm) => {
    const { apps, org_id, SESSION_FROM_LOCAL } = this.global;
    let updatedApps;
    if (confirm === false) {
      this.setState({ proj, show: true });
    } else {
      const key = proj.id;
      delete apps[key];

      const appsCheck = Object.keys(apps);
      if (appsCheck.length === 0) {
        updatedApps = {};
        setGlobal({ apps: updatedApps });
      } else {
        updatedApps = apps;
        setGlobal({ apps: updatedApps });
      }

      this.setState({ show: false });
      //Now we update in the DB
      const orgData = await dc.organizationDataTableGet(org_id);

      try {
        const anObject = orgData.Item;
        anObject.apps = updatedApps;
        anObject[process.env.REACT_APP_ORG_TABLE_PK] = org_id;
        await dc.organizationDataTablePut(anObject);
        const appKeys = Object.keys(updatedApps);
        const currentAppId = updatedApps[appKeys[0]]
          ? updatedApps[appKeys[0]]
          : "";
        const data = appKeys.length > 0 ? updatedApps[appKeys[0]] : {};

        setGlobal({ currentAppId, sessionData: data, processing: false });
        setLocalStorage(SESSION_FROM_LOCAL, JSON.stringify(data));
      } catch (suppressedError) {
        console.log(`ERROR: problem writing to DB.\n${suppressedError}`);
      }
    }
  };

  closeModal = () => {
    this.setState({ show: false });
  };

  copy = (elemId) => {
    const elem = document.getElementById(elemId);
    const text = elem.innerText;
    const copied = copy(text);
    if (copied) {
      toast.success("Copied!", {
        position: toast.POSITION.TOP_RIGHT,
        autoClose: 1000
      });
    }
  };

  handleProjectModal = (proj) => {
    this.setState({ projectModalOpen: true, proj })
  }

  getExportableKey = async () => {
    const { org_id } = this.global;
    const orgData = await dc.organizationDataTableGet(org_id);
    const key = await getSidSvcs().getExportableOrgEcKey(orgData.Item);
    this.setState({ keyReveal: true, key})
  }

  editName = () => {
    this.setState({ editName: true })
  }

  saveUpdatedProject = async (proj) => {
    const { org_id } = this.global;
    const { updatedProjectName } = this.state;
    
    const orgData = await dc.organizationDataTableGet(org_id);

    try {
      const anObject = orgData.Item;
      anObject.apps[proj.id].project_name = updatedProjectName;
      anObject[process.env.REACT_APP_ORG_TABLE_PK] = org_id;
      await dc.organizationDataTablePut(anObject);      
      getCloudUser().fetchOrgDataAndUpdate();
      this.setState({ editName: false });
    } catch (suppressedError) {
      console.log(`ERROR: problem writing to DB.\n${suppressedError}`);
    }
  }

  renderMain() {
    const { apps, processing, liveChat, liveChatId, experimentalFeatures } = this.global;
    const { projectName, proj, show, projectModalOpen, keyReveal, key, updatedProjectName, editName } = this.state;
    const appKeys = Object.keys(apps);
    let applications = [];
    for (const appKey of appKeys) {
      const thisApp = apps[appKey];
      thisApp.id = appKey;
      applications.push(thisApp);
    }

    return (
      <div>
        <StickyNav />
        <Link style={{ display: "none" }} id="hidden-redirect" to="/projects" />
        <div className="main-content-container container-fluid px-4">
          {
          applications ? (
            <div className="page-header row no-gutters py-4">
              <div className="col-12 col-sm-4 text-center text-sm-left mb-0">
                <span className="text-uppercase page-subtitle">Projects</span>
                <h3 className="page-title">Review Your Projects</h3>
              </div>
            </div>
          ) : (
            <div className="page-header row no-gutters py-4">
              <div className="col-12 col-sm-4 text-center text-sm-left mb-0">
                <span className="text-uppercase page-subtitle">
                  Get Started
                </span>
                <h3 className="page-title">Add a Project to Begin</h3>
              </div>
            </div>
          )
          }
            <div className="row">
              <div className="col-lg-6 col-md-6 col-sm-12 mb-4">
              <Card>
                <Card.Body>

                  {applications.length > 0 ? (
                    <Table responsive>
                      <thead>
                        <tr>
                          <th>App Name</th>
                          <th>Date</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {applications.map(app => {
                          return (
                            <tr key={app.id}>
                              <td>
                                <button
                                  onClick={() =>
                                    this.handleProjectModal(app)
                                  }
                                  className="a-el-fix"
                                >
                                  {app.project_name}
                                </button>
                              </td>
                              <td>{moment(app.date_created).format("MM/DD/YYYY")}</td>
                              <td
                                className="clickable text-danger"
                                onClick={() => this.deleteProject(app, false)}
                              >
                                Delete
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </Table>
                  ) : (
                    <div>
                      <h5>No Projects Created Yet</h5>
                      <p>
                        Add a new project to get started. Once you do and once
                        your app is integrated, you'll be able use SimpleID.
                      </p>
                    </div>
                  )}
                </Card.Body>
              </Card>
            </div>

            <div className="col-lg-6 col-md-6 col-sm-12 mb-4">
              <div>
                <h5>Add a Project</h5>
                <div className="form-group col-md-12">
                  <label htmlFor="inputSeg">
                    First, Give Your Project a Name
                  </label>
                  <input
                    type="text"
                    value={projectName}
                    onChange={e =>
                      this.setState({ projectName: e.target.value })
                    }
                    className="form-control"
                    id="tileName"
                    placeholder="Give it a name"
                  />
                </div>
                <div className="form-group col-md-12">
                  <label htmlFor="inputSeg">Then, Create It</label>
                  <br />
                  <button
                    onClick={this.createProject}
                    className="btn btn-primary"
                  >
                    Create Project
                  </button>
                </div>
              </div>
            </div>

            <Modal
              className="custom-modal"
              show={show}
              onHide={this.closeModal}
            >
              <Modal.Header closeButton>
                <Modal.Title>Are you sure?</Modal.Title>
              </Modal.Header>
              <Modal.Body>
                You're about to delete the project{" "}
                <strong>
                  <u>{proj.name}</u>
                </strong>
                . Are you sure you want to do this? It can't be undone.
              </Modal.Body>
              <Modal.Footer>
                <button className="btn btn-secondary" onClick={this.closeModal}>
                  Cancel
                </button>
                <button
                  className="btn btn-danger"
                  onClick={() => this.deleteProject(proj, true)}
                >
                  Delete
                </button>
              </Modal.Footer>
            </Modal>

            <Modal className="custom-modal" show={projectModalOpen} onHide={() => this.setState({ projectModalOpen: false })}>
              <Modal.Header closeButton>
                <Modal.Title>Project Details</Modal.Title>
              </Modal.Header>
              <Modal.Body>
                  <h5>Project Name <span onClick={this.editName} style={{marginLeft: "10px", cursor: "pointer"}}><i className="far fa-edit"></i></span></h5>
                  <p>
                  {editName ? <span><input onChange={(e) => this.setState({ updatedProjectName: e.target.value })} type='text' value={updatedProjectName} /> <i onClick={() => this.saveUpdatedProject(proj)} className="clickable fas fa-check"></i></span> : updatedProjectName ? updatedProjectName : proj.project_name }
                  </p>
                <div />
                <h5>App ID</h5>
                <p><span id='app-id'>{proj.id}</span><i onClick={() => this.copy('app-id')} data-clipboard-target="#app-id" className="copy-button clickable material-icons">content_copy</i></p>
                {
                  liveChat ?
                  <div>
                    <h5>Chat Address</h5>
                    <p><span id='chat-id'>{liveChatId}</span> <i onClick={() => this.copy('chat-id')} data-clipboard-target="#chat-id" className="copy-button clickable material-icons">content_copy</i></p>
                  </div> :
                  <div />
                }
                {
                  SID_EXPERIMENTAL_FEATURES || experimentalFeatures ? 
                  <div>
                    <h5>Organization Private Key</h5>
                    <p>{keyReveal ? <span><span id='ec-key'>{key}</span><i onClick={() => this.copy('ec-key')} data-clipboard-target="#ec-key" className="copy-button clickable material-icons">content_copy</i></span> : <span><span className='obfuscated-text'>12fh4789923kfhhs7499hhsgffs890hs37k</span><span className='clickable reveal-button' onClick={this.getExportableKey}>Click to reveal</span></span>}</p>
                  </div> : 
                  <div />
                }                
              </Modal.Body>
              <Modal.Footer>
                <button className="btn btn-secondary" onClick={() => this.setState({ projectModalOpen: false, keyReveal: false })}>
                  Close
                </button>
              </Modal.Footer>
            </Modal>

            <Modal className="custom-modal" show={processing}>
              <Modal.Body>
                <LoadingModal messageToDisplay={"Creating project..."} />
              </Modal.Body>
            </Modal>
          </div>
        </div>
      </div>
    );
  }

  render() {
    return (
      <main className="main-content col-lg-10 col-md-9 col-sm-12 p-0 offset-lg-2 offset-md-3">
        {this.renderMain()}
      </main>
    );
  }
}
