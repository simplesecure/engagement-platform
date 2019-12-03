import React from 'reactn';

export default class Auth extends React.Component {
  handleSignIn = async (e) => {
    const { simple, signedIn } = this.global;
    e.preventDefault();
    simple.signUserIn();
  
    //this.checkForAuth();
  }

  checkForAuth = () => {
    const { simple, signedIn } = this.global;
    console.log("CHECKING AUTH: ", simple.getUserData());
    if(!simple.getUserData() && !signedIn) {
      this.checkForAuth();
    }
  }

  render() {
    return(
      <div className="sign-in min-vh-100 bg-light d-flex flex-column justify-content-md-center">
        <section className="py-3">
          <div className="container">
            <div className="row justify-content-center">
              <div className="col-xl-4 col-lg-5 col-md-6">
                <div className="card card-body shadow">
                  <h1 className="h5 text-center">Sign In to Access Your SimpleID Dashboard</h1>
                  <form onSubmit={this.handleSignIn}>
                    <button className="btn btn-primary btn-block" type="submit">Let's Go</button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    )
  }
}