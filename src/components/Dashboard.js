import React from "reactn"
import SideNav from './SideNav'
import SegmentTable from "./SegmentTable"
import SmartContractTable from "./SmartContractTable"
import { Dialog } from 'evergreen-ui'
import { withRouter } from 'react-router-dom';
import {
  Button,
  Dimmer,
  Loader,
  Grid,
  Header,
  Icon
} from 'semantic-ui-react'
import {
  get7DayChart,
  getMonthChart,
  getDonutChart,
  getBubbleChart,
  getChartCard
} from './Charts'
import DashboardTiles from './DashboardTiles'
import ProcessingBlock from './ProcessingBlock'

class Dashboard extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      loadingMessage: "",
      showSegmentModal: false,
      showContractsModal: false,
      segmentToShow: {},
    }
    this.uniqueEleKey = Date.now()
  }
  getUniqueKey() {
    return this.uniqueEleKey++
  }
  handleShowSegment = (segment, flag) => {
    this.setState({ segmentToShow: segment, showSegmentModal: flag })
  }
  toggleShowContracts = () => {
    this.setState({ showContractsModal: true })
  }
  render() {
    const {
      sessionData,
      processing,
      importedContracts,
      publicDashboard,
      activeUsersData
    } = this.global
    const { loadingMessage, showSegmentModal, segmentToShow, showContractsModal } = this.state
    const { currentSegments } = sessionData
    const dynamicClass = !publicDashboard ?
    "main-content col-lg-10 col-md-9 col-sm-12 p-0 offset-lg-2 offset-md-3" :
    "main-content col-lg-12 col-md-12 col-sm-12 p-0"
    return (
      <div>
        {!publicDashboard ? <SideNav /> : null}
        <main className={dynamicClass}>
          <div className="main-content-container container-fluid px-4">
          {
            (!importedContracts.length) ? (
                <Dimmer active={true} page>
                  <Icon name='magic' size="huge"/>
                  <Header as='h1' inverted>
                    Start Monitoring a Contract
                    <Header.Subheader>Features will unlock after you have imported a contract and created segments</Header.Subheader>
                  </Header>
                  <Button color='green' onClick={() => this.props.history.push('/segments')}>Create Segments</Button>
                </Dimmer>
              ) : (
                <div>
                  <div className="page-header row no-gutters py-4">
                  <div className="col-lg-6 col-md-6 col-sm-12 mb-4">
                    <span className="text-uppercase page-subtitle">Dashboard</span>
                    <h3 className="page-title">
                      {sessionData.project_name}{"  "}
                    </h3>
                  </div>
                  <div className="col-lg-6 col-md-6 col-sm-12 mb-4 text-right">
                    <ProcessingBlock />
                  </div>
                </div>
                <DashboardTiles
                  currentSegments={currentSegments}
                  importedContracts={importedContracts}
                  handleShowSegment={this.handleShowSegment}
                  toggleShowContracts={this.toggleShowContracts}
                />
                {currentSegments.length > 1 ? (<Grid>
                  {getChartCard('Wallets by Smart Contracts', getDonutChart(importedContracts))}
                  {(activeUsersData) ? getChartCard('Weekly Active Wallets', get7DayChart(activeUsersData)):null}
                  {(activeUsersData) ? getChartCard('Monthly Active Wallets', getMonthChart(activeUsersData)):null}
                  {getChartCard('Top 10 Wallets by Assets', getBubbleChart())}
                  {/*{getChartCard('Total Value Held In Smart Contracts', getCandleStickChart())}*/}
                </Grid>) : null}
                </div>
              )
          }
          </div>
          <Dialog
            isShown={showContractsModal}
            title="Imported Smart Contracts"
            onCloseComplete={() => this.toggleShowContracts()}
            hasCancel={false}
            confirmLabel='Close'
            width={640}
          >
            {showContractsModal ? <SmartContractTable contracts={importedContracts} /> : '({close})'}
          </Dialog>
          <Dialog
            isShown={showSegmentModal}
            title={segmentToShow.name}
            onCloseComplete={() => this.handleShowSegment({}, false)}
            hasCancel={false}
            confirmLabel='Close'
            width={640}
          >
            {showSegmentModal ? <SegmentTable segment={segmentToShow} /> : '({close})'}
          </Dialog>
          <Dimmer active={processing}>
            <Loader inline='centered' indeterminate>{`${loadingMessage}...`}</Loader>
          </Dimmer>
          <br />
        </main>
      </div>
    )
  }
}
export default withRouter(Dashboard);