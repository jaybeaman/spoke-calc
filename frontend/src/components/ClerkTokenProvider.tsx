import { useEffect, ReactNode } from 'react'
import { useAuth } from '@clerk/clerk-react'
import { setTokenGetter } from '../api/client'

export default function ClerkTokenProvider({ children }: { children: ReactNode }) {
  const { getToken } = useAuth()

  useEffect(() => {
    setTokenGetter(getToken)
  }, [getToken])

  return <>{children}</>
}
