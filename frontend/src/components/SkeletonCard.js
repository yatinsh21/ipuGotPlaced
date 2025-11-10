export const SkeletonCard = () => (
  <div className="animate-pulse bg-white rounded-lg border border-gray-200 p-4 space-y-2">
    <div className="h-3 w-1/2 bg-gray-200 rounded"></div>
    <div className="h-2.5 w-1/3 bg-gray-200 rounded"></div>
    <div className="h-2.5 w-1/2 bg-gray-200 rounded"></div>
    <div className="pt-2 border-t mt-2 space-y-2">
      <div className="h-2.5 w-2/3 bg-gray-200 rounded"></div>
      <div className="h-2.5 w-1/2 bg-gray-200 rounded"></div>
      <div className="h-6 w-full bg-gray-200 rounded"></div>
    </div>
  </div>
);
