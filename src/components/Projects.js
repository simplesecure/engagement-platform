import React, { setGlobal } from "reactn"
import { Link, withRouter } from "react-router-dom"
import SideNav from './SideNav'
import {
  Button,
  Grid,
  Segment,
  Input,
  Icon,
  Message,
  Dimmer,
  Loader
} from 'semantic-ui-react'
import { Dialog } from 'evergreen-ui'
import { runClientOperation,
         getCloudServices } from './../utils/cloudUser.js';
import copy from "copy-to-clipboard"
import { toast } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import { getEmailData } from './../utils/emailData.js'
import { getWeb2Analytics } from './../utils/web2Analytics'
import { getSidSvcs } from "../utils/sidServices"
const moment = require('moment')
const ERROR_MSG =
  "Failed to create project, please try again. If this continues, please contact support@simpleid.xyz"
const filter = require('../utils/filterOptions.json')

class Projects extends React.Component {
  constructor(props) {
    super(props)
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
    }
  }

  componentDidMount() {
    if (!window.location.href.includes("/projects")) {
      const redirectLink = document.getElementById("hidden-redirect")
      if (redirectLink) {
        redirectLink.click()
      }
    }
  }

  createProject = async () => {
    const { apps, org_id } = this.global
    const { projectName } = this.state

    const newProject = {
      date_created: Date.now(),
      project_name: projectName
    }

    // Recently refactored / merged from cloud user
    this.setGlobal({ processing: true, orgData: newProject })

    try {
      const projectId = await getSidSvcs().createAppId(org_id, newProject)

      let data
      if (projectId) {
        apps[projectId] = newProject
        const appKeys = Object.keys(apps)
        const allApps = apps
        const currentAppId = allApps[appKeys[0]]
        data = allApps[appKeys[0]]
        setGlobal({
          currentAppId,
          apps: allApps,
          sessionData: data,
          processing: false
        })
        this.setState({ projectName: "" })

        // TODO: the next call should really be removed and the model above should be updated
        //       with the appId returned (i.e. no need to call the server twice)
        getCloudServices().fetchOrgDataAndUpdate()
        this.props.history.push('/segments')
      } else {
        setGlobal({ processing: false, error: "No app id returned" })
        console.log(`ERROR: no app id returned`)
      }
    } catch (suppressedError) {
      console.log(`ERROR: problem writing to DB.\n${suppressedError}`)
      setGlobal({ processing: false, error: ERROR_MSG })
      // TODO: Justin ... (We should run these calls concurrent and retry on fail n times--then report the problem to the user)
    }
  }

  deleteProject = async (proj, confirm) => {
    const { apps } = this.global
    let updatedApps
    if (confirm === false) {
      this.setState({ proj, show: true })
    } else {
      const key = proj.id

      try {
        await runClientOperation('deleteApp', undefined, key)
      } catch (error) {
        throw new Error(`Projects::deleteProject: failed to delete app (id=${key}).\n` +
                        `Please refresh the page and try again. If that fails, contact support@simpleid.xyz.\n` +
                        `${error}`)
      }

      delete apps[key]

      // TODO: when time, clean up the mess below.

      const appsCheck = Object.keys(apps)
      if (appsCheck.length === 0) {
        updatedApps = {}
        setGlobal({ apps: updatedApps })
      } else {
        updatedApps = apps
        setGlobal({ apps: updatedApps })
      }

      this.setState({ show: false })

      try {
        const appKeys = Object.keys(updatedApps)
        const currentAppId = updatedApps[appKeys[0]]
          ? updatedApps[appKeys[0]]
          : ""
        const data = appKeys.length > 0 ? updatedApps[appKeys[0]] : {}

        setGlobal({ currentAppId, sessionData: data, processing: false })
      } catch (suppressedError) {
        console.log(`ERROR: problem updating state and/or local store.\n${suppressedError}`)
      }
    }
  }

  closeModal = () => {
    this.setState({ show: false })
  }

  copy = (elemId) => {
    const elem = document.getElementById(elemId)
    const text = elem.innerText
    const copied = copy(text)
    if (copied) {
      toast.success("Copied!", {
        position: toast.POSITION.TOP_RIGHT,
        autoClose: 1000
      })
    }
  }

  handleProjectModal = (proj) => {
    this.setState({ projectModalOpen: true, proj })
  }

  getExportableKey = async () => {
    const { org_id } = this.global
    const orgData = {
      cryptography: await runClientOperation('getCryptography', org_id)
    }
    const key = await getSidSvcs().getExportableOrgEcKey(orgData)
    this.setState({ keyReveal: true, key})
  }

  editName = () => {
    this.setState({ editName: true })
  }

  saveUpdatedProject = async (proj) => {
    const { org_id } = this.global
    const { updatedProjectName } = this.state

    try {
      const operationData = {
        newName: updatedProjectName
      }
      await runClientOperation('renameApp', org_id, proj.id, operationData)

      // TODO: below is costly--is it needed, can AC & PBJ rework it into model from above?
      //        - after looking at the fetchOrg... method it's doing a full update and a bunch
      //          of state updates.  <-- TODO refactor into what's needed
      getCloudServices().fetchOrgDataAndUpdate()
      this.setState({ editName: false })
    } catch (error) {
      throw new Error(`Projects::saveUpdatedProject: failed to save rename of application (${updatedProjectName}).\n` +
                      `Please refresh the page and try again. If that fails, contact support@simpleid.xyz.\n` +
                      `${error}`)
    }
  }

  setProject = async app => {
    const { apps } = this.global

    await setGlobal({ sessionData: apps[app.id], currentAppId: app.id, allFilters: [] })
    getCloudServices().fetchUsersCount()
    //  Fetch web2 analytics eventNames - we will fetch the actual event results in Segment handling
    const web2AnalyticsCmdObj = {
      command: 'getWeb2Analytics',
          data: {
           appId: app.id
        }
    }

    const web2Analytics = await getWeb2Analytics(web2AnalyticsCmdObj)
    const { allFilters } = await this.global
    if(web2Analytics.data) {
      const events = web2Analytics.data

      for(const event of events) {
        const data = {
          type: 'web2',
          filter: `Web2: ${event}`
        }
        allFilters.push(data)
      }
      allFilters.push(...filter)
      setGlobal({ allFilters, web2Events: web2Analytics.data ? web2Analytics.data : [] })
    } else {
      console.log(allFilters)
      allFilters.push(...filter)
      console.log(filter)
      setGlobal({ allFilters })
    }

    const emailData = await getEmailData()

    setGlobal({ emailData: emailData.data })
  }

  render() {
    const { apps, processing, plan, sessionData } = this.global
    const { projectName, proj, show, projectModalOpen, keyReveal, key, updatedProjectName, editName } = this.state
    const appKeys = Object.keys(apps)
    let applications = []
    for (const appKey of appKeys) {
      const thisApp = apps[appKey]
      thisApp.id = appKey
      applications.push(thisApp)
    }
    return (
      <div>
        <SideNav />
        <main className="main-content col-lg-10 col-md-9 col-sm-12 p-0 offset-lg-2 offset-md-3">
          <Link style={{ display: "none" }} id="hidden-redirect" to="/account" />
          <div className="main-content-container container-fluid px-4">
              <div className="page-header row no-gutters py-4">
                <div className="col-lg-8 col-md-8 col-sm-8 text-left text-sm-left mb-0">
                  <span className="text-uppercase page-subtitle">Projects</span>
                  <h3 className="page-title">Review Your Projects</h3>
                </div>
                <div className="col-lg-4 col-md-4 col-sm-4 text-right text-sm-right mb-0">
                  <Button
                    color='red'
                    onClick={() => getCloudServices().signOut()}
                    icon='sign-out'
                    size='large'
                    content='Logout'
                  />
                </div>
              </div>
              <div className="row">
                <div className="col-lg-8 col-md-8 col-sm-12 mb-4">
                  {applications.length > 0 ? (
                    applications.map(app => {
                      const activeProject = sessionData.project_name === app.project_name
                      return (
                        <Segment key={app.id} padded raised>
                          <Grid columns={2}>
                            <Grid.Row>
                              <Grid.Column width={8}>
                                {
                                  activeProject ? (
                                    <Message negative>
                                      <Message.Header as='h3'>Active: {app.project_name}</Message.Header>
                                      <p className='name'>{moment(app.date_created).format("MM/DD/YYYY")}</p>
                                    </Message>
                                  ) : (
                                    <Message>
                                      <Message.Header as='h3'>Inactive: {app.project_name}</Message.Header>
                                      <p className='name'>{moment(app.date_created).format("MM/DD/YYYY")}</p>
                                    </Message>
                                  )
                                }
                              </Grid.Column>
                              <Grid.Column width={8}>
                                <Button.Group floated="right">
                                  { activeProject ? (
                                      null
                                    ) : (
                                      <Button onClick={() => this.setProject(app)} icon basic>
                                        <Icon name='check circle outline' size='large' color='green' />
                                        <p className='name'>Enable</p>
                                      </Button>
                                    )
                                  }
                                  <Button onClick={() => this.handleProjectModal(app)} icon basic disabled={!activeProject}>
                                    <Icon name='options' size='large' color='blue' />
                                    <p className='name'>Details</p>
                                  </Button>
                                  <Button onClick={() => this.deleteProject(app, false)} icon basic disabled={!activeProject}>
                                    <Icon color='red' name='trash alternate outline' size='large' />
                                    <p className='name'>Delete</p>
                                  </Button>
                                </Button.Group>
                              </Grid.Column>
                            </Grid.Row>
                          </Grid>
                        </Segment>
                      )
                    })
                  ) : (
                  <Message
                    header='No Projects Created Yet'
                    content="Add a new project to start segmenting and understanding user engagement and retention."
                  />
                )}
              </div>
              <div className="col-lg-4 col-md-4 col-sm-12 mb-4">
                {
                  (applications.length === 0 || plan === "enterprise") ?
                  <div>
                    <h5>Add a Project</h5>
                    <div className="form-group col-md-12">
                      <Input
                        fluid
                        value={projectName}
                        onChange={e =>
                          this.setState({ projectName: e.target.value })
                        }
                        placeholder="First, Give Your Project a Name"
                      />
                    </div>
                    <div className="form-group col-md-12">
                      <Button
                        floated="right"
                        onClick={this.createProject}
                        positive
                        disabled={!this.state.projectName.length}
                      >
                        Create Project
                      </Button>
                    </div>
                  </div>
                :
                <div>
                  <h5>Upgrade your plan to create additional projects</h5>
                  {plan ? <p>Your current plan is: <strong><u>{plan}</u></strong></p> : null}
                  <Button primary as='a' href="mailto:hello@simpleid.xyz">
                    Contact Us To Upgrade
                  </Button>
                </div>
                }
              </div>
              <Dialog
                isShown={show}
                title="Delete Project?"
                onConfirm={() => this.deleteProject(proj, true)}
                onCancel={() => this.closeModal()}
                onCloseComplete={() => this.closeModal()}
                confirmLabel='Delete'
                intent="danger"
                width={640}
              >
                You're about to delete the project{" "}
                <strong>
                  <u>{projectName}</u>
                </strong>
                . Are you sure you want to do this? It can't be undone.
              </Dialog>
              <Dialog
                isShown={projectModalOpen}
                title="Project Details"
                onConfirm={() => this.setState({ projectModalOpen: false, keyReveal: false })}
                onCancel={() => this.setState({ projectModalOpen: false, keyReveal: false })}
                onCloseComplete={() => this.setState({ projectModalOpen: false, keyReveal: false })}
                confirmLabel="Close"
                hasCancel={false}
                width={640}
              >
                <h5>Project Name <span onClick={this.editName} style={{marginLeft: "10px", cursor: "pointer"}}><i className="far fa-edit"></i></span></h5>
                  <p>
                  {editName ? <span><input onChange={(e) => this.setState({ updatedProjectName: e.target.value })} type='text' value={updatedProjectName} /> <i onClick={() => this.saveUpdatedProject(proj)} className="clickable fas fa-check"></i></span> : updatedProjectName ? updatedProjectName : proj.project_name }
                  </p>
                <div />
                <h5>App ID</h5>
                <p><span id='app-id'>{proj.id}</span><i onClick={() => this.copy('app-id')} data-clipboard-target="#app-id" className="copy-button clickable material-icons">content_copy</i></p>
                {
                  plan === 'enterprise' || plan === 'premium' ?
                  <div>
                    <h5>Organization Private Key</h5>
                    <p>{keyReveal ? <span><span id='ec-key'>{key}</span><i onClick={() => this.copy('ec-key')} data-clipboard-target="#ec-key" className="copy-button clickable material-icons">content_copy</i></span> : <span><span className='obfuscated-text'>12fh4789923kfhhs7499hhsgffs890hs37k</span><span className='clickable reveal-button' onClick={this.getExportableKey}>Click to reveal</span></span>}</p>
                  </div> :
                  <div />
                }
              </Dialog>
            </div>
          </div>
        </main>
        <Dimmer active={processing}>
          <Loader inline='centered' indeterminate>{"Creating project..."}</Loader>
        </Dimmer>
      </div>
    )
  }
}

export default withRouter(Projects);