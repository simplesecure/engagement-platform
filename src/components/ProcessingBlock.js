import React, { setGlobal } from "reactn"
import {
  Label
} from 'semantic-ui-react'
const colors = [
  'red',
  'orange',
  'yellow',
  'olive',
  'green',
  'teal',
  'blue',
  'violet',
  'purple',
  'pink',
  'brown',
  'grey',
  'black',
]
const getRandomColor = () => {
  return colors[Math.floor(Math.random() * colors.length)];
}
export default class ProcessingBlock extends React.Component {
  render () {
    const { aBlockId, localBlockId, localBlockColor } = this.global
    if (aBlockId && localBlockId !== aBlockId) {
      const color = getRandomColor()
      setGlobal({localBlockId: aBlockId, localBlockColor: color})
      return (
        <Label
          size='big'
          color={color}
          as='a'
          href={"https://etherscan.io/block/" + aBlockId}
          target="_blank"
        >
          Block {aBlockId}
        </Label>
      )
    } else if (aBlockId) {
      return (
        <Label
          size='big'
          color={localBlockColor}
          as='a'
          href={"https://etherscan.io/block/" + aBlockId}
          target="_blank"
        >
          Block {aBlockId}
        </Label>
      )
    } else {
      return null
    }
  }
}
