import React from "reactn"
import Iframe from 'react-iframe'

export default class BlockDiagramHTMLComponent extends React.Component {
  render() {
    return (
      <Iframe url="./BlockDiagramFolder/index.html"
        width="100%"
        height="660px"
        id="myId"
        className="myClassname"
        display="initial"
        position="relative"/>
    )
  }
}
