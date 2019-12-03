import React from 'reactn';
import 'bootstrap/dist/css/bootstrap.min.css';
import './assets/css/theme.css';
import './assets/css/shards.min.css';
import './assets/css/style.css';
import Home from './containers/Home';

export default class App extends React.Component {
  
  render() {
    return (
      <Home />
    )
  }
}
