import React from "reactn"
import { Grid } from 'semantic-ui-react'
import SegmentTable from "./SegmentTable"
import { Dialog } from 'evergreen-ui'

export default class DashboardTiles extends React.Component {
  constructor(props) {
    super(props)
    this.uniqueEleKey = Date.now()
    this.state = {
      name: '',
      wallets: '',
      showTileModal: false
    }
  }
  getUniqueKey() {
    return this.uniqueEleKey++
  }
  getCurrentContractTile = () => {
    const { importedContracts, currentContractAddr } = this.props
    let currAddr = currentContractAddr
    if (currAddr === '') {
      currAddr = Object.keys(importedContracts)[0]
    }
    const name = importedContracts[currAddr].contract_name
    const wallet_count = importedContracts[currAddr].wallet_count
    const recent_wallets = importedContracts[currAddr].recent_wallets
    return (
      <div
        onClick={() => this.setState({showTileModal: true, name, wallets: recent_wallets})}
        key={this.getUniqueKey()}
        className="clickable col-lg-4 col-md-6 col-sm-6 mb-4"
      >
        <div className="stats-small stats-small--1 card card-small">
          <div className="card-body p-0 d-flex">
            <div className="d-flex flex-column m-auto">
              <div className="stats-small__data text-center">
                <span className="stats-small__label text-uppercase">
                  {`${name} wallets`}
                </span>
                <h6 className="stats-small__value count my-3">
                  {wallet_count}
                </h6>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }
  getTotalTracked = () => {
    const { importedContracts } = this.props
    let totalTracked = 0
    Object.entries(importedContracts).map(([key,value]) => {
      totalTracked += parseInt(value.wallet_count)
    })
    if (totalTracked) {
      return (
        <div
          key='totaltrackedwallets'
          className="col-lg-4 col-md-6 col-sm-6 mb-4"
        >
          <div className="stats-small stats-small--1 card card-small" style={{backgroundColor: 'white'}}>
            <div className="card-body p-0 d-flex">
              <div className="d-flex flex-column m-auto">
                <div className="stats-small__data text-center">
                  <span className="stats-small__label text-uppercase">
                    Total Tracked Wallets
                  </span>
                  <h6 className="stats-small__value count my-3">
                    {totalTracked}
                  </h6>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    }
    else return null
  }
  getCurrentContract = () => {
    const { importedContracts, currentContractAddr } = this.props
    let currAddr = currentContractAddr
    if (currAddr === '') {
      currAddr = Object.keys(importedContracts)[0]
    }
    const name = importedContracts[currAddr].contract_name
    return (
      <div
        onClick={() => this.props.toggleShowContracts()}
        key={this.getUniqueKey()}
        className="clickable col-lg-4 col-md-6 col-sm-6 mb-4"
      >
        <div className="stats-small stats-small--1 card card-small">
          <div className="card-body p-0 d-flex">
            <div className="d-flex flex-column m-auto">
              <div className="stats-small__data text-center">
                <span className="stats-small__label text-uppercase">
                  Current Contract
                </span>
                <h6 className="stats-small__value count my-3">
                  {name}
                </h6>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }
  getSegmentTiles = () => {
    const { currentSegments } = this.props
    const allTiles = currentSegments ? currentSegments : []
    return allTiles.map(tile => {
      return (
        <div
          onClick={() => (tile.version === '2.0') ? null : this.props.handleShowSegment(tile, true)}
          key={tile.id}
          className="clickable col-lg-4 col-md-6 col-sm-6 mb-4"
        >
          <div className="stats-small stats-small--1 card card-small" style={{backgroundColor: tile.color}}>
            <div className="card-body p-0 d-flex">
              <div className="d-flex flex-column m-auto">
                <div className="stats-small__data text-center">
                  <span className="stats-small__label text-uppercase">
                    {tile.name === 'All Users' ? "Tracked Wallets" : tile.name}
                  </span>
                  <h6 className="stats-small__value count my-3">
                    {tile.userCount ? tile.userCount : 0}
                  </h6>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    })
  }
  render () {
    const { name, wallets, showTileModal } = this.state
    return (
      <Grid>
        <Dialog
          isShown={showTileModal}
          title={name}
          onCloseComplete={() => this.setState({ showTileModal: false })}
          confirmLabel='Close'
          hasCancel={false}
          width={640}
        >
          <SegmentTable wallets={wallets} />
        </Dialog>
        {this.getTotalTracked()}
        {this.getCurrentContract()}
        {this.getCurrentContractTile()}
        {this.getSegmentTiles()}
      </Grid>
    )
  }
}
