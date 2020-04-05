import React, { useState, useGlobal } from "reactn";
import { Editor } from "grapesjs-react";
import "grapesjs/dist/css/grapes.min.css";
import * as dc from '../../utils/dynamoConveniences.js'
import { setLocalStorage } from "../../utils/misc";
import { toast } from "react-toastify";
import Loader from '../Loader';
const uuid = require("uuid/v4");

const EmailEditor = props => {
  const [data, setData] = useState();
  const [loading, setLoading] = useState(false);
  const [templateToUpdate, setTemplate] = useGlobal('templateToUpdate');
  const [SESSION_FROM_LOCAL] = useGlobal('SESSION_FROM_LOCAL');
  const [sessionData, setSessionData] = useGlobal('sessionData');
  const [apps, setApps] = useGlobal('apps');
  const [org_id] = useGlobal('org_id');
  const [emailEditor, setEmailEditor] = useGlobal('emailEditor');//eslint-disable-line
  const [templateName, setTemplateName] = useState('');

  const handleInit = data => {
    const existingTemplate = Object.keys(templateToUpdate).length > 0;

    //  We are disabling the image upload capabilities to prevent base64 encoding problems
    //  See this article about embeded images in email clients: 
    //  https://www.campaignmonitor.com/blog/email-marketing/2019/04/embedded-images-in-html-email/
    
    const imageUploadConfig = data.AssetManager.getConfig();
    console.log(imageUploadConfig);
    imageUploadConfig.dropzone = 0;
    imageUploadConfig.upload = 0;

    //  This ensures the the url enters for the image path is handled properly.

    imageUploadConfig.handleAdd = (textFromInput) => {
      data.AssetManager.add(textFromInput);
    }

    //  Note: we also disabled the dropzone via css. In style.css, find this under the 
    //  .gjs-am-file-uploader class and the .gjs-am-assets-cont class. Remove both to reset to 
    //  defaults

    if (Object.keys(templateToUpdate).length > 0) {
      data.setComponents(templateToUpdate.html);
    } else {
      data.setComponents('');
    }
    setData(data);
    if(existingTemplate) {
      setTemplateName(templateToUpdate.name);
    }
  };
  const handleSave = async() => {
    //  Check if we're updating an existing template or not
    const existingTemplate = Object.keys(templateToUpdate).length > 0;
    const id = existingTemplate ? templateToUpdate.id : uuid();
    const html = data.runCommand("gjs-get-inlined-html");
    
    let { currentTemplates } = sessionData;

    const thisTemplate = {
      id, 
      name: templateName, 
      html
    }

    if(existingTemplate) {
        //  Find the template
        const index = currentTemplates.map(a => a.id).indexOf(templateToUpdate.id);
        if(index > -1) {

        } else {
          console.log('Error with index');
          toast.error('Could not update template');
        }
        currentTemplates[index] = thisTemplate;
        sessionData.currentTemplates = currentTemplates;
    } else {
      currentTemplates.unshift(thisTemplate);
    }
    
    try {
      setLoading(true);
      apps[sessionData.id] = sessionData;
      const orgData = await dc.organizationDataTableGet(org_id);

      const anObject = orgData.Item;
      anObject.apps = apps;
      anObject[process.env.REACT_APP_ORG_TABLE_PK] = org_id;

      await dc.organizationDataTablePut(anObject)
      setLocalStorage(SESSION_FROM_LOCAL, JSON.stringify(sessionData));
      setSessionData(sessionData);
      setApps(apps);
      setLoading(false);
      
      handleClose();
    } catch (error) {
      setLoading(false);
      console.log(error);
      toast.error(error.message);
    }
  };

  const handleClose = () => {
    setTemplate({});
    setEmailEditor(false)
  }

  const handleDestroy = async data => {
    data.destroy();
  };
  if(loading) {
    return (
      <Loader />
    )
  } else {
    return (
      <div>
        <div className="main-content-container container-fluid px-4">
          <div className="page-header row no-gutters py-4">
            <div className="col-12 col-sm-12 text-center text-sm-left mb-0">
              <span className="text-uppercase page-subtitle">Communications</span>
              <h3 className="page-title">Create or Edit an Email Template</h3>
              <div>
                <div>
                  <div style={{marginTop: "15px"}}>
                    <label htmlFor="inputSeg" style={{fontSize: "16px"}}>Template Name</label> <br />
                    <input
                      value={templateName}
                      style={{width: "45%"}}
                      onChange={e => setTemplateName(e.target.value)}
                      type="text"
                      className="form-control"
                      id="templateName"
                      placeholder="Give it a name"
                    />
                  </div>
  
                  <div style={{ marginTop: "15px" }}>
                    <button
                      onClick={handleSave}
                      style={{ marginRight: "8px" }}
                      className="btn btn-primary"
                    >
                      Save
                    </button>
                    <button
                      onClick={handleClose}
                      className="btn btn-secondary"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
              
            </div>
          </div>
          <div className="row">
            <div className="col-lg-12 col-md-12 col-sm-12 mb-4">
              <Editor onInit={handleInit} onDestroy={handleDestroy} />
            </div>
          </div>
        </div>
      </div>
    );
  }
};

export default EmailEditor;
