import { createFileRoute, useNavigate } from '@tanstack/react-router'

// Components
import { Button, Group, Title } from '@mantine/core'

// Icons
import { FaFileImport } from 'react-icons/fa'
import { MdClose } from 'react-icons/md'

// Route
export const Route = createFileRoute('/import')({
  component: ImportComponent
})

function ImportComponent(): React.JSX.Element {
  // Hooks
  const navigate = useNavigate()

  // Render
  return (
    <>
      <Title order={1}>Import options</Title>
      <Group>
        <Button leftSection={<FaFileImport />} onClick={() => console.log('Import')}>
          Import
        </Button>
        <Button variant="subtle" onClick={() => navigate({ to: '/', replace: true })}>
          <MdClose color="white" size="20" />
        </Button>
      </Group>
    </>
  )
}
