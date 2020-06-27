import React, { setGlobal } from "reactn";
import { Link } from "react-router-dom";
import { getCloudUser } from "./../utils/cloudUser.js";
import { getEmailData } from './../utils/emailData.js';
import { getWeb2Analytics } from './../utils/web2Analytics';
import {
  Header
} from 'semantic-ui-react'
const filter = require('../utils/filterOptions.json');

export default class StickyNav extends React.Component {

  startOnboarding = () => {
    setGlobal({ onboardingComplete: false })
  }

  setProject = async app => {
    const { apps } = this.global;

    await setGlobal({ sessionData: apps[app.id], currentAppId: app.id, allFilters: [] });
    getCloudUser().fetchUsersCount();
    //  Fetch web2 analytics eventNames - we will fetch the actual event results in Segment handling
    const web2AnalyticsCmdObj = {
      command: 'getWeb2Analytics',
          data: {
           appId: app.id
        }
    }

    const web2Analytics = await getWeb2Analytics(web2AnalyticsCmdObj);
    const { allFilters } = await this.global;
    if(web2Analytics.data) {
      const events = web2Analytics.data;

      for(const event of events) {
        const data = {
          type: 'web2',
          filter: `Web2: ${event}`
        }
        allFilters.push(data);
      }
      allFilters.push(...filter);
      setGlobal({ allFilters, web2Events: web2Analytics.data ? web2Analytics.data : [] });
    } else {
      console.log(allFilters);
      allFilters.push(...filter);
      console.log(filter);
      setGlobal({ allFilters })
    }

    const emailData = await getEmailData();

    setGlobal({ emailData: emailData.data });
  };

  render() {
    const {
      apps,
      sessionData,
    } = this.global;
    const appKeys = Object.keys(apps);
    let projects = [];
    if(appKeys.length > 0) {
      for (const appKey of appKeys) {
        const thisApp = apps[appKey];
        thisApp.id = appKey;
        projects.push(thisApp);
      }
    }
    return (
      <div className="main-navbar sticky-top bg-white">
        <nav className="navbar align-items-stretch navbar-light flex-md-nowrap p-0">
          <form
            action="#"
            className="main-navbar__search w-100 d-none d-md-flex d-lg-flex"
          >
            <div className="input-group input-group-seamless ml-3">
              <div className="input-group-prepend">
                <div className="input-group-text"></div>
              </div>
            </div>
          </form>
          <ul className="navbar-nav border-left flex-row ">
            {/*<li className="nav-item border-right dropdown walkthrough">
              <button className="a-el-fix nav-link nav-link-icon text-center">
                <div className="nav-link-icon__wrapper">
                  <Spinner name="line-scale" />
                </div>
              </button>
            </li>*/}
            <li className="nav-item border-right dropdown walkthrough">
              <button onClick={this.startOnboarding} className="a-el-fix nav-link nav-link-icon text-center">
                <div className="nav-link-icon__wrapper">
                  <i className="material-icons text-warning">new_releases</i>
                </div>
              </button>
            </li>
            {projects.length > 0 ? (
              <li className="nav-item dropdown border-right">
                <button
                  className="a-el-fix project-drop nav-link dropdown-toggle text-nowrap px-3"
                  data-toggle="dropdown"
                  aria-haspopup="true"
                  aria-expanded="false"
                >
                  <span className="d-md-inline-block">
                    <Header as='h4'>Current Project: {sessionData.project_name}</Header>
                  </span>
                </button>
                <div className="dropdown-menu dropdown-menu-small">
                  {Object.keys(apps).length > 1 ? (
                    <div>
                      {projects.map(app => {
                        return (
                          <button
                            key={app.id}
                            onClick={() => this.setProject(app)}
                            className="a-el-fix dropdown-item"
                          >
                            <i className="material-icons">web</i>{" "}
                            <Header as='h4'>{app.project_name}</Header>
                          </button>
                        );
                      })}
                      <div className="dropdown-divider"></div>
                      <Link to="/projects">
                        <button className="a-el-fix dropdown-item">
                          <Header as='h4'><i className="material-icons">web</i> Add or View Projects</Header>
                        </button>
                      </Link>
                    </div>
                  ) : (
                    <div>
                      <Link to="/projects">
                        <button className="a-el-fix dropdown-item">
                          <Header as='h4'><i className="material-icons">web</i> Add or View Projects</Header>
                        </button>
                      </Link>
                    </div>
                  )}
                </div>
              </li>
            ) : (
              <li className="nav-item dropdown border-right">
                <Link to="/projects">
                  <button
                    className="a-el-fix project-drop nav-link text-nowrap px-3"
                    aria-haspopup="true"
                    aria-expanded="false"
                  >
                    <span className="d-md-inline-block"><Header as='h4'>Create a Project</Header></span>
                  </button>
                </Link>
              </li>
            )}

            <li className="nav-item dropdown">
              <button
                className="a-el-fix project-drop nav-link dropdown-toggle text-nowrap px-3"
                data-toggle="dropdown"
                aria-haspopup="true"
                aria-expanded="false"
              >
                <span className="d-none d-md-inline-block">
                  <Header as='h4'>{/*<i className="material-icons">dehaze</i> */}Options</Header>
                </span>
              </button>
              <div className="dropdown-menu dropdown-menu-right dropdown-menu-small">
                {/*<Link to="/account"><button className="a-el-fix dropdown-item">
                  <Header as='h4'><i className="material-icons">&#xE7FD;</i> Account</Header></button>
                </Link>*/}
                <a href="mailto:support@simpleid.xyz">
                  <button className="a-el-fix dropdown-item">
                    <Header as='h4'><i className="material-icons">help</i>Help</Header>
                  </button>
                </a>
                <div className="dropdown-divider"></div>
                <button
                  onClick={() => getCloudUser().signOut()}
                  className="a-el-fix dropdown-item text-danger"
                >
                  <Header as='h4'><i className="material-icons text-danger">&#xE879;</i> Logout{" "}</Header>
                </button>
              </div>
            </li>
          </ul>
        </nav>
      </div>
    );
  }
}
