// app/page.js
import Link from 'next/link'

const apis = [
  { name: 'GitHub Stats', slug: 'github', desc: 'View GitHub user data', emoji: '💻' },
  { name: 'Weather', slug: 'weather', desc: 'Check weather by city', emoji: '🌦' },
  { name: 'Crypto Prices', slug: 'crypto', desc: 'Live coin market data', emoji: '📈' },
]

export default function Home() {
  return (
    <main className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">🌐 PanelKit: API Dashboard</h1>
      <div className="grid md:grid-cols-2 gap-4">
        {apis.map(api => (
          <Link key={api.slug} href={`/${api.slug}`} className="border p-4 rounded-xl hover:bg-gray-50 hover:text-gray-900 transition">
            <h2 className="text-xl font-semibold">{api.emoji} {api.name}</h2>
            <p className="text-sm text-gray-600">{api.desc}</p>
          </Link>
        ))}
      </div>
    </main>
  )
}


