import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center p-8 max-w-md">
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-amber-500 to-pink-500 bg-clip-text text-transparent">
          Cocktail Not Found
        </h1>
        <p className="text-gray-400 mb-8">
          Sorry, we couldn't find the cocktail you're looking for. It might have
          been removed or doesn't exist.
        </p>
        <Link
          href="/"
          className="inline-flex items-center px-6 py-3 rounded-full bg-gradient-to-r from-amber-500 to-pink-500 text-white hover:from-amber-600 hover:to-pink-600 transition-all"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Link>
      </div>
    </div>
  );
}
