import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/shared/ui/card'
import { Link } from '@tanstack/react-router'
import { MessageSquareHeart } from 'lucide-react'

export interface CampaignImpactItem {
  time: string
  message: string
}

export default function CampaignImpactList({
  campaignId,
  items,
}: {
  campaignId: string
  items: CampaignImpactItem[]
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Campaign Impact</CardTitle>
        <Link
          to="/donor/campaigns/$campaignId"
          params={{ campaignId }}
          className="text-sm font-medium text-primary hover:underline"
        >
          See All
        </Link>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.map((item, index) => (
          <div
            key={index}
            className="flex items-start gap-4 p-3 rounded-lg bg-slate-50"
          >
            <div className="bg-slate-200 p-2 rounded-full">
              <MessageSquareHeart className="h-5 w-5 text-slate-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{item.message}</p>
              <p className="text-xs text-slate-500 mt-1">{item.time}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
