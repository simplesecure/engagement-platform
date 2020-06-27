import React from "reactn"
import { Link } from "react-router-dom";
import {
  Button,
  Tab
} from 'semantic-ui-react'
import { TriggerBlocks, ActionBlocks, LogicBlocks } from './StandardBlocks'

const panes = [
  {
    menuItem: 'Triggers',
    render: () => <Tab.Pane attached={false} content={<TriggerBlocks />} />,
  },
  {
    menuItem: 'Actions',
    render: () => <Tab.Pane attached={false} content={<ActionBlocks />} />,
  },
  {
    menuItem: 'Logic',
    render: () => <Tab.Pane attached={false} content={<LogicBlocks />} />,
  },
]

export default class BlockDiagramHTMLComponent extends React.Component {
  componentDidMount() {
    this.props.flowy.setupFlowy()
  }
  componentWillUnmount() {
    this.props.flowy.cleanFlowy()
    //ugly hack until flowy fix is found
    window.location.reload(false)
  }
  render() {
    return (
      <div id="body" style={{height: "100vh"}}>
        <div id="navigation">
          <div id="leftside">
            <div id="details">
              <div id="names">
                <p id="title">SimpleID Logic Flowchart Engine</p>
                <p id="subtitle">Create Segment Diagram</p>
              </div>
            </div>
          </div>
          <div id="centerswitch">
            {/*<div id="leftswitch">Diagram view</div>*/}
            {/*<div id="rightswitch">Code editor</div>*/}
          </div>
          <div id="buttonsright">
            <Link to="/segments"><Button color='red' onClick={() => this.props.flowy.deleteBlocks()}>Discard</Button></Link>
            <Link to="/segments"><Button primary>Save Logic</Button></Link>
          </div>
        </div>
        <div id="leftcard">
          <Tab menu={{ attached: true, borderless: true, pointing: true, secondary: true }} panes={panes} />
        </div>
        <div id="propwrap">
          <div id="properties">
            <div id="close">
              <img alt="close" src={require("../assets/img/close.svg")} />
            </div>
            <p id="header2">Block Properties</p>
            <div id="proplist">
              <p class="inputlabel">Select database</p>
              <div class="dropme">Database 1 <img alt="dropdown" src={require("../assets/img/dropdown.svg")} /></div>
              <p class="inputlabel">Check properties</p>
              <div class="dropme">All<img alt="dropdown" src={require("../assets/img/dropdown.svg")} /></div>
              <p class="inputlabel">More properties</p>
              <div class="dropme">All<img alt="dropdown" src={require("../assets/img/dropdown.svg")} /></div>
              <div class="checkus">
                <img alt="checkon" src={require("../assets/img/checkon.svg")} />
                <p>Log on successful performance</p>
              </div>
              <div class="checkus">
                <img alt="checkoff" src={require("../assets/img/checkoff.svg")} />
                <p>Give priority to this block</p>
              </div>
            </div>
            <div id="divisionthing" />
            <div id="removeblock">
              <Button color='red'>Delete blocks</Button>
            </div>
          </div>
        </div>
        <div id="canvas" />
      </div>
    )
  }
}
