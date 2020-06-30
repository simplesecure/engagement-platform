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
import ProcessingBlock from './ProcessingBlock'

export default class Dashboard extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      loadingMessage: "",
      showSegmentModal: false,
      showContractsModal: false,
      segmentToShow: {},
      active: true
    }
    this.uniqueEleKey = Date.now()
  }
  getUniqueKey() {
    return this.uniqueEleKey++
  }
  handleShowSeg = (seg) => {
    this.setState({ segmentToShow: seg, showSegmentModal: true })
  }
  handleShow = () => this.setState({ active: true })
  handleHide = () => this.setState({ active: false })
  render() {
    const {
      sessionData,
      processing,
      importedContracts
    } = this.global
    const { loadingMessage, showSegmentModal, segmentToShow, showContractsModal } = this.state
    const { currentSegments } = sessionData
    const allTiles = currentSegments ? currentSegments : []
    const tiles = allTiles.filter(
      (a) => a.showOnDashboard === true
    )
    const makerData = require('../assets/wallets/maker.js')
    const instaData = require('../assets/wallets/instadapp.js')
    const proxyWallets = makerData.wallets.length + instaData.wallets.length
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
            <Grid>
              {importedContracts ? (
                <div
                  onClick={() => this.setState({showContractsModal: true})}
                  key={this.getUniqueKey()}
                  className="clickable col-lg-4 col-md-6 col-sm-6 mb-4"
                >
                  <div className="stats-small stats-small--1 card card-small">
                    <div className="card-body p-0 d-flex">
                      <div className="d-flex flex-column m-auto">
                        <div className="stats-small__data text-center">
                          <span className="stats-small__label text-uppercase">
                            Contracts
                          </span>
                          <h6 className="stats-small__value count my-3">
                            {Object.keys(importedContracts).length}
                          </h6>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}
              <div
                key={this.getUniqueKey()}
                className="clickable col-lg-4 col-md-6 col-sm-6 mb-4"
              >
                <div className="stats-small stats-small--1 card card-small">
                  <div className="card-body p-0 d-flex">
                    <div className="d-flex flex-column m-auto">
                      <div className="stats-small__data text-center">
                        <span className="stats-small__label text-uppercase">
                          Proxy Wallets
                        </span>
                        <h6 className="stats-small__value count my-3">
                          {proxyWallets}
                        </h6>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {tiles.map((tile) => {
                return (
                  <div
                    onClick={() => this.handleShowSeg(tile)}
                    key={tile.id}
                    className="clickable col-lg-4 col-md-6 col-sm-6 mb-4"
                  >
                    <div className="stats-small stats-small--1 card card-small">
                      <div className="card-body p-0 d-flex">
                        <div className="d-flex flex-column m-auto">
                          <div className="stats-small__data text-center">
                            <span className="stats-small__label text-uppercase">
                              {tile.name}
                            </span>
                            <h6 className="stats-small__value count my-3">
                              {tile.userCount ? tile.userCount : 0}
                            </h6>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </Grid>
            <Grid>
              {getChartCard('Wallets by Smart Contracts', getDonutChart(importedContracts, proxyWallets))}
              {getChartCard('Weekly Active Wallets', get7DayChart())}
              {getChartCard('Monthly Active Wallets', getMonthChart())}
              {getChartCard('Top 10 Wallets by Assets', getBubbleChart())}
              {/*{getChartCard('Total Value Held In Smart Contracts', getCandleStickChart())}*/}
            </Grid>
          </div>
          <Dialog
            isShown={showContractsModal}
            title="Imported Smart Contracts"
            onCloseComplete={() => this.setState({ showContractsModal: false })}
            hasCancel={false}
            confirmLabel='Close'
            width={640}
          >
            <SmartContractTable contracts={importedContracts} />
          </Dialog>
          <Dialog
            isShown={showSegmentModal}
            title={segmentToShow.name}
            onCloseComplete={() => this.setState({ showSegmentModal: false, segmentToShow: {} })}
            hasCancel={false}
            confirmLabel='Close'
            width={640}
          >
            <SegmentTable seg={segmentToShow} />
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
