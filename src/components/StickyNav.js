import React from 'reactn';

export default class StickyNav extends React.Component {
  render() {
    const { simple } = this.global;
    return(
      <div className="main-navbar sticky-top bg-white">
        <nav className="navbar align-items-stretch navbar-light flex-md-nowrap p-0">
          <form action="#" className="main-navbar__search w-100 d-none d-md-flex d-lg-flex">
            <div className="input-group input-group-seamless ml-3">
              <div className="input-group-prepend">
                <div className="input-group-text">
                  <i className="fas fa-search"></i>
                </div>
              </div>
              <input className="navbar-search form-control" type="text" placeholder="Search for something..." aria-label="Search" /> </div>
          </form>
          <ul className="navbar-nav border-left flex-row ">
            <li className="nav-item border-right dropdown notifications">
              <a className="nav-link nav-link-icon text-center" href="#" role="button" id="dropdownMenuLink" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                <div className="nav-link-icon__wrapper">
                  <i className="material-icons">&#xE7F4;</i>
                  <span className="badge badge-pill badge-danger">2</span>
                </div>
              </a>
              <div className="dropdown-menu dropdown-menu-small" aria-labelledby="dropdownMenuLink">
                <a className="dropdown-item" href="#">
                  <div className="notification__icon-wrapper">
                    <div className="notification__icon">
                      <i className="material-icons">&#xE6E1;</i>
                    </div>
                  </div>
                  <div className="notification__content">
                    <span className="notification__category">Analytics</span>
                    <p>Your website’s active users count increased by
                      <span className="text-success text-semibold"> 12.4%</span> in the last week.</p>
                  </div>
                </a>
                <a className="dropdown-item" href="#">
                  <div className="notification__icon-wrapper">
                    <div className="notification__icon">
                      <i className="material-icons">email</i>
                    </div>
                  </div>
                  <div className="notification__content">
                    <span className="notification__category">Comms</span>
                    <p>Last week, you sent 
                      <span className="text-danger text-semibold"> 5.52%</span> fewer emails or notifications to your users.</p>
                  </div>
                </a>
                <a className="dropdown-item notification__all text-center" href="#"> View all Notifications </a>
              </div>
            </li>
            <li className="nav-item dropdown">
              <a className="nav-link dropdown-toggle text-nowrap px-3" data-toggle="dropdown" href="#" role="button" aria-haspopup="true" aria-expanded="false">
                <img className="user-avatar rounded-circle mr-2" src={require('../assets/img/female-2.jpg')} alt="User Avatar" />
                <span className="d-none d-md-inline-block">Sierra Brooks</span>
              </a>
              <div className="dropdown-menu dropdown-menu-small">
                <a className="dropdown-item" href="user-profile-lite.html">
                  <i className="material-icons">&#xE7FD;</i> Account</a>
                <div className="dropdown-divider"></div>
                <a onClick={() => simple.signOut()} className="dropdown-item text-danger" href="#">
                  <i className="material-icons text-danger">&#xE879;</i> Logout </a>
              </div>
            </li>
          </ul>
          <nav className="nav">
            <a href="#" className="nav-link nav-link-icon toggle-sidebar d-md-inline d-lg-none text-center border-left" data-toggle="collapse" data-target=".header-navbar" aria-expanded="false" aria-controls="header-navbar">
              <i className="material-icons">&#xE5D2;</i>
            </a>
          </nav>
        </nav>
      </div>
    )
  }
}