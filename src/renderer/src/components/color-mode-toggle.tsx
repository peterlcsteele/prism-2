// Mantine
import { Center, SegmentedControl, MantineColorScheme } from '@mantine/core'
// Icons
import { MdWbSunny, MdNightlightRound, MdComputer } from 'react-icons/md'

const data = [
  {
    value: 'light',
    label: (
      <Center style={{ gap: 8 }}>
        <MdWbSunny />
      </Center>
    )
  },
  {
    value: 'dark',
    label: (
      <Center style={{ gap: 8 }}>
        <MdNightlightRound />
      </Center>
    )
  },
  {
    value: 'system',
    label: (
      <Center style={{ gap: 8 }}>
        <MdComputer />
      </Center>
    )
  }
]

interface ColorModeToggleType {
  colorMode: 'light' | 'dark' | 'system'
  onChange: (colorMode: MantineColorScheme) => void
}

export function ColorModeToggle({
  colorMode,
  onChange = () => {}
}: ColorModeToggleType): React.JSX.Element {
  return (
    <SegmentedControl
      data={data}
      size="lg"
      value={colorMode}
      onChange={(newTheme) => onChange(newTheme as MantineColorScheme)}
    />
  )
}
