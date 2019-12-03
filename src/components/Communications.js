import React from 'reactn';
import StickyNav from './StickyNav';
import EmailEditor from 'react-email-editor';
import Modal from 'react-bootstrap/Modal';

export default class Communications extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      show: false
    }
  }

  render() {
    const { show } = this.state;
    const { campaigns, currentSegments, currentTemplates } = this.global;
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
                campaigns.length > 0 ?
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
                currentTemplates.length > 0 ?
                <ul className="tile-list">
                {
                  currentTemplates.map(temp => {
                    return (
                    <li className="clickable card" key={temp.id}><span className="card-body standard-tile">{temp.name}</span><span onClick={() => this.deleteTemplate(temp)} className="right clickable text-danger">Remove</span></li>
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
              </div>
              <div class="form-group col-md-12">
                <label htmlFor="inputSeg">Next, Choose a Template</label>
                <select id="inputSeg" class="form-control">
                  <option selected>Choose...</option>
                  {
                    currentTemplates.map(temp => {
                      return (
                      <option key={temp.id}>{temp.name}</option>
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
                <input type="text" class="form-control" id="tileName" placeholder="Give it a name" />                           
              </div>
              <div class="form-group col-md-12">
                <label htmlFor="inputSeg">Finally, Send The Campaign</label><br/>
                <button className="btn btn-primary">Send Campaign</button>         
              </div>
            </div>
          </div>
        </div>
        <Modal className="email-modal" show={show} onHide={() => this.setState({ show: false })}>
          <Modal.Header closeButton>
            <Modal.Title>Create a New Email Template</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <p>Give your template a name</p>
            <input type="text" className="form-control template-name" id="tileName" placeholder="Give it a name" />                           
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
            <button className="btn btn-primary" onClick={() => this.deleteSegment()}>
              Save
            </button>
          </Modal.Footer>
        </Modal>
      </main>
    )
  }
}