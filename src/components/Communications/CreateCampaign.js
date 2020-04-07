import React from "react";

const CreateCampaign = () => {
  return (
    <div className="col-lg-6 col-md-6 col-sm-12 mb-4">
      <h5>Create a Campaign</h5>
      <div className="form-group col-md-12">
        <label htmlFor="inputSeg">First, Choose a Segment</label>
        <select
          value={selectedSegment}
          onChange={(e) => this.setState({ selectedSegment: e.target.value })}
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
        <label htmlFor="inputSeg">Enter The From Address</label> <br />
        <span className="text-muted">
          This will be the address recipients see and can respond to
        </span>
        <input
          value={fromAddress}
          onChange={(e) => this.setState({ fromAddress: e.target.value })}
          type="email"
          className="form-control"
          id="tileNameFromAddress"
          placeholder="From email address your users will see and reply to"
        />
      </div>
      <div className="form-group col-md-12">
        <label htmlFor="inputSeg">Now, Give Your Campaign A Name</label> <br />
        <span className="text-muted">
          This will act as the subject line for your email
        </span>
        <input
          value={campaignName}
          onChange={(e) => this.setState({ campaignName: e.target.value })}
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
  );
};

export default CreateCampaign;
