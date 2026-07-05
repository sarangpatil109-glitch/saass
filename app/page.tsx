import Link from 'next/link';

export default function RootPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-extrabold tracking-tight text-white mb-4">
            Welcome to <span className="text-blue-500">SAASS</span>
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Please select your portal to continue. Secure access to your dedicated workspace.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
          {/* Vendor Portal Card */}
          <Link href="/vendor/login" className="group">
            <div className="h-full bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-8 hover:bg-white/10 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/20">
              <div className="bg-blue-500/20 w-16 h-16 rounded-xl flex items-center justify-center mb-6 text-blue-400 group-hover:scale-110 transition-transform duration-300">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                  <polyline points="9 22 9 12 15 12 15 22"></polyline>
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-white mb-3">Vendor Portal</h2>
              <p className="text-gray-400 leading-relaxed">
                Log in to manage your products, track sales, and oversee operations. Only authorized vendors can access this portal.
              </p>
            </div>
          </Link>

          {/* Sales Executive Portal Card */}
          <Link href="/sales/login" className="group">
            <div className="h-full bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-8 hover:bg-white/10 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/20">
              <div className="bg-purple-500/20 w-16 h-16 rounded-xl flex items-center justify-center mb-6 text-purple-400 group-hover:scale-110 transition-transform duration-300">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <polyline points="16 11 18 13 22 9"></polyline>
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-white mb-3">Sales Executive Portal</h2>
              <p className="text-gray-400 leading-relaxed">
                Log in or register to track commissions, manage leads, and interact with customers in your designated territory.
              </p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
