// app/guide/page.js
import Link from 'next/link'

const guides = [
  { slug: 'github', title: 'GitHub API Guide' },
  { slug: 'weather', title: 'Weather API Guide' },
  { slug: 'crypto', title: 'Crypto API Guide' },
]

export default function GuideHome() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">📖 API Guides</h1>
      <ul className="list-disc ml-6">
        {guides.map(g => (
          <li key={g.slug}>
            <Link href={`/guide/${g.slug}`} className="text-blue-600 hover:underline">
              {g.title}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
