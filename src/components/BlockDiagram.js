import React from "reactn"
import { Link } from "react-router-dom";
import {
  Button,
  Tab
} from 'semantic-ui-react'
import { TriggerBlocks, ActionBlocks, LogicBlocks } from './StandardBlocks'
import { setupBlockOptions } from '../components/BlockOptions'

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

export default class BlockDiagram extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      options: false
    }
  }
  componentDidMount() {
    this.props.flowy.setupFlowy()
  }
  componentWillUnmount() {
    this.props.flowy.cleanFlowy()
    //ugly hack until flowy fix is found
    // window.location.reload(false)
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
            <Button primary onClick={() => this.props.flowy.saveBlocks()}>Save Logic</Button>
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
              {setupBlockOptions(this.props.flowy.getCurrentBlocks())}
              <div class="checkus">
                <img alt="checkon" src={require("../assets/img/checkon.svg")} />
                <p>Log successful performance</p>
              </div>
              {/*<div class="checkus">
                <img alt="checkoff" src={require("../assets/img/checkoff.svg")} />
                <p>Give priority to this block</p>
              </div>*/}
            </div>
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
