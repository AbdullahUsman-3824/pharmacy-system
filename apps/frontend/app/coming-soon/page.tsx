// app/coming-soon/page.tsx
import Link from "next/link";
import { ArrowLeft, ConstructionIcon } from "lucide-react";

export default function ComingSoonPage() {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-6">
      <div className="flex flex-col items-center max-w-2xl w-full bg-white/80 backdrop-blur-sm rounded-3xl p-8 md:p-12 shadow-xl border border-gray-100/50 text-center">
        {/* Back button */}
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>

        {/* Icon */}
        <div className="inline-flex items-center gap-3 bg-blue-50 px-5 py-3 rounded-full text-blue-600 mb-6 w-fit mx-auto">
          <ConstructionIcon className="w-6 h-6" />
          <span className="font-semibold text-sm tracking-wide">
            UNDER CONSTRUCTION
          </span>
        </div>

        {/* Title */}
        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-700 to-indigo-500 bg-clip-text text-transparent mb-3">
          Coming Soon
        </h1>

        {/* Description */}
        <p className="text-gray-600 text-lg md:text-xl max-w-md mx-auto mb-8">
          This page is in development. We&apos;re working hard to bring you
          something awesome.
        </p>
      </div>
    </div>
  );
}
