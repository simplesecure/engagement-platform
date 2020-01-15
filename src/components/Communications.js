import React, { setGlobal } from 'reactn';
import StickyNav from './StickyNav';
import EmailEditor from 'react-email-editor';
import Modal from 'react-bootstrap/Modal';
import uuid from 'uuid/v4';
import { putInOrganizationDataTable, getFromOrganizationDataTable } from '../utils/awsUtils';
import { setLocalStorage } from '../utils/misc';

export default class Communications extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      show: false, 
      selectedSegment: "Choose...", 
      selectedTemplate: "Choose...", 
      campaignName: "",
      templateName: "", 
      templateToUpdate: {}
    }
  }

  saveTemplate = (temp) => {
    const { sessionData, SESSION_FROM_LOCAL, org_id, apps } = this.global;
    const { currentTemplates } = sessionData;
    const { templateName } = this.state;
    const templates = currentTemplates ? currentTemplates : [];
    if(temp) {
      this.editor.exportHtml(async data => {
        const { design, html } = data
        const thisTemplate = templates.filter(a => a.id === temp.id)[0];
        thisTemplate.design = design;
        thisTemplate.html = html;

        sessionData.currentTemplates = templates;
        const thisApp = apps[sessionData.id]
        thisApp.currentTemplates = templates;
  
        setGlobal({ sessionData, apps });
        this.setState({ showExisting: false });
        //Now we save to the DB
      
        //
        // TODO: probably want to wait on this to finish and throw a status/activity
        //       bar in the app:
        const orgData = await getFromOrganizationDataTable(org_id);

        try {
          const anObject = orgData.Item
          anObject.apps = apps;
          anObject[process.env.REACT_APP_OD_TABLE_PK] = org_id
  
          await putInOrganizationDataTable(anObject)
          setLocalStorage(SESSION_FROM_LOCAL, JSON.stringify(sessionData));
          setGlobal({ templateName: ""})
        } catch (suppressedError) {
          console.log(`ERROR: problem writing to DB.\n${suppressedError}`)
        }
      })
    } else {
      this.editor.exportHtml(async data => {
        const { design, html } = data
        const newTemplate = {
          id: uuid(), 
          name: templateName,
          design, 
          html
        }
        templates.push(newTemplate);
        sessionData.currentTemplates = templates;
        const thisApp = apps[sessionData.id]
        thisApp.currentTemplates = templates;
  
        setGlobal({ sessionData, apps });
        this.setState({ show: false });
        //Now we save to the DB
      
        //
        // TODO: probably want to wait on this to finish and throw a status/activity
        //       bar in the app:
        const orgData = await getFromOrganizationDataTable(org_id);

        try {
          const anObject = orgData.Item
          anObject.apps = apps;
          anObject[process.env.REACT_APP_OD_TABLE_PK] = org_id
  
          await putInOrganizationDataTable(anObject)
          setLocalStorage(SESSION_FROM_LOCAL, JSON.stringify(sessionData));
          setGlobal({ templateName: ""})
        } catch (suppressedError) {
          console.log(`ERROR: problem writing to DB.\n${suppressedError}`)
        }
      })
    }
  }

  deleteTemplate = async (temp) => {
    const { sessionData, org_id, apps, SESSION_FROM_LOCAL } = this.global;
    const { currentTemplates } = sessionData;
    const index = currentTemplates.map(a => a.id).indexOf(temp.id);
    if(index > -1) {
      currentTemplates.splice(index, 1);
      const thisApp = apps.filter(a => a.id === sessionData.id)[0];
      thisApp.currentTemplates = currentTemplates;

      setGlobal({ sessionData, apps });
      //Update in DB
      const orgData = await getFromOrganizationDataTable(org_id);

      try {
        const anObject = orgData.Item
        anObject.apps = apps;
        anObject[process.env.REACT_APP_OD_TABLE_PK] = org_id
        await putInOrganizationDataTable(anObject)
        setLocalStorage(SESSION_FROM_LOCAL, JSON.stringify(sessionData));
      } catch (suppressedError) {
        console.log(`ERROR: problem writing to DB.\n${suppressedError}`)
      }

    } else {
      console.log("Error with index")
    }
  }

  loadTemplate = async (temp) => {
    await this.setState({ templateToUpdate: temp, templateName: temp.name });
    this.setState({ showExisting: true });
  }

  onLoad = () => {
    const { templateToUpdate } = this.state;
    this.editor.loadDesign(templateToUpdate.design);
  }

  sendCampaign = async () => {
    const { sessionData, simple } = this.global;
    const { selectedSegment, selectedTemplate, campaignName } = this.state;
    const { currentSegments, currentTemplates } = sessionData;
    const seg = currentSegments.filter(a => a.id === selectedSegment)[0]
    console.log(seg)
    //const camps = campaigns ? campaigns : [];
    //First we need to take the campaign data and send it to the iframe to process
    const newCampaign = {
      id: uuid(), 
      name: campaignName, 
      template: selectedTemplate, 
      users: seg.users, 
      dateSent: new Date()
    }

    //Process the actual email send
    const emailPayload = {
      app_id: sessionData.id, 
      addresses: newCampaign.users, 
      template: currentTemplates.filter(a => a.id === selectedTemplate)[0], 
      subject: campaignName
    }

    const letsSee = await simple.processData('email messaging', emailPayload)
    console.log("UUID RESULTS: ", letsSee)
    // camps.push(newCampaign);
    // sessionData.campaigns = camps;
    // const thisApp = apps.filter(a => a.id === sessionData.id)[0];
    // thisApp.campaigns = camps;

    // //TODO: Actually send the campaign
    // // On a successful send, we can then update the db to reflect the sent campaigns and set this.state.
    // setGlobal({ sessionData, campaignName: "", selectedTemplate: "Choose...", selectedSegment: "Choose..." })
  }

  render() {
    const { show, templateToUpdate, showExisting } = this.state;
    const { sessionData } = this.global;
    const { selectedSegment, selectedTemplate, templateName, campaignName } = this.state;
    const { campaigns, currentSegments, currentTemplates } = sessionData;
    const templates = currentTemplates ? currentTemplates : [];
    const segments = currentSegments ? currentSegments : [];
    return(
      <main className="main-content col-lg-10 col-md-9 col-sm-12 p-0 offset-lg-2 offset-md-3">
        <StickyNav />

        <div className="main-content-container container-fluid px-4">
          <div className="page-header row no-gutters py-4">
            <div className="col-12 col-sm-4 text-center text-sm-left mb-0">
              <span className="text-uppercase page-subtitle">Communications</span>
              <h3 className="page-title">Connect Through Email</h3>
            </div>
          </div>
          <div className="row">
            <div className="col-lg-6 col-md-6 col-sm-12 mb-4">
              <h5>Campaigns</h5>
              {
                campaigns && campaigns.length > 0 ?
                <ul className="tile-list">
                {
                  campaigns.map(camp => {
                    return (
                    <li className="clickable card text-center" key={camp.id}><span className="card-body standard-tile">{camp.name}</span><span className="open-rate">{camp.openRate} opened</span><span className="click-rate">{camp.clickRate} clicked</span></li>
                    )
                  })
                }
                </ul> : 
                <ul className="tile-list">
                  <li className="card"><span className="card-body">You haven't sent any campaigns yet, let's do that now!</span></li>
                </ul>
              }
              <div>
                <h5>Templates</h5>
                {
                currentTemplates && currentTemplates.length > 0 ?
                <ul className="tile-list">
                {
                  currentTemplates.map(temp => {
                    return (
                    <li className="clickable card" key={temp.id}><span onClick={() => this.loadTemplate(temp)} className="card-body standard-tile">{temp.name}</span><span onClick={() => this.deleteTemplate(temp)} className="right clickable text-danger">Remove</span></li>
                    )
                  })
                }
                </ul> : 
                <ul className="tile-list">
                  <li className="card"><span className="card-body">You haven't created any email templates yet.</span></li>
                </ul>
              }
              </div>
            </div>
            <div className="col-lg-6 col-md-6 col-sm-12 mb-4">
              <h5>Create a Campaign</h5>
              <div class="form-group col-md-12">
                <label htmlFor="inputSeg">First, Choose a Segment</label>
                <select value={selectedSegment} onChange={(e) => this.setState({ selectedSegment: e.target.value })} id="inputSeg" class="form-control">
                  <option value="Choose...">Choose...</option>
                  {
                    segments.map(seg => {
                      return (
                      <option value={seg.id} key={seg.id}>{seg.name}</option>
                      )
                    })
                  }
                </select>
              </div>
              <div class="form-group col-md-12">
                <label htmlFor="inputSeg">Next, Choose a Template</label>
                <select value={selectedTemplate} onChange={(e) => this.setState({ selectedTemplate: e.target.value })} id="inputSeg" class="form-control">
                  <option value="Choose...">Choose...</option>
                  {
                    templates.map(temp => {
                      return (
                      <option value={temp.id} key={temp.id}>{temp.name}</option>
                      )
                    })
                  }
                </select>             
              </div>
              <div class="form-group col-md-12">
                <label>Or Create A New Template</label><br/>
                <button onClick={() => this.setState({ show: true })} className="btn btn-secondary">Create New Template</button>
              </div>
              <div class="form-group col-md-12">
                <label htmlFor="inputSeg">Now, Give Your Campaign A Name</label> 
                <input value={campaignName} onChange={(e) => this.setState({ campaignName: e.target.value })} type="text" class="form-control" id="tileName" placeholder="Give it a name" />                           
              </div>
              <div class="form-group col-md-12">
                <label htmlFor="inputSeg">Finally, Send The Campaign</label><br/>
                <button onClick={this.sendCampaign} className="btn btn-primary">Send Campaign</button>         
              </div>
            </div>
          </div>
        </div>
        {/*CREATE NEW TEMPLATE*/}
        <Modal className="email-modal" show={show} onHide={() => this.setState({ show: false })}>
          <Modal.Header closeButton>
            <Modal.Title>Create a New Email Template</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <p>Give your template a name</p>
            <input value={templateName} onChange={(e) => this.setState({ templateName: e.target.value })} type="text" className="form-control template-name" id="tileName" placeholder="Give it a name" />                           
            <EmailEditor
              ref={editor => this.editor = editor}
              // onLoad={this.onLoad}
              // onDesignLoad={this.onDesignLoad}
            />
          </Modal.Body>
          <Modal.Footer>
            <button className="btn btn-secondary" onClick={() => this.setState({ show: false })}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={() => this.saveTemplate(null)}>
              Save
            </button>
          </Modal.Footer>
        </Modal>
        
        {/*UPDATE OR VIEW EXISTING TEMPLATE*/}
        <Modal className="email-modal" show={showExisting} onHide={() => this.setState({ showExisting: false })}>
          <Modal.Header closeButton>
            <Modal.Title>Create a New Email Template</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <p>Give your template a name</p>
            <input value={templateName} onChange={(e) => this.setState({ templateName: e.target.value })} type="text" className="form-control template-name" id="tileName" placeholder="Give it a name" />                           
            <EmailEditor
              ref={editor => this.editor = editor}
              onLoad={this.onLoad}
              // onDesignLoad={this.onDesignLoad}
            />
          </Modal.Body>
          <Modal.Footer>
            <button className="btn btn-secondary" onClick={() => this.setState({ showExisting: false })}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={() => this.saveTemplate(templateToUpdate)}>
              Save
            </button>
          </Modal.Footer>
        </Modal>
      </main>
    )
  }
}