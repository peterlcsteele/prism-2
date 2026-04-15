import React from 'react'
import { Center, Loader, Overlay } from '@mantine/core'

export const LoadingOverlay = (): React.JSX.Element => {
  return (
    <Overlay backgroundOpacity={0.2}>
      <Center h={'100%'}>
        <Loader />
      </Center>
    </Overlay>
  )
}
