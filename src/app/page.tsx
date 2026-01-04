import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-10 rounded shadow-md w-full max-w-md text-center">
        <h1 className="text-3xl text-black font-bold mb-2">IdenVault</h1>
        <p className="text-gray-600 mb-8">
          Digital Academic Identity Wallet
        </p>

        <div className="space-y-4">
          <Link
            href="/connect?role=student"
            className="block w-full px-4 py-3 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            I am a Student
          </Link>

          <Link
            href="/connect?role=issuer"
            className="block w-full px-4 py-3 bg-green-600 text-white rounded hover:bg-green-700"
          >
            I am an Issuer
          </Link>

          <Link
            href="/verify"
            className="block w-full px-4 py-3 bg-gray-800 text-white rounded hover:bg-gray-900"
          >
            Verify a Credential
          </Link>
        </div>
      </div>
    </main>
  );
}
