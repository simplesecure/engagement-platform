import React from 'reactn';

export default class SignIn extends React.Component {
  handleSignIn = async (e) => {
    const { simple } = this.global;
    e.preventDefault();
    simple.signUserIn();
  }

  render() {
    return(
      <div className="sign-in min-vh-100 bg-light d-flex flex-column justify-content-md-center">
        <section className="py-3">
          <div className="container">
            <div className="row justify-content-center">
              <div className="col-xl-4 col-lg-5 col-md-6">
                <div className="card card-body shadow">
                  <img className="logo" src={require('../assets/img/logo.png')} alt="simple id" />
                  <h1 className="h5 text-center">Access Your SimpleID Account</h1>
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
