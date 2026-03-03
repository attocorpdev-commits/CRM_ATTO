import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { LucideIcon } from "lucide-react"

interface MetricsCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: LucideIcon
  trend?: {
    value: number
    label: string
  }
  className?: string
}

export function MetricsCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  className,
}: MetricsCardProps) {
  return (
    <Card className={cn("", className)}>
      <CardContent className="pt-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
            {trend && (
              <div className={cn(
                "flex items-center gap-1 text-xs font-medium",
                trend.value >= 0 ? "text-green-600" : "text-destructive"
              )}>
                <span>{trend.value >= 0 ? "↑" : "↓"}</span>
                <span>
                  {Math.abs(trend.value)}% {trend.label}
                </span>
              </div>
            )}
          </div>
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
