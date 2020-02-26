import React from 'reactn';
import { Link } from 'react-router-dom';

export default class SideNav extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      pathname: '/'
    }
  }

  componentDidMount() {
    const pathname = window.location.pathname;
    this.setState({ pathname });
  }
  render() {
    const { pathname } = this.state;
    const { currentAppId } = this.global;
    return(
      <aside className="main-sidebar col-12 col-md-3 col-lg-2 px-0">
        <div className="main-navbar">
          <nav className="navbar align-items-stretch navbar-light bg-white flex-md-nowrap border-bottom p-0">
            <Link className="navbar-brand w-100 mr-0" to="#" style={{lineHeight: "25px"}}>
              <div className="d-table m-auto">
                <img id="main-logo" className="d-inline-block align-top mr-1" style={{maxWidth: "25px"}} src={require('../assets/img/logo.png')} alt="SimpleID Dashboard" /> <br/>
                <span className="beta-text">BETA</span>                
              </div>
            </Link>
            <button className="a-el-fix toggle-sidebar d-sm-inline d-md-none d-lg-none">
              <i className="material-icons">&#xE5C4;</i>
            </button>
          </nav>
        </div>
        <form action="#" className="main-sidebar__search w-100 border-right d-sm-flex d-md-none d-lg-none">
          <div className="input-group input-group-seamless ml-3">
            <div className="input-group-prepend">
              <div className="input-group-text">
                <i className="fas fa-search"></i>
              </div>
            </div>
            <input className="navbar-search form-control" type="text" placeholder="Search for something..." aria-label="Search" /> </div>
        </form>
        <div className="nav-wrapper">
          <ul className="nav flex-column">
            <li className="nav-item">
              <Link onClick={() => this.setState({ pathname: '/' })} className={`nav-link ${pathname ==='/' && currentAppId !== undefined ? "active" : ""}`} to="/">                
                <i className="material-icons">equalizer</i>
                <span>Dashboard</span>
              </Link>
            </li>
            {/*<li className="nav-item">
              <Link onClick={() => this.setState({ pathname: '/new-tile' })} className={`nav-link ${pathname.includes('/new-tile') && currentAppId !== undefined ? "active" : ""}`} to="/new-tile">
                <i className="material-icons">note_add</i>
                <span>Customize</span>
              </Link>
            </li>*/}
            <li className="nav-item">
              <Link onClick={() => this.setState({ pathname: '/segments' })} className={`nav-link ${pathname.includes('/segments') && currentAppId !== undefined ? "active" : ""}`} to="/segments">
                <i className="material-icons">view_module</i>
                <span>Segments</span>
              </Link>
            </li>
            <li className="nav-item">
              <Link onClick={() => this.setState({ pathname: '/notifications' })} className={`nav-link ${pathname.includes('/notifications') && currentAppId !== undefined ? "active" : ""}`} to="/notifications">
                <i className="material-icons">notifications</i>
                <span>Notifications</span>
              </Link>
            </li>
            <li className="nav-item">
              <Link onClick={() => this.setState({ pathname: '/communications' })} className={`nav-link ${pathname.includes('/communications') && currentAppId !== undefined ? "active" : ""}`} to="/communications">
                <i className="material-icons">email</i>
                <span>Email</span>
              </Link>
            </li>
            {/* <li className="nav-item">
              <Link onClick={() => this.setState({ pathname: '/support' })} className={`nav-link ${pathname.includes('/support') && currentAppId !== undefined ? "active" : ""}`} to="/support">
                <i className="material-icons">help_outline</i>
                <span>Support</span>
              </Link>
            </li> */}
            <li className="nav-item">
              <Link onClick={() => this.setState({ pathname: '/projects' })} className={`nav-link ${pathname.includes('/projects') && currentAppId !== undefined ? "active" : ""}`} to="/projects">
                <i className="material-icons">web</i>
                <span>Projects</span>
              </Link>
            </li>
            {/*<li className="nav-item">
              <Link className={`nav-link ${pathname.includes('/notifications') ? "active" : ""}`} to="/notifications">
                <i className="material-icons">notifications</i>
                <span>Notifications</span>
              </Link>
            </li>*/}
            <li className="nav-item">
              <Link onClick={() => this.setState({ pathname: '/account' })} className={`nav-link ${pathname.includes('/account') && currentAppId !== undefined ? "active" : ""}`} to="/account">
                <i className="material-icons">person</i>
                <span>Account</span>
              </Link>
            </li>
          </ul>
        </div>
      </aside>
    )
  }
}