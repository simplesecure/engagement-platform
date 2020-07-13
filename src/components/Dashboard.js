import React from "reactn"
import SideNav from './SideNav'
import SegmentTable from "./SegmentTable"
import SmartContractTable from "./SmartContractTable"
import { Dialog } from 'evergreen-ui'
import {
  Dimmer,
  Loader,
  Grid
} from 'semantic-ui-react'
import {
  get7DayChart,
  getMonthChart,
  getDonutChart,
  getBubbleChart,
  getCandleStickChart,
  getChartCard
} from './Charts'
import DashboardTiles from './DashboardTiles'
import ProcessingBlock from './ProcessingBlock'

export default class Dashboard extends React.Component {
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
      importedContracts
    } = this.global
    const { loadingMessage, showSegmentModal, segmentToShow, showContractsModal } = this.state
    const { currentSegments } = sessionData
    return (
      <div>
        <SideNav />
        <main className="main-content col-lg-10 col-md-9 col-sm-12 p-0 offset-lg-2 offset-md-3">
          <div className="main-content-container container-fluid px-4">
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
            <Grid>
              {getChartCard('Wallets by Smart Contracts', getDonutChart(importedContracts))}
              {getChartCard('Weekly Active Wallets', get7DayChart())}
              {getChartCard('Monthly Active Wallets', getMonthChart())}
              {getChartCard('Top 10 Wallets by Assets', getBubbleChart())}
              {/*{getChartCard('Total Value Held In Smart Contracts', getCandleStickChart())}*/}
            </Grid>
          </div>
          <Dialog
            isShown={showContractsModal}
            title="Imported Smart Contracts"
            onCloseComplete={() => this.toggleShowContracts()}
            hasCancel={false}
            confirmLabel='Close'
            width={640}
          >
            {showContractsModal ? <SmartContractTable contracts={importedContracts} /> : null}
          </Dialog>
          <Dialog
            isShown={showSegmentModal}
            title={segmentToShow.name}
            onCloseComplete={() => this.handleShowSegment({}, false)}
            hasCancel={false}
            confirmLabel='Close'
            width={640}
          >
            {showSegmentModal ? <SegmentTable segment={segmentToShow} /> : null}
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
