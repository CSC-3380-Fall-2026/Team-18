function App() {
  return (
    <main className="min-h-screen bg-purple-900 flex flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-5xl font-bold text-yellow-400">ShopFlow</h1>
      <p className="text-lg text-white">
        Buy, sell, and trade on campus — built for LSU students.
      </p>
      <button
        disabled
        title="Listings on the way!"
        className="rounded-lg bg-yellow-400 px-6 py-3 font-semibold text-purple-900 opacity-50 cursor-not-allowed">
        Browse listings
      </button>
    </main>
  )
}

export default App
