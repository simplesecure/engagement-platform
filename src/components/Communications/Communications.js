import React, { setGlobal } from "reactn";
import StickyNav from "../StickyNav";
import Modal from "react-bootstrap/Modal";
import uuid from "uuid/v4";
import LoadingModal from "../LoadingModal";
import EmailEditor from "./EmailEditor";
import Charts from "./Charts";
import Table from "react-bootstrap/Table";
import Card from "react-bootstrap/Card";
import Loader from "../Loader";
import * as dc from "../../utils/dynamoConveniences.js";
import { setLocalStorage } from "../../utils/misc";
import { getCloudUser } from "../../utils/cloudUser.js";
import { toast } from "react-toastify";
import { getEmailData } from "../../utils/emailData.js";
import { importEmailArray } from "../../utils/emailImport.js";
import InputGroup from "react-bootstrap/InputGroup";
const csv = require("csvtojson");

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
      emailEditor: false,
      createCampaign: false,
      importModalOpen: false,
      csvUploaded: false,
      fileName: "",
      allEmailsGroup: {},
    };
  }

  async componentDidMount() {
    const { sessionData } = this.global;
    if(sessionData.imports && sessionData.imports.email) {
      const allEmailsGroup = {
        userCount: sessionData.imports.email.count
      }
      this.setState({ allEmailsGroup });
    }

    const emailData = await getEmailData();
    setGlobal({ emailData: emailData.data });
  }

  saveTemplate = (temp) => {
    const { sessionData, SESSION_FROM_LOCAL, org_id, apps } = this.global;
    const { currentTemplates } = sessionData;
    const { templateName } = this.state;
    const templates = currentTemplates ? currentTemplates : [];
    if (temp) {
      this.editor.exportHtml(async (data) => {
        const { design, html } = data;
        const thisTemplate = templates.filter((a) => a.id === temp.id)[0];
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
        const orgData = await dc.organizationDataTableGet(org_id);

        try {
          const anObject = orgData.Item;
          anObject.apps = apps;
          anObject[process.env.REACT_APP_ORG_TABLE_PK] = org_id;

          await dc.organizationDataTablePut(anObject);
          setLocalStorage(SESSION_FROM_LOCAL, JSON.stringify(sessionData));
          setGlobal({ templateName: "" });
        } catch (suppressedError) {
          console.log(`ERROR: problem writing to DB.\n${suppressedError}`);
        }
      });
    } else {
      this.editor.exportHtml(async (data) => {
        const { design, html } = data;
        const newTemplate = {
          id: uuid(),
          name: templateName,
          design,
          html,
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

          await dc.organizationDataTablePut(anObject);
          setLocalStorage(SESSION_FROM_LOCAL, JSON.stringify(sessionData));
        } catch (suppressedError) {
          console.log(`ERROR: problem writing to DB.\n${suppressedError}`);
        }
      });
    }
  };

  deleteTemplate = (temp) => {
    this.setState({ deleteTempModal: true, templateToDelete: temp });
  };

  confirmDelete = async () => {
    const { sessionData, org_id, apps, SESSION_FROM_LOCAL } = this.global;
    const { currentTemplates } = sessionData;
    const { templateToDelete } = this.state;
    const temp = templateToDelete;
    const index = currentTemplates.map((a) => a.id).indexOf(temp.id);
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
        await dc.organizationDataTablePut(anObject);
        setLocalStorage(SESSION_FROM_LOCAL, JSON.stringify(sessionData));
      } catch (suppressedError) {
        console.log(`ERROR: problem writing to DB.\n${suppressedError}`);
      }
    } else {
      console.log("Error with index");
    }
  };

  loadTemplate = async (temp) => {
    await setGlobal({
      templateToUpdate: temp,
      templateName: temp.name,
      emailEditor: true,
    });
  };

  // onLoad = () => {
  //   const { templateToUpdate } = this.state;
  //   this.editor.loadDesign(templateToUpdate.design);
  // };

  sendCampaign = async (confirmed) => {
    const { sessionData, apps, SESSION_FROM_LOCAL, org_id } = this.global;
    const {
      selectedSegment,
      selectedTemplate,
      campaignName,
      fromAddress,
    } = this.state;
    const { currentSegments, campaigns } = sessionData;
    const seg = currentSegments.filter((a) => a.id === selectedSegment)[0];
    this.setState({ userCount: seg.users.length ? seg.users.length : 0 });
    const camps = campaigns ? campaigns : [];
    if (confirmed) {
      this.setState({ confirmModal: false });

      const newCampaign = {
        id: uuid(),
        name: campaignName,
        template: selectedTemplate,
        users: seg.users,
        dateSent: new Date(),
      };

      //Process the actual email send
      const emailPayload = {
        app_id: sessionData.id,
        addresses: newCampaign.users,
        from: fromAddress,
        subject: campaignName,
        org_id,
        template_id: selectedTemplate,
        campaign_id: newCampaign.id,
      };

      setGlobal({ processing: true });

      const sendEmail = await getCloudUser().processData(
        "email messaging",
        emailPayload
      );

      if (sendEmail && sendEmail.success === true) {
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
          await dc.organizationDataTablePut(anObject);
          setLocalStorage(SESSION_FROM_LOCAL, JSON.stringify(sessionData));
          this.setState({
            selectedSegment: "Choose...",
            message: "",
            notificationName: "",
          });
        } catch (suppressedError) {
          console.log(`ERROR: problem writing to DB.\n${suppressedError}`);
          toast.error("Email sent but data update failed");
        }

        setGlobal({
          sessionData,
          campaignName: "",
          selectedTemplate: "Choose...",
          selectedSegment: "Choose...",
          processing: false,
        });
        this.setState({
          selectedSegment: "Choose...",
          selectedTemplate: "Choose...",
          campaignName: "",
          fromAddress: "",
          createCampaign: false,
        });
      } else {
        console.log("Set Error");
        //  If there is an error message, return that, otherwise set a generic message
        setGlobal({ processing: false });
        const error =
          sendEmail.error && sendEmail.error.msg
            ? sendEmail.error.msg
            : "Trouble sending emails(s)";
        toast.error(error);
      }
    } else {
      this.setState({ confirmModal: true });
    }
  };

  importEmails = () => {
    const { sessionData, org_id, SESSION_FROM_LOCAL } = this.global;
    let { apps } = this.global;
    const csvFile = document.getElementById("csv-file").files[0];
    setGlobal({ processing: true, loadingMessage: "Importing emails..." });
    const reader = new FileReader();
    let emailData = [];
    reader.onabort = () => console.log("file reading was aborted");
    reader.onerror = () => console.log("file reading has failed");
    reader.onload = async () => {
      // Do whatever you want with the file contents
      const binaryStr = reader.result;
      csv({
        noheader: false,
        output: "csv",
      })
        .fromString(binaryStr)
        .then(async (csvRow) => {
          for (const item of csvRow) {
            for (const innerItem of item) {
              //  Taken from here: https://stackoverflow.com/a/16424756
              //eslint-disable-next-line
              var re = /(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))/;
              const isEmail = re.test(innerItem);
              if (isEmail) {
                emailData.push(innerItem);
              }
            }
          }
          try {
            const cmdObj = {
              command: "importEmails",
              data: {
                appId: sessionData.id,
                emails: emailData,
              },
            };

            const emailsImported = await importEmailArray(cmdObj);
            if (emailsImported.data) {
              const { data } = emailsImported;
              const { message, previouslyImported, imported } = data;

              const allEmailsGroup = {
                id: `4-${sessionData.id}`,
                name: "All Emails",
                users: [],
                userCount: previouslyImported + imported,
              };

              const thisApp = apps[sessionData.id];
              if(thisApp.imports) {
                thisApp.imports['email'] = {
                  count: previouslyImported + imported, 
                  updated: Date.now()
                }
              } else {
                thisApp['imports'] = {
                  email: {
                    count: previouslyImported + imported, 
                    updated: Date.now()
                  }
                }
              }

              apps[sessionData.id] = thisApp;

              setGlobal({ sessionData: thisApp });

              const orgData = await dc.organizationDataTableGet(org_id);

              try {
                const anObject = orgData.Item;
                anObject.apps = apps;
                anObject[process.env.REACT_APP_ORG_TABLE_PK] = org_id;
                await dc.organizationDataTablePut(anObject);
                setLocalStorage(
                  SESSION_FROM_LOCAL,
                  JSON.stringify(sessionData)
                );
                this.setState({
                  selectedSegment: "Choose...",
                  message: "",
                  notificationName: "",
                });
              } catch (suppressedError) {
                console.log(
                  `ERROR: problem writing to DB.\n${suppressedError}`
                );
                toast.error("Email sent but data update failed");
              }
              this.setState({ allEmailsGroup });
              this.setState({
                csvUploaded: false,
                importModalOpen: false,
                importing: false,
                fileName: "",
              });
              setGlobal({ processing: false });
              toast.success(message);
            } else {
              setGlobal({ processing: false });
              toast.error("Toruble importing emails");
            }
          } catch (error) {
            console.log(error);
            setGlobal({ processing: false });
            toast.error(error.message);
          }
        });
    };
    reader.readAsText(csvFile);
  };

  triggerUpload = () => {
    const upload = document.getElementById("csv-file");
    upload.click();
    document.getElementById("csv-file").addEventListener(
      "change",
      () => {
        if (upload.files) {
          this.setState({ fileName: upload.files[0].name, csvUploaded: true });
        }
      },
      false
    );
  };

  renderCreateCampaign() {
    const {
      fromAddress,
      selectedSegment,
      selectedTemplate,
      campaignName,
      confirmModal,
      userCount,
    } = this.state;

    const { sessionData, processing } = this.global;
    const { currentSegments, currentTemplates } = sessionData;
    const templates = currentTemplates ? currentTemplates : [];
    const segments = currentSegments ? currentSegments : [];
    const sendFeaturesComplete =
      selectedSegment !== "Choose..." &&
      selectedTemplate !== "Choose..." &&
      fromAddress &&
      fromAddress.length > 5 &&
      campaignName;

    if (processing) {
      return <Loader />;
    } else {
      return (
        <div className="main-content-container container-fluid px-4">
          <div className="page-header row no-gutters py-4">
            <div className="col-12 col-sm-12 text-center text-sm-left mb-0">
              <span className="text-uppercase page-subtitle">
                Communications
              </span>
              <h3 className="page-title">Create or Edit an Email Template</h3>
              <div className="col-lg-12 col-md-12 col-sm-12 mb-4">
                <h5>Create a Campaign</h5>
                <div className="form-group col-md-12">
                  <label htmlFor="inputSeg">First, Choose a Segment</label>
                  <select
                    value={selectedSegment}
                    onChange={(e) =>
                      this.setState({ selectedSegment: e.target.value })
                    }
                    id="inputSeg"
                    className="form-control"
                  >
                    <option value="Choose...">Choose...</option>
                    {segments.map((seg) => {
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
                      onChange={(e) =>
                        this.setState({ selectedTemplate: e.target.value })
                      }
                      id="inputSeg"
                      className="form-control"
                    >
                      <option value="Choose...">Choose...</option>
                      {templates.map((temp) => {
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
                    onChange={(e) =>
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
                    onChange={(e) =>
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
                    <div>
                      <button
                        onClick={() => this.sendCampaign()}
                        className="btn btn-primary"
                      >
                        Send Campaign
                      </button>
                      <button
                        onClick={() => this.setState({ createCampaign: false })}
                        className="btn btn-secondary margin-left"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div>
                      <button
                        onClick={() => this.sendCampaign()}
                        className="btn btn-secondary"
                        disabled
                      >
                        Send Campaign
                      </button>
                      <button
                        onClick={() => this.setState({ createCampaign: false })}
                        className="btn btn-secondary margin-left"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

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
        </div>
      );
    }
  }

  renderEmailComms() {
    const {
      show,
      templateToUpdate,
      showExisting,
      templateToDelete,
      deleteTempModal,
      templateName,
      createCampaign,
    } = this.state;

    const {
      sessionData,
      processing,
      emailEditor,
      loadingMessage,
    } = this.global;
    const { campaigns, currentTemplates } = sessionData;

    if (emailEditor) {
      return <EmailEditor />;
    } else if (createCampaign) {
      return <div>{this.renderCreateCampaign()}</div>;
    } else {
      return (
        <div>
          <div className="main-content-container container-fluid px-4">
            <div className="page-header row no-gutters py-4">
              <div className="col-lg-6 col-md-6 col-sm-4 text-center text-sm-left mb-0">
                <span className="text-uppercase page-subtitle">
                  Communications
                </span>
                <h3 className="page-title">Connect Through Email</h3>
              </div>
              <div className="col-lg-6 col-md-6 col-sm-12 mb-4 text-right">
                <span className="text-uppercase page-subtitle">
                  Import Emails
                </span>
                <br />
                <button
                  onClick={() => this.setState({ importModalOpen: true })}
                  style={{ fontSize: "16px", margin: "5px" }}
                  className="btn btn-success"
                >
                  Import Email Addresses
                </button>
              </div>
            </div>
            <div className="row">
              <Charts allEmailsGroup={this.state.allEmailsGroup} />
              <div className="col-lg-6 col-md-6 col-sm-12 mb-4 margin-top">
                <h5>
                  Campaigns{" "}
                  <span>
                    <button
                      onClick={() => this.setState({ createCampaign: true })}
                      className="btn btn-primary margin-left"
                    >
                      New Campaign
                    </button>
                  </span>
                </h5>
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
                          {campaigns.map((camp) => {
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
              </div>
              <div className="col-lg-6 col-md-6 col-sm-12 mb-4 margin-top">
                <div>
                  <h5>
                    Templates{" "}
                    <span>
                      <button
                        onClick={() => setGlobal({ emailEditor: true })}
                        className="btn btn-success margin-left"
                      >
                        New Template
                      </button>
                    </span>
                  </h5>
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
                            {currentTemplates.map((temp) => {
                              return (
                                <tr key={temp.id}>
                                  <td
                                    className="clickable text-primary"
                                    onClick={() => this.loadTemplate(temp)}
                                  >
                                    {temp.name}
                                  </td>
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
                onChange={(e) =>
                  this.setState({ templateName: e.target.value })
                }
                type="text"
                className="form-control template-name"
                id="tileName"
                placeholder="Give it a name"
              />
              <EmailEditor
                ref={(editor) => (this.editor = editor)}
                appearance={{
                  panels: {
                    tools: {
                      dock: "left",
                    },
                  },
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
                onChange={(e) =>
                  this.setState({ templateName: e.target.value })
                }
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

          <Modal className="custom-modal" show={processing}>
            <Modal.Body>
              <LoadingModal
                messageToDisplay={
                  loadingMessage ? loadingMessage : "Sending emails..."
                }
              />
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
    const { importModalOpen, csvUploaded, fileName } = this.state;

    return (
      <main className="main-content col-lg-10 col-md-9 col-sm-12 p-0 offset-lg-2 offset-md-3">
        <StickyNav />
        {this.renderEmailComms()}
        <Modal
          className="custom-modal"
          show={importModalOpen}
          onHide={() => this.setState({ importModalOpen: false })}
        >
          <Modal.Header closeButton>
            <Modal.Title>Import Emails</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div>
              You can import a list of email addresses and use SimpleID to send
              all of your email communications to these people.{" "}
            </div>{" "}
            <br />
            <div>
              <span className="text-muted text-small">
                You will not be able to segment these people based on blockchain
                data unless you have wallet addresses associated with the email
                addresses.
              </span>
            </div>
          </Modal.Body>
          <Modal.Body>
            <InputGroup className="mb-3">
              <button onClick={this.triggerUpload} className="btn btn-primary">
                Upload CSV
              </button>
              <p className="text-muted">{fileName}</p>
              <input style={{ display: "none" }} type="file" accept=".csv" id="csv-file" />
            </InputGroup>
          </Modal.Body>
          <Modal.Footer>
            {csvUploaded ? (
              <button className="btn btn-primary" onClick={this.importEmails}>
                Import
              </button>
            ) : (
              <button className="btn btn-primary" disabled>
                Import
              </button>
            )}

            <button
              className="btn btn-secondary"
              onClick={() => this.setState({ importModalOpen: false })}
            >
              Cancel
            </button>
          </Modal.Footer>
        </Modal>
      </main>
    );
  }
}
