import Link from "next/link"

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
      <div className="max-w-md w-full space-y-8 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900">MindToosa</h1>
        <p className="text-gray-600">
          Planning + execution for focus.
        </p>

        <div className="flex flex-col gap-4">
          <Link href="/today" className="bg-black text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-800 transition">
            Go to Today
          </Link>
          <Link href="/api/auth/signin" className="text-sm text-gray-500 hover:underline">
            Sign In with Google
          </Link>
        </div>
      </div>
    </div>
  )
}
