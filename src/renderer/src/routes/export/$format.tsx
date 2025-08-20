import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/export/$format')({
  component: ExportComponent
})

function ExportComponent(): React.JSX.Element {
  // Get format from tanstack router
  const { format } = Route.useParams()
  return (
    <div>
      Export as: <strong>{format}</strong>
    </div>
  )
}
