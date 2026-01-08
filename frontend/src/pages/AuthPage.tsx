import { SignIn, SignUp, useUser } from '@clerk/clerk-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useEffect, useState } from 'react'

export default function AuthPage() {
  const { isSignedIn, isLoaded } = useUser()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      navigate('/')
    }
  }, [isSignedIn, isLoaded, navigate])

  useEffect(() => {
    if (searchParams.get('mode') === 'signup') {
      setMode('signup')
    }
  }, [searchParams])

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-scenic-900"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-scenic-50 dark:bg-scenic-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <img src="/logo.png" alt="Scenic Routes" className="h-20 w-20" />
        </div>
        <h2 className="mt-4 text-center text-2xl font-bold text-scenic-900 dark:text-scenic-100">
          Spoke Calculator
        </h2>
        <p className="mt-1 text-center text-sm text-scenic-500 dark:text-scenic-400">
          Scenic Routes Community Bicycle Center
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md flex justify-center">
        {mode === 'signin' ? (
          <SignIn
            routing="path"
            path="/auth"
            signUpUrl="/auth?mode=signup"
            afterSignInUrl="/"
          />
        ) : (
          <SignUp
            routing="path"
            path="/auth"
            signInUrl="/auth"
            afterSignUpUrl="/"
          />
        )}
      </div>
    </div>
  )
}
