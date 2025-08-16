'use client'

import dynamic from 'next/dynamic'

// Dynamically import the main App component to avoid SSR issues with wallet providers
const App = dynamic(() => import('../App'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-pulse">
        <h2 className="text-2xl font-semibold">Loading EchoBox...</h2>
      </div>
    </div>
  ),
})

export default function Home() {
  return <App />
}
