import { Auth0Provider } from '@auth0/auth0-react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { RouterProvider } from '@tanstack/react-router'
import { isAuth0WebMode } from '@/auth/auth-mode'
import { router } from '@/router'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  },
})

function AppTree() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}

export function App() {
  if (!isAuth0WebMode()) {
    return <AppTree />
  }

  const domain = import.meta.env.VITE_AUTH0_DOMAIN
  const clientId = import.meta.env.VITE_AUTH0_CLIENT_ID
  const audience = import.meta.env.VITE_AUTH0_AUDIENCE

  if (!domain || !clientId || !audience) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-sm">
        <h1 className="text-xl font-semibold">Auth0 not configured</h1>
        <p className="mt-2 text-muted-foreground">
          Set <code>VITE_AUTH_MODE=auth0</code> plus{' '}
          <code>VITE_AUTH0_DOMAIN</code>, <code>VITE_AUTH0_CLIENT_ID</code>, and{' '}
          <code>VITE_AUTH0_AUDIENCE</code> in <code>apps/web/.env</code>. Or set{' '}
          <code>VITE_AUTH_MODE=stub</code> for local stub login.
        </p>
      </div>
    )
  }

  return (
    <Auth0Provider
      domain={domain}
      clientId={clientId}
      authorizationParams={{
        redirect_uri: `${window.location.origin}/auth/callback`,
        audience,
      }}
      cacheLocation="localstorage"
    >
      <AppTree />
    </Auth0Provider>
  )
}

export default App
