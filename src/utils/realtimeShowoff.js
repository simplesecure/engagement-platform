import React from "reactn"
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

export const getBlockLabel = (block) => {
  if (!block) {
    return null
  }
  else {
    let color = getRandomColor()
    return (
      <Label
        size='big'
        color={color}
        as='a'
        href={"https://etherscan.io/block/" + block}
        target="_blank"
      >
        Block {block}
      </Label>
    )
  }
}
