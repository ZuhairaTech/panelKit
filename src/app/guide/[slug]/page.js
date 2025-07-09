// app/guide/[slug]/page.js
export default function GuidePage({ params }) {
  const { slug } = params

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold capitalize">{slug} API Guide</h1>
      <p>This is where you write instructions for how this API panel works.</p>
    </div>
  )
}
