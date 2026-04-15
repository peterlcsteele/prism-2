import { createRootRoute, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'

// Fix for module initialization order
import { useStore } from '@renderer/hooks/useStore'
import { LoadingOverlay } from '@renderer/components/loading-overlay'

const RootComponent = (): React.JSX.Element => {
  // Note: Initialize store here, even if not using it (i.e. useStore())
  const isBusy = useStore((state) => state.app.isBusy)

  console.log('busy: ' + isBusy)

  // Render
  return (
    <>
      {/* Render loading overlay */}
      {isBusy && <LoadingOverlay />}

      <Outlet />

      {/* Tan stack dev tools */}
      <TanStackRouterDevtools />
    </>
  )
}

export const Route = createRootRoute({
  component: RootComponent
})
