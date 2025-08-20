import { createFileRoute } from '@tanstack/react-router'

import { Button } from '@renderer/components/ui/button'

export const Route = createFileRoute('/import')({
  component: ImportComponent
})

function ImportComponent(): React.JSX.Element {
  return <Button>Import BUTTON</Button>
}
