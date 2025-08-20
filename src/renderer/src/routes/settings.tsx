import { Button } from '@renderer/components/ui/button'
import { createFileRoute, useNavigate } from '@tanstack/react-router'

export const Route = createFileRoute('/settings')({
  component: SettingsComponent
})

function SettingsComponent(): React.JSX.Element {
  const navigate = useNavigate()
  return (
    <div>
      Settings
      <Button onClick={() => navigate({ to: '/', replace: true })}>Close</Button>
    </div>
  )
}
