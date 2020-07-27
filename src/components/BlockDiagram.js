import React from "reactn"
import { Link } from "react-router-dom";
import {
  Button,
  Tab
} from 'semantic-ui-react'
import { Dialog } from 'evergreen-ui'
import { TriggerBlocks, ActionBlocks, LogicBlocks } from './BlockStandard'
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
      options: false,
      currentBlock: null
    }
  }
  componentDidMount() {
    this.props.flowy.setupFlowy()
    this.props.flowy.loadFlowy()
    document.addEventListener("mouseup", this.doneTouch, false)
  }
  componentWillUnmount() {
    this.props.flowy.cleanFlowy()
    document.removeEventListener("mouseup", this.doneTouch)
    //ugly hack until flowy fix is found
    window.location.reload(false)
  }
  doneTouch = (event) => {
    this.props.flowy.doneTouch(event)
    this.setState({ currentBlock: this.props.flowy.getCurrentBlock()})
  }
  closeProperties = () => {
    this.setState({ currentBlock: null})
    this.props.flowy.deselectBlocks(true)
  }
  render() {
    const { flowy } = this.props
    const { currentBlock } = this.state
    const isShown = currentBlock !== null
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
            <Link to="/segments"><Button>Cancel</Button></Link>
            <Button color='red' onClick={() => flowy.deleteBlocks()}>Delete Logic</Button>
            <Button primary onClick={() => flowy.saveBlocks()}>Save Logic</Button>
          </div>
        </div>
        <div id="leftcard">
          <Tab menu={{ attached: true, borderless: true, pointing: true, secondary: true }} panes={panes} />
        </div>
        <Dialog
          isShown={isShown}
          title={`${currentBlock} Properties`}
          onConfirm={() => console.log("Block Confirmed")}
          onCloseComplete={() => this.closeProperties()}
          onCancel={() => this.closeProperties()}
          hasClose={false}
          confirmLabel='Save'
          width={640}
          minHeightContent={200}
        >
          {setupBlockOptions(currentBlock)}
        </Dialog>
        {/*<div id="propwrap">
          <div id="properties">
            <div id="close">
              <img alt="close" src={require("../assets/img/close.svg")} />
            </div>
            <p id="header2">Block Properties</p>
            <div id="proplist">
              {setupBlockOptions(this.props.flowy.getCurrentBlock())}
              <div class="checkus">
                <img alt="checkon" src={require("../assets/img/checkon.svg")} />
                <p>Log successful performance</p>
              </div>
              <div class="checkus">
                <img alt="checkoff" src={require("../assets/img/checkoff.svg")} />
                <p>Give priority to this block</p>
              </div>
            </div>
            <div id="removeblock">
              <Button color='red'>Delete blocks</Button>
            </div>
          </div>
        </div>*/}
        <div id="canvas" />
      </div>
    )
  }
}
