import { Skeleton } from "@/components/ui/skeleton"

export default function ConversasLoading() {
  return (
    <div className="space-y-3 p-4">
      <Skeleton className="h-8 w-40" />
      <Skeleton className="h-9 w-full" />
      <Skeleton className="h-9 w-full" />
      <div className="divide-y">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-start gap-3 py-4">
            <Skeleton className="h-10 w-10 rounded-full shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="flex justify-between">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-12" />
              </div>
              <Skeleton className="h-3 w-48" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
