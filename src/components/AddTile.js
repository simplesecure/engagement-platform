import React, { setGlobal } from 'reactn';
import StickyNav from './StickyNav';
import uuid from 'uuid/v4'
import { setLocalStorage } from '../utils/misc';
import { putInOrganizationDataTable, getFromOrganizationDataTable } from '../utils/awsUtils';

export default class AddTile extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      tileName: "",
      selectedSegment: "Choose..."
    }
  }

  addTile = async () => {
    const { sessionData, SESSION_FROM_LOCAL, org_id, apps } = this.global;
    const { tileName, selectedSegment } = this.state;
    const { currentTiles, currentSegments } = sessionData;
    const tiles = currentTiles ? currentTiles : [];
    const thisSegment = currentSegments.filter(a => a.id === selectedSegment)[0]
    const userCount = thisSegment.userCount
    const newTile = {
      id: uuid(),
      name: tileName,
      segment: selectedSegment,
      userCount
    }
    tiles.push(newTile);
    sessionData.currentTiles = tiles;
    const thisApp = apps[sessionData.id];
    thisApp.currentTiles = tiles;

    setGlobal({ sessionData, apps });
    //Now we update the DB
    // Put the new segment in the analytics data for the user signed in to this
    // id:
    //      Each App (SimpleID Customer) will have an app_id
    //      Each App can have multiple Customer Users (e.g. Cody at Lens and one of his Minions)
    //      A segment will be stored in the DB under the primary key 'app_id' in
    //      the appropriate user_id's segment storage:
    //

    //
    // TODO: probably want to wait on this to finish and throw a status/activity
    //       bar in the app:

    const orgData = await getFromOrganizationDataTable(org_id);
    const anObject = orgData.Item
    try {
      anObject.apps = apps;
      anObject[process.env.REACT_APP_ORG_TABLE_PK] = org_id
      await putInOrganizationDataTable(anObject)
      setLocalStorage(SESSION_FROM_LOCAL, JSON.stringify(sessionData));
    } catch (suppressedError) {
      console.log(`ERROR: problem writing to DB.\n${suppressedError}`)
    }

    sessionData.currentTiles = tiles;
    this.setState({ tileName: "", selectedSegment: "Choose..." });
    setLocalStorage(SESSION_FROM_LOCAL, JSON.stringify(sessionData));
  }

  deleteTile = async (name) => {
    const { sessionData, SESSION_FROM_LOCAL, org_id, apps } = this.global;
    const { currentTiles } = sessionData;
    const index = currentTiles.map(a => a.name).indexOf(name);
    if(index > -1) {
      currentTiles.splice(index, 1);
      const thisApp = apps[sessionData.id]
      thisApp.currentTiles = currentTiles;
      setGlobal({ sessionData, apps });
      //Update in DB
      const orgData = await getFromOrganizationDataTable(org_id);

      try {
        const anObject = orgData.Item
        anObject.apps = apps;
        anObject[process.env.REACT_APP_ORG_TABLE_PK] = org_id
        await putInOrganizationDataTable(anObject)
        setLocalStorage(SESSION_FROM_LOCAL, JSON.stringify(sessionData));
      } catch (suppressedError) {
        console.log(`ERROR: problem writing to DB.\n${suppressedError}`)
      }

    } else {
      console.log("Error with index")
    }
  }

  render() {
    const { sessionData } = this.global;
    const { selectedSegment, tileName } = this.state;
    const { currentTiles, currentSegments } = sessionData;
    const segments = currentSegments ? currentSegments : [];

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
                currentTiles && currentTiles.length > 0 ?
                <ul className="tile-list">
                {
                  currentTiles.map(tile => {
                    return (
                      <li className="card" key={tile.name}><span className="card-body standard-tile">{tile.name}</span><span onClick={() => this.deleteTile(tile.name)} className="right clickable text-danger">Remove</span></li>
                    )
                  })
                }
              </ul> :
              <ul className="tile-list">
                <li className="card"><span className="card-body">No tiles selected yet. Add a new custom tile that you can display on your dashboard.</span></li>
              </ul>
              }
            </div>

            <div className="col-lg-6 col-md-6 col-sm-12 mb-4">
              <div>
                <h5>Add a Custom Data Tile</h5>
                <div className="form-group col-md-12">
                  <label htmlFor="inputSeg">First, Choose a Segment</label>
                  <select value={selectedSegment} onChange={(e) => this.setState({ selectedSegment: e.target.value })} id="inputSeg" className="form-control">
                    <option value="Choose...">Choose...</option>
                    {
                      segments.map(seg => {
                        return (
                        <option value={seg.id} key={seg.id}>{seg.name}</option>
                        )
                      })
                    }
                  </select>
                </div>
                {/* TODO: advance feature: custom charts <div className="form-group col-md-12">
                  <label htmlFor="chartSty">Next, Choose Chart Style</label>
                  <select id="chartSty" className="form-control">
                    <option selected>Choose...</option>
                    <option>Number</option>
                    <option>Bar</option>
                    <option>Line</option>
                    <option>Pie</option>
                    <option>Donut</option>
                  </select>
                </div>*/}
                <div className="form-group col-md-12">
                  <label htmlFor="tileName">Then, Give It A Name</label>
                  <input value={tileName} onChange={(e) => this.setState({ tileName: e.target.value })} type="text" className="form-control" id="tileName" placeholder="Give it a name" />
                </div>
                <div className="form-group col-md-12">
                  <label htmlFor="chartSty">Finally, Add The Tile</label><br/>
                  <button onClick={this.addTile} className="btn btn-primary">Add Tile</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

    )
  }
}
