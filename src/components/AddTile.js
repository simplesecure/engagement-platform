import React, { setGlobal } from 'reactn';
import StickyNav from './StickyNav';

export default class AddTile extends React.Component {

  deleteStandardTile = (name) => {
    const { currentTiles } = this.global;
    const index = currentTiles.map(a => a.name).indexOf(name);
    if(index > -1) {
      currentTiles.splice(index, 1);
      setGlobal({ currentTiles });
    } else {
      console.log("Error with index")
    }
  }

  deleteCustomTile = (name) => {
    const { customTiles, standardTiles } = this.global;
    const index = customTiles.map(a => a.name).indexOf(name);
    if(index > -1) {
      const thisTile = customTiles[index];
      standardTiles.push(thisTile);
      customTiles.splice(index, 1);
      setGlobal({ customTiles, standardTiles });
    } else {
      console.log("Error with index")
    }
  }

  addStadardTile = (name) => {
    const { currentTiles } = this.global;
    const newTile = {
      name
    }
    currentTiles.push(newTile);
    setGlobal({ currentTiles });
  }
  render() {
    const { currentTiles, customTiles, standardTiles, currentSegments } = this.global;

    const nonJsonAvailableTiles = standardTiles.map(a => a.name)
    const nonJsonCurrentTiles = currentTiles.map(a => a.name);
    const availableTiles = nonJsonAvailableTiles.filter(function(obj) { return nonJsonCurrentTiles.indexOf(obj) == -1; });
    const totalTiles = currentTiles.concat(customTiles);
    return(
      <main className="main-content col-lg-10 col-md-9 col-sm-12 p-0 offset-lg-2 offset-md-3">
        <StickyNav />

        <div className="main-content-container container-fluid px-4">
          <div className="page-header row no-gutters py-4">
            <div className="col-12 col-sm-4 text-center text-sm-left mb-0">
              <span className="text-uppercase page-subtitle">Add Tile</span>
              <h3 className="page-title">Choose What Data To Display</h3>
            </div>
          </div>
          <div className="row">
            <div className="col-lg-6 col-md-6 col-sm-12 mb-4">
              <h5>Current Tiles</h5>
              {
                totalTiles.length > 0 ?
                <ul className="tile-list">
                {
                  currentTiles.map(tile => {
                    return (
                      <li className="card" key={tile.name}><span className="card-body standard-tile">{tile.name}</span><span onClick={() => this.deleteStandardTile(tile.name)} className="right clickable text-danger">Remove</span></li>
                    )
                  })                  
                }
                {
                  customTiles.map(customTile => {
                    return (
                      <li className="card" key={customTile.name}><span className="card-body custom-tile">{customTile.name}</span><span onClick={() => this.deleteCustomTile(customTile.name)} className="right clickable text-danger">Remove</span></li>
                    )
                  })  
                }
              </ul> : 
              <ul className="tile-list">
                <li className="card"><span className="card-body">No tiles selected yet. Pick a standard tile or create a custom one.</span></li>
              </ul>
              }
            </div>

            <div className="col-lg-6 col-md-6 col-sm-12 mb-4">
              <h5>Add New Tiles</h5>
              <ul className="tile-list">
                {
                  availableTiles.length > 0 ? 
                  availableTiles.map(aTile => {
                    return (
                      <li onClick={() => this.addStadardTile(aTile)} className="card clickable" key={aTile}><span className="card-body">{aTile}</span></li>
                    )
                  }) : 
                  <li className="card clickable"><span className="card-body text-muted">You have selected all the standard tiles, try creating a custom one.</span></li>
                }
              </ul>
              <div>
                <h5>Create a Custom Tile</h5>
                <div class="form-group col-md-12">
                  <label htmlFor="inputSeg">First, Choose a Segment</label>
                  <select id="inputSeg" class="form-control">
                    <option selected>Choose...</option>
                    {
                      currentSegments.map(seg => {
                        return (
                        <option key={seg.id}>{seg.name}</option>
                        )
                      })
                    }
                  </select>
                </div>
                <div class="form-group col-md-12">
                  <label htmlFor="chartSty">Next, Choose Chart Style</label>
                  <select id="chartSty" class="form-control">
                    <option selected>Choose...</option>
                    <option>Number</option>
                    <option>Bar</option>
                    <option>Line</option>
                    <option>Pie</option>
                    <option>Donut</option>
                  </select>
                </div>
                <div class="form-group col-md-12">
                  <label htmlFor="tileName">Then, Give It A Name</label>
                  <input type="text" class="form-control" id="tileName" placeholder="Give it a name" />
                </div>
                <div class="form-group col-md-12">
                  <label htmlFor="chartSty">Finally, Add The Tile</label><br/>
                  <button className="btn btn-primary">Add Tile</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
   
    )
  }
}