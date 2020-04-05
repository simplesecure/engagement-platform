import React, { setGlobal } from "reactn";
import StickyNav from "../StickyNav";
import Modal from "react-bootstrap/Modal";
import uuid from "uuid/v4";
import LoadingModal from "../LoadingModal";
import EmailEditor from './EmailEditor';
import Table from "react-bootstrap/Table";
import Card from "react-bootstrap/Card";
import * as dc from '../../utils/dynamoConveniences.js'
import { setLocalStorage } from "../../utils/misc";
import { getCloudUser } from "../../utils/cloudUser.js";
// const ERROR_MSG = "Failed to send email. If this continues, please contact support@simpleid.xyz"

export default class Communications extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      show: false,
      selectedSegment: "Choose...",
      selectedTemplate: "Choose...",
      campaignName: "",
      templateName: "",
      fromAddress: "",
      templateToUpdate: {},
      error: "",
      confirmModal: false,
      userCount: 0,
      templateToDelete: {},
      deleteTempModal: false, 
      emailEditor: false
    };
  }

  saveTemplate = temp => {
    const { sessionData, SESSION_FROM_LOCAL, org_id, apps } = this.global;
    const { currentTemplates } = sessionData;
    const { templateName } = this.state;
    const templates = currentTemplates ? currentTemplates : [];
    if (temp) {
      this.editor.exportHtml(async data => {
        const { design, html } = data;
        const thisTemplate = templates.filter(a => a.id === temp.id)[0];
        thisTemplate.design = design;
        thisTemplate.html = html;

        sessionData.currentTemplates = templates;
        const thisApp = apps[sessionData.id];
        thisApp.currentTemplates = templates;

        setGlobal({ sessionData, apps });
        this.setState({ showExisting: false });
        //Now we save to the DB

        //
        // TODO: probably want to wait on this to finish and throw a status/activity
        //       bar in the app:
        const orgData = await dc.organizationDataTableGet(org_id)

        try {
          const anObject = orgData.Item;
          anObject.apps = apps;
          anObject[process.env.REACT_APP_ORG_TABLE_PK] = org_id;

          await dc.organizationDataTablePut(anObject)
          setLocalStorage(SESSION_FROM_LOCAL, JSON.stringify(sessionData));
          setGlobal({ templateName: "" });
        } catch (suppressedError) {
          console.log(`ERROR: problem writing to DB.\n${suppressedError}`);
        }
      });
    } else {
      this.editor.exportHtml(async data => {
        const { design, html } = data;
        const newTemplate = {
          id: uuid(),
          name: templateName,
          design,
          html
        };
        templates.push(newTemplate);
        sessionData.currentTemplates = templates;
        const thisApp = apps[sessionData.id];
        thisApp.currentTemplates = templates;

        await setGlobal({ sessionData, apps, templateName: "" });
        this.setState({ show: false, selectedTemplate: newTemplate.id });
        //Now we save to the DB

        //
        // TODO: probably want to wait on this to finish and throw a status/activity
        //       bar in the app:
        const orgData = await dc.organizationDataTableGet(org_id);

        try {
          const anObject = orgData.Item;
          anObject.apps = apps;
          anObject[process.env.REACT_APP_ORG_TABLE_PK] = org_id;

          await dc.organizationDataTablePut(anObject)
          setLocalStorage(SESSION_FROM_LOCAL, JSON.stringify(sessionData));
        } catch (suppressedError) {
          console.log(`ERROR: problem writing to DB.\n${suppressedError}`);
        }
      });
    }
  };

  deleteTemplate = temp => {
    this.setState({ deleteTempModal: true, templateToDelete: temp });
  };

  confirmDelete = async () => {
    const { sessionData, org_id, apps, SESSION_FROM_LOCAL } = this.global;
    const { currentTemplates } = sessionData;
    const { templateToDelete } = this.state;
    const temp = templateToDelete;
    const index = currentTemplates.map(a => a.id).indexOf(temp.id);
    if (index > -1) {
      currentTemplates.splice(index, 1);
      const thisApp = apps[sessionData.id];
      thisApp.currentTemplates = currentTemplates;
      this.setState({ deleteTempModal: false, templateToDelete: {} });
      setGlobal({ sessionData, apps });
      //Update in DB
      const orgData = await dc.organizationDataTableGet(org_id);

      try {
        const anObject = orgData.Item;
        anObject.apps = apps;
        anObject[process.env.REACT_APP_ORG_TABLE_PK] = org_id;
        await dc.organizationDataTablePut(anObject)
        setLocalStorage(SESSION_FROM_LOCAL, JSON.stringify(sessionData));
      } catch (suppressedError) {
        console.log(`ERROR: problem writing to DB.\n${suppressedError}`);
      }
    } else {
      console.log("Error with index");
    }
  };

  loadTemplate = async temp => {
    await setGlobal({ templateToUpdate: temp, templateName: temp.name, emailEditor: true });
  };

  // onLoad = () => {
  //   const { templateToUpdate } = this.state;
  //   this.editor.loadDesign(templateToUpdate.design);
  // };

  sendCampaign = async confirmed => {
    const { sessionData, apps, SESSION_FROM_LOCAL, org_id } = this.global;
    const {
      selectedSegment,
      selectedTemplate,
      campaignName,
      fromAddress
    } = this.state;
    const { currentSegments, campaigns } = sessionData;
    const seg = currentSegments.filter(a => a.id === selectedSegment)[0];
    this.setState({ userCount: seg.users.length ? seg.users.length : 0 });
    const camps = campaigns ? campaigns : [];
    if (confirmed) {
      this.setState({ confirmModal: false });
      
      const newCampaign = {
        id: uuid(),
        name: campaignName,
        template: selectedTemplate,
        users: seg.users,
        dateSent: new Date()
      };

      //Process the actual email send
      const emailPayload = {
        app_id: sessionData.id,
        addresses: newCampaign.users,
        template: selectedTemplate,
        from: fromAddress,
        subject: campaignName, 
        org_id
      };

      setGlobal({ processing: true });

      const sendEmail = await getCloudUser().processData(
        "email messaging",
        emailPayload
      );
      console.log("SEND EMAIL: ", sendEmail);
      if (sendEmail && sendEmail.success) {
        newCampaign["emailsSent"] = sendEmail.emailCount;

        camps.push(newCampaign);
        sessionData.campaigns = camps;
        const thisApp = apps[sessionData.id];
        thisApp.campaigns = camps;

        setGlobal({ sessionData, apps });
        // On a successful send, we can then update the db to reflect the sent campaigns and set this.state.
        const orgData = await dc.organizationDataTableGet(org_id);

        try {
          const anObject = orgData.Item;
          anObject.apps = apps;
          anObject[process.env.REACT_APP_ORG_TABLE_PK] = org_id;
          await dc.organizationDataTablePut(anObject)
          setLocalStorage(SESSION_FROM_LOCAL, JSON.stringify(sessionData));
          this.setState({
            selectedSegment: "Choose...",
            message: "",
            notificationName: ""
          });
        } catch (suppressedError) {
          console.log(`ERROR: problem writing to DB.\n${suppressedError}`);
        }
        setGlobal({
          sessionData,
          campaignName: "",
          selectedTemplate: "Choose...",
          selectedSegment: "Choose...",
          processing: false
        });
        this.setState({
          selectedSegment: "Choose...",
          selectedTemplate: "Choose...",
          campaignName: "",
          fromAddress: ""
        });
      } else {
        //TODO Make this fail properly
        newCampaign["emailsSent"] = 0;

        camps.push(newCampaign);
        sessionData.campaigns = camps;
        const thisApp = apps[sessionData.id];
        thisApp.campaigns = camps;

        setGlobal({ sessionData, apps });
        // On a successful send, we can then update the db to reflect the sent campaigns and set this.state.
        const orgData = await dc.organizationDataTableGet(org_id);

        try {
          const anObject = orgData.Item;
          anObject.apps = apps;
          anObject[process.env.REACT_APP_ORG_TABLE_PK] = org_id;
          await dc.organizationDataTablePut(anObject)
          setLocalStorage(SESSION_FROM_LOCAL, JSON.stringify(sessionData));
          this.setState({
            selectedSegment: "Choose...",
            message: "",
            notificationName: ""
          });
        } catch (suppressedError) {
          console.log(`ERROR: problem writing to DB.\n${suppressedError}`);
        }
        setGlobal({
          sessionData,
          campaignName: "",
          selectedTemplate: "Choose...",
          selectedSegment: "Choose...",
          processing: false
        });
        this.setState({
          selectedSegment: "Choose...",
          selectedTemplate: "Choose...",
          campaignName: "",
          fromAddress: ""
        });
        // setGlobal({ processing: false })
        // this.setState({ error: ERROR_MSG })
      }
    } else {
      this.setState({ confirmModal: true });
    }
  };

  renderEmailComms() {
    const {
      show,
      templateToUpdate,
      showExisting,
      fromAddress,
      confirmModal,
      templateToDelete,
      deleteTempModal, 
      selectedSegment,
      selectedTemplate,
      templateName,
      campaignName,
      userCount
    } = this.state;

    const { sessionData, processing, emailEditor } = this.global;
    const { campaigns, currentSegments, currentTemplates } = sessionData;
    const templates = currentTemplates ? currentTemplates : [];
    const segments = currentSegments ? currentSegments : [];
    const sendFeaturesComplete =
      selectedSegment !== "Choose..." &&
      selectedTemplate !== "Choose..." &&
      fromAddress &&
      fromAddress.length > 5 &&
      campaignName;

    if (emailEditor) {
      return <EmailEditor />;
    } else {
      return (
        <div>
          <div className="main-content-container container-fluid px-4">
            <div className="page-header row no-gutters py-4">
              <div className="col-12 col-sm-4 text-center text-sm-left mb-0">
                <span className="text-uppercase page-subtitle">
                  Communications
                </span>
                <h3 className="page-title">Connect Through Email</h3>
              </div>
            </div>
            <div className="row">
              <div className="col-lg-6 col-md-6 col-sm-12 mb-4">
                <h5>Campaigns</h5>
                {campaigns && campaigns.length > 0 ? (
                  <Card>
                    <Card.Body>
                      <Table responsive>
                        <thead>
                          <tr>
                            <th>Name</th>
                            <th>Recipients</th>
                          </tr>
                        </thead>
                        <tbody>
                          {campaigns.map(camp => {
                            return (
                              <tr key={camp.id}>
                                <td>{camp.name}</td>
                                <td>{camp.emailsSent}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </Table>
                    </Card.Body>
                  </Card>
                ) : (
                  <ul className="tile-list">
                    <li className="card">
                      <span className="card-body">
                        You haven't sent any campaigns yet, let's do that now!
                      </span>
                    </li>
                  </ul>
                )}
                <div>
                  <h5>Templates</h5>
                  {currentTemplates && currentTemplates.length > 0 ? (
                    <Card>
                      <Card.Body>
                        <Table responsive>
                          <thead>
                            <tr>
                              <th>Name</th>
                              <th></th>
                            </tr>
                          </thead>
                          <tbody>
                            {currentTemplates.map(temp => {
                              return (
                                <tr key={temp.id}>
                                  <td className="clickable text-primary" onClick={() => this.loadTemplate(temp)}>{temp.name}</td>
                                  <td
                                    className="clickable text-danger"
                                    onClick={() => this.deleteTemplate(temp)}
                                  >
                                    Delete
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </Table>
                      </Card.Body>
                    </Card>
                  ) : (
                    <ul className="tile-list">
                      <li className="card">
                        <span className="card-body">
                          You haven't created any email templates yet.
                        </span>
                      </li>
                    </ul>
                  )}
                </div>
              </div>
              <div className="col-lg-6 col-md-6 col-sm-12 mb-4">
                <h5>Create a Campaign</h5>
                <div className="form-group col-md-12">
                  <label htmlFor="inputSeg">First, Choose a Segment</label>
                  <select
                    value={selectedSegment}
                    onChange={e =>
                      this.setState({ selectedSegment: e.target.value })
                    }
                    id="inputSeg"
                    className="form-control"
                  >
                    <option value="Choose...">Choose...</option>
                    {segments.map(seg => {
                      return (
                        <option value={seg.id} key={seg.id}>
                          {seg.name}
                        </option>
                      );
                    })}
                  </select>
                </div>
                <div className="form-group col-md-12">
                  <label htmlFor="inputSeg">Next, Choose a Template</label>
                  {templates.length > 0 ? (
                    <select
                      value={selectedTemplate}
                      onChange={e =>
                        this.setState({ selectedTemplate: e.target.value })
                      }
                      id="inputSeg"
                      className="form-control"
                    >
                      <option value="Choose...">Choose...</option>
                      {templates.map(temp => {
                        return (
                          <option value={temp.id} key={temp.id}>
                            {temp.name}
                          </option>
                        );
                      })}
                    </select>
                  ) : (
                    <select
                      disabled
                      value="Create a template"
                      id="inputSeg"
                      className="form-control"
                    >
                      <option disabled value="Choose...">
                        Create a template
                      </option>
                    </select>
                  )}
                </div>
                <div className="form-group col-md-12">
                  <label>Or Create A New Template</label>
                  <br />
                  <button
                    onClick={() => setGlobal({ emailEditor: true })}
                    className="btn btn-secondary"
                  >
                    Create New Template
                  </button>
                </div>
                <div className="form-group col-md-12">
                  <label htmlFor="inputSeg">Enter The From Address</label>{" "}
                  <br />
                  <span className="text-muted">
                    This will be the address recipients see and can respond to
                  </span>
                  <input
                    value={fromAddress}
                    onChange={e =>
                      this.setState({ fromAddress: e.target.value })
                    }
                    type="email"
                    className="form-control"
                    id="tileNameFromAddress"
                    placeholder="From email address your users will see and reply to"
                  />
                </div>
                <div className="form-group col-md-12">
                  <label htmlFor="inputSeg">
                    Now, Give Your Campaign A Name
                  </label>{" "}
                  <br />
                  <span className="text-muted">
                    This will act as the subject line for your email
                  </span>
                  <input
                    value={campaignName}
                    onChange={e =>
                      this.setState({ campaignName: e.target.value })
                    }
                    type="text"
                    className="form-control"
                    id="tileNameCampaignName"
                    placeholder="Give it a name"
                  />
                </div>
                <div className="form-group col-md-12">
                  <label htmlFor="inputSeg">Finally, Send The Campaign</label>
                  <br />
                  {sendFeaturesComplete ? (
                    <button
                      onClick={() => this.sendCampaign()}
                      className="btn btn-primary"
                    >
                      Send Campaign
                    </button>
                  ) : (
                    <button
                      onClick={() => this.sendCampaign()}
                      className="btn btn-secondary"
                      disabled
                    >
                      Send Campaign
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
          {/*CREATE NEW TEMPLATE*/}
          <Modal
            className="custom-modal-email"
            show={show}
            onHide={() => this.setState({ show: false })}
          >
            <Modal.Header closeButton>
              <Modal.Title>Create a New Email Template</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <p>Give your template a name</p>
              <input
                value={templateName}
                onChange={e => this.setState({ templateName: e.target.value })}
                type="text"
                className="form-control template-name"
                id="tileName"
                placeholder="Give it a name"
              />
              <EmailEditor
                ref={editor => (this.editor = editor)}
                appearance={{
                  panels: {
                    tools: {
                      dock: "left"
                    }
                  }
                }}
                // onLoad={this.onLoad}
                // onDesignLoad={this.onDesignLoad}
              />
            </Modal.Body>
            <Modal.Footer>
              <button
                className="btn btn-secondary"
                onClick={() => this.setState({ show: false })}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={() => this.saveTemplate(null)}
              >
                Save
              </button>
            </Modal.Footer>
          </Modal>

          {/*UPDATE OR VIEW EXISTING TEMPLATE*/}
          <Modal
            className="email-modal"
            show={showExisting}
            onHide={() => this.setState({ showExisting: false })}
          >
            <Modal.Header closeButton>
              <Modal.Title>Create a New Email Template</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <p>Give your template a name</p>
              <input
                value={templateName}
                onChange={e => this.setState({ templateName: e.target.value })}
                type="text"
                className="form-control template-name"
                id="tileName"
                placeholder="Give it a name"
              />
              {/* <EmailEditor
              ref={editor => this.editor = editor}
              onLoad={this.onLoad}
              appearance={{
                panels: {
                  tools: {
                    dock: 'left'
                  }
                }
              }}
              // onDesignLoad={this.onDesignLoad}
            /> */}
              <div id="" />
            </Modal.Body>
            <Modal.Footer>
              <button
                className="btn btn-secondary"
                onClick={() => this.setState({ showExisting: false })}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={() => this.saveTemplate(templateToUpdate)}
              >
                Save
              </button>
            </Modal.Footer>
          </Modal>

          {/* CONFIRM MODAL */}

          <Modal
            className="custom-modal"
            show={confirmModal}
            onHide={() => this.setState({ confirmModal: false })}
          >
            <Modal.Header closeButton>
              <Modal.Title>You're About To Send An Email</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              Are you sure you want to send this email to up to {userCount}{" "}
              people?* It can't be undone. <br />
              <br />
              <span className="text-muted">
                * It's possible that not all of your users made their email
                address available.
              </span>
            </Modal.Body>
            <Modal.Footer>
              <button
                className="btn btn-secondary"
                onClick={() => this.setState({ confirmModal: false })}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={() => this.sendCampaign(true)}
              >
                Send Email
              </button>
            </Modal.Footer>
          </Modal>

          {/* END CONFIRM MODAL */}

          <Modal className="custom-modal" show={processing}>
            <Modal.Body>
              <LoadingModal messageToDisplay={"Send emails..."} />
            </Modal.Body>
          </Modal>

          <Modal
            className="custom-modal"
            show={deleteTempModal}
            onHide={() => this.setState({ deleteTempModal: false })}
          >
            <Modal.Header closeButton>
              <Modal.Title>Are you sure?</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              You're about to delete the segment{" "}
              <strong>
                <u>{templateToDelete.name}</u>
              </strong>
              . Are you sure you want to do this? It can't be undone.
            </Modal.Body>
            <Modal.Footer>
              <button
                className="btn btn-secondary"
                onClick={() => this.setState({ deleteTempModal: false })}
              >
                Cancel
              </button>
              <button className="btn btn-danger" onClick={this.confirmDelete}>
                Delete
              </button>
            </Modal.Footer>
          </Modal>
        </div>
      );
    }
  }

  render() {

    return (
      <main className="main-content col-lg-10 col-md-9 col-sm-12 p-0 offset-lg-2 offset-md-3">
        <StickyNav />
        {this.renderEmailComms()}
      </main>
    );
  }
}
