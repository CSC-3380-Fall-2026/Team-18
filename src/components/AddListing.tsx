// Author: Trevor Ceaser (form + fields)
// Styled with the ShopFlow design system and connected to Supabase by Calvin Akpunku
import { useMemo, useState } from 'react'
import type { SubmitEvent } from 'react'
import { supabase } from '../lib/supabase'
import { seasonalTags } from '../data/sampleListings'
import Panel from './ui/Panel'
import Button from './ui/Button'

const categories = ['Textbooks', 'Clothing & Merch', 'Electronics', 'Furniture', 'Dorm & Kitchen', 'Tickets', 'Other']
const conditions = ['New', 'Like New', 'Good', 'Fair']

// Shared look for every input so the form stays consistent
const fieldClass =
  'w-full rounded-xl border border-white/10 bg-bg/60 px-4 py-3 text-ink placeholder:text-muted focus:border-glow focus:outline-none focus:ring-2 focus:ring-glow/40'
const labelClass = 'mb-2 block font-display text-xs font-semibold uppercase tracking-[0.2em] text-muted'

type AddListingProps = {
  onPosted: () => void
}

function AddListing({ onPosted }: AddListingProps) {
  const [title, setTitle] = useState('')
  const [price, setPrice] = useState('')
  const [description, setDescription] = useState('')
  const [pickupLocation, setPickupLocation] = useState('')
  const [category, setCategory] = useState('')
  const [condition, setCondition] = useState('')
  const [seasonalTag, setSeasonalTag] = useState('')
  const [photo, setPhoto] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Turn the chosen file into a temporary URL so we can preview it
  const previewUrl = useMemo(() => (photo ? URL.createObjectURL(photo) : null), [photo])

  async function handleAddListing(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')

    if (Number(price) < 0) {
      setError('Price cannot be negative.')
      return
    }

    setSaving(true)
    // seller_id and status fill themselves in (seller_id defaults to the logged-in user)
    const { error: insertError } = await supabase.from('listings').insert({
      title: title.trim(),
      price: Number(price),
      category,
      condition,
      description: description.trim() || null,
      pickup_location: pickupLocation.trim(),
      seasonal_tag: seasonalTag || null,
    })
    setSaving(false)

    if (insertError) {
      setError(insertError.message)
      return
    }

    onPosted()
  }

  return (
    <main className="relative px-8 pt-6 pb-24">
      <Panel className="mx-auto max-w-3xl">
        <p className="font-display text-xs font-semibold uppercase tracking-[0.25em] text-glow">Sell</p>
        <h1 className="mt-2 font-display text-4xl font-bold">Create a listing</h1>
        <p className="mt-2 text-sm text-muted">Post something for other LSU students. Meet up on campus to trade.</p>

        <form onSubmit={handleAddListing} className="mt-8 grid gap-6 md:grid-cols-2">
          <div className="md:col-span-2">
            <label htmlFor="title" className={labelClass}>Item title</label>
            <input
              id="title"
              type="text"
              required
              value={title}
              placeholder="e.g. LSU Joe Burrow Jersey #9"
              onChange={(event) => setTitle(event.target.value)}
              className={fieldClass}
            />
          </div>

          <div>
            <label htmlFor="price" className={labelClass}>Price ($)</label>
            <input
              id="price"
              type="number"
              required
              min="0"
              step="0.01"
              value={price}
              placeholder="0"
              onChange={(event) => setPrice(event.target.value)}
              className={fieldClass}
            />
          </div>

          <div>
            <label htmlFor="pickuplocation" className={labelClass}>Pickup location</label>
            <input
              id="pickuplocation"
              type="text"
              required
              value={pickupLocation}
              placeholder="e.g. The Quad"
              onChange={(event) => setPickupLocation(event.target.value)}
              className={fieldClass}
            />
          </div>

          <div>
            <label htmlFor="category" className={labelClass}>Category</label>
            <select
              id="category"
              required
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className={fieldClass}
            >
              <option value="" disabled>Pick a category</option>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="condition" className={labelClass}>Condition</label>
            <select
              id="condition"
              required
              value={condition}
              onChange={(event) => setCondition(event.target.value)}
              className={fieldClass}
            >
              <option value="" disabled>Pick a condition</option>
              {conditions.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <p className={labelClass}>Seasonal tag (optional)</p>
            <div className="flex flex-wrap gap-3">
              {seasonalTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setSeasonalTag((current) => (current === tag ? '' : tag))}
                  className={`rounded-full border px-4 py-2 font-display text-xs font-semibold uppercase tracking-wider transition ${
                    seasonalTag === tag
                      ? 'border-glow bg-glow/15 text-ink shadow-[0_0_16px_rgb(56_214_255/0.45)]'
                      : 'border-white/15 text-muted hover:text-ink'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          <div className="md:col-span-2">
            <label htmlFor="description" className={labelClass}>Description</label>
            <textarea
              id="description"
              rows={4}
              value={description}
              placeholder="Size, edition, any wear, why you're selling..."
              onChange={(event) => setDescription(event.target.value)}
              className={fieldClass}
            />
          </div>

          <div className="md:col-span-2">
            <label htmlFor="photo" className={labelClass}>Photo</label>
            <label
              htmlFor="photo"
              className="flex cursor-pointer items-center gap-4 rounded-xl border border-dashed border-white/20 bg-bg/40 p-4 transition hover:border-glow"
            >
              {previewUrl ? (
                <img src={previewUrl} alt="Preview" className="h-20 w-20 rounded-lg object-cover" />
              ) : (
                <span className="flex h-20 w-20 items-center justify-center rounded-lg bg-surface text-2xl">📷</span>
              )}
              <span className="text-sm text-muted">
                {photo ? photo.name : 'Click to choose a photo'}
                <span className="block text-xs">Photo upload saves in the next update</span>
              </span>
            </label>
            <input
              id="photo"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => setPhoto(event.target.files?.[0] ?? null)}
            />
          </div>

          {error && <p className="text-sm text-red-400 md:col-span-2">{error}</p>}

          <div className="flex gap-4 md:col-span-2">
            <Button type="submit" disabled={saving}>
              {saving ? 'Posting...' : 'Post listing'}
            </Button>
          </div>
        </form>
      </Panel>
    </main>
  )
}

export default AddListing
