import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-6">
      <h1 className="font-serif text-3xl mb-4">This balcony doesn't exist.</h1>
      <Link to="/" className="text-olive hover:underline">Back home</Link>
    </div>
  )
}
