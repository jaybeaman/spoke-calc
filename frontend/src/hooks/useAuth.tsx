import { useUser, useClerk, useAuth as useClerkAuth } from '@clerk/clerk-react'

export interface User {
  id: string
  email: string
  name: string
  is_admin: boolean
}

export function useAuth() {
  const { user, isLoaded } = useUser()
  const { signOut } = useClerk()
  const { getToken } = useClerkAuth()

  const mappedUser: User | null = user ? {
    id: user.id,
    email: user.primaryEmailAddress?.emailAddress || '',
    name: user.fullName || user.firstName || 'User',
    is_admin: user.publicMetadata?.is_admin === true,
  } : null

  return {
    user: mappedUser,
    isLoading: !isLoaded,
    isSignedIn: !!user,
    logout: () => signOut(),
    getToken,
  }
}
