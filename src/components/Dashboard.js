import React from "reactn"
import SideNav from './SideNav';
import DemoDash from "./DemoDash"
import SegmentTable from "./SegmentTable"
import SmartContractTable from "./SmartContractTable"
import { getCloudUser } from "../utils/cloudUser"
import { toast } from "react-toastify"
import { Dialog, Table } from 'evergreen-ui'
import {
  Dimmer,
  Loader,
  Header,
  Icon,
} from 'semantic-ui-react'
import {
  get7DayChart,
  get30DayChart,
  getDonutChart,
  getBubbleChart,
  getCandleStickChart,
  getChartCard
} from './Charts'

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
      showDemo,
      processing,
      aBlockId,
      importedContracts
    } = this.global
    const { loadingMessage, showSegmentModal, segmentToShow, showContractsModal } = this.state
    const { currentSegments } = sessionData
    const allTiles = currentSegments ? currentSegments : []
    const tiles = allTiles.filter(
      (a) => a.showOnDashboard === true || a.showOnDashboard === undefined
    )
    if (showDemo) {
      return <DemoDash />
    } else {
      return (
        <div>
          <SideNav />
          <main className="main-content col-lg-10 col-md-9 col-sm-12 p-0 offset-lg-2 offset-md-3">
            <div className="main-content-container container-fluid px-4">
              <div className="row no-gutters py-4">
                <div className="col-12 col-sm-4 text-center text-sm-left mb-0">
                  <h2 className="page-title">
                    {sessionData.project_name}{"  "}
                  </h2>
                </div>
              </div>

              <div className="row">
                <div className="col-12 col-sm-4 text-center text-sm-left mb-0">
                  <h3 className="page-title">
                    Real-Time Monitoring: &nbsp;<a href={"https://etherscan.io/block/" + aBlockId} target="_blank">Eth Block {aBlockId}</a>
                  </h3>
                  <br />
                </div>
              </div>
              <div className="row">
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
                            473
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
              </div>
              <div className="row">
                <div className="col-12 col-sm-4 text-center text-sm-left mb-0">
                  <h3 className="page-title">
                    Product Insights{" "}
                  </h3>
                  <br />
                </div>
              </div>
              <div className="row">
                {getChartCard('Proxy Wallet Sources Of Money', getDonutChart())}
                {getChartCard('7-Day Active Wallets', get7DayChart())}
                {getChartCard('Top 10 Wallets by Assets', getBubbleChart())}
                {getChartCard('Total Value Held In Smart Contracts', getCandleStickChart())}
              </div>
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
}
