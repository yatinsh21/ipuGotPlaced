import { Star } from "lucide-react";

export default function TopBanner() {
  return (
    <div className="w-full text-gray-800 font-mono text-sm sm:text-base px-3 py-2 rounded-md shadow-sm bg-gray-100 flex items-center">
      <p className="text-xs sm:text-sm font-medium flex items-center leading-relaxed">
        <Star className="hidden lg:block w-4 h-4 mr-2 text-yellow-500" />

        The following are specially curated interview questions, not standard ones commonly available on the internet.
      </p>
    </div>
  );
}
