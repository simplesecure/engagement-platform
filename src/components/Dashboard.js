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
  // getDonutChart,
  // getMvp30BubbleChart,
  // getMvpAllBubbleChart,
  getMonitoredEventChart,
  getRetentionLineChart,
  getChartCard,
  getTop50Wallets,
  getCustomChart,
  getTopAssets,
  getRetentionChart
} from './Charts'
import DashboardTiles from './DashboardTiles'
import ProcessingBlock from './ProcessingBlock'
import ReactGA from 'react-ga'

class Dashboard extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      loadingMessage: "",
      showSegmentModal: false,
      showContractsModal: false,
      segmentToShow: {},
      currentContractAddr: ''
    }
    this.uniqueEleKey = Date.now()
    ReactGA.pageview('/dashboard')
  }
  getUniqueKey() {
    return this.uniqueEleKey++
  }
  handleShowSegment = (segment, flag) => {
    this.setState({ segmentToShow: segment, showSegmentModal: flag })
  }
  toggleShowContracts = () => {
    this.setState({ showContractsModal: !this.state.showContractsModal })
  }
  render() {
    const {
      sessionData,
      processing,
      publicDashboard,
      eventData,
      tokenTop50Wallets,
      customChartData,
      topAssetsByContract,
      retentionForContract
    } = this.global
    const { loadingMessage, showSegmentModal, segmentToShow, showContractsModal, currentContractAddr } = this.state
    const { currentSegments, monitoring } = sessionData
    let contractName = ''
    let noMonitoring = true
    if (!monitoring) {
      noMonitoring = true
    } else if (!Object.keys(monitoring).length) {
      noMonitoring = true
    }
    else {
      noMonitoring = false
    }
    if (!noMonitoring) {
      if (currentContractAddr) {
        contractName = monitoring[currentContractAddr].contract_name
      }
      else {
        contractName = monitoring[Object.keys(monitoring)[0]].contract_name
      }
    }
    const dynamicClass = !publicDashboard ?
    "main-content col-lg-10 col-md-9 col-sm-12 p-0 offset-lg-2 offset-md-3" :
    "main-content col-lg-12 col-md-12 col-sm-12 p-0"
    return (
      <div>
        {!publicDashboard ? <SideNav /> : null}
        <main className={dynamicClass}>
          <div className="main-content-container container-fluid px-4">
          {
            (noMonitoring) ? (
                <Dimmer active={true} page>
                  <Icon name='magic' size="huge"/>
                  <Header as='h1' inverted>
                    Start Monitoring a Contract
                    <Header.Subheader>Features will unlock after you have imported a contract and created segments</Header.Subheader>
                  </Header>
                  <Button color='green' onClick={() => this.props.history.push('/segments')}>Go to Segments</Button>
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
                {(!noMonitoring) ? (<DashboardTiles
                  currentSegments={currentSegments}
                  importedContracts={monitoring}
                  currentContractAddr={currentContractAddr}
                  handleShowSegment={this.handleShowSegment}
                  toggleShowContracts={this.toggleShowContracts}
                />) : null}
                {(!noMonitoring) ? (<Grid>
                  {/* {getChartCard('Wallets by Smart Contracts', getDonutChart(monitoring))} */}
                  {getChartCard(get7DayChart(`Daily Transactions: ${contractName}`, currentContractAddr, monitoring))}
                  {getChartCard(getMonthChart(`Weekly Transactions: ${contractName}`, currentContractAddr, monitoring))}
                  {getMonitoredEventChart(`Top Smart Contract Events: ${contractName}`, currentContractAddr, monitoring, eventData)}
                  {/* {getChartCard(getMvp30BubbleChart(`Monthly Wallet Retention: ${contractName}`, currentContractAddr, monitoring))} */}
                  {getTopAssets(`Top Tokens in Contract: ${contractName}`, currentContractAddr, monitoring, topAssetsByContract)}
                  {getTop50Wallets(`Top 50 Wallets with Token: ${contractName}`, currentContractAddr, monitoring, tokenTop50Wallets, customChartData)}
                  {getCustomChart(contractName, currentContractAddr, monitoring, customChartData)}
                  {getRetentionChart(contractName, currentContractAddr, monitoring, retentionForContract)}
                  {getRetentionLineChart(contractName, currentContractAddr, monitoring, retentionForContract)}
                  {/* {getChartCard(getMvp30BubbleChart(`Top Wallets with Asset: ${contractName}`, currentContractAddr, monitoring, tokenTop50Wallets))} */}
                  {/* {getChartCard(`Top 10 Wallets Transactions All Time: ${contractName}`, getMvpAllBubbleChart(currentContractAddr, monitoring))} */}
                  {/*{getChartCard('Total Value Held In Smart Contracts', getCandleStickChart())}*/}
                </Grid>) : null}
                </div>
              )
          }
          </div>
          <Dialog
            isShown={showContractsModal}
            title="Imported Smart Contracts"
            onConfirm={() => this.setState({ showContractsModal: false })}
            hasCancel={false}
            confirmLabel='Close'
            width={640}
          >
            {showContractsModal ? <SmartContractTable 
              onCloseComplete={() => this.setState({ showContractsModal: false })}
              setCurrentContract={(key) => {this.setState({currentContractAddr: key})}} 
              contracts={monitoring} /> : '({close})'}
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