import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/about')({
  component: AboutComponent
})

function AboutComponent(): React.JSX.Element {
  return <div>About</div>
}
