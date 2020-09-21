import React from "reactn"
import { Grid } from 'semantic-ui-react'

export default class DashboardTiles extends React.Component {
  constructor(props) {
    super(props)
    this.uniqueEleKey = Date.now()
  }
  getUniqueKey() {
    return this.uniqueEleKey++
  }
  getImportedContractTile = () => {
    const { importedContracts } = this.props
    if (!importedContracts) {
      return null
    }
    else {
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
      )
    }
  }
  getSegmentTiles = () => {
    const { currentSegments } = this.props
    const allTiles = currentSegments ? currentSegments : []
    // const tiles = allTiles.filter(
    //   (a) => a.showOnDashboard === true
    // )
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
    return (
      <Grid>
        {this.getImportedContractTile()}
        {this.getSegmentTiles()}
      </Grid>
    )
  }
}
