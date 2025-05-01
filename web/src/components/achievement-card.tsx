import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Achievement } from "@/awesome/awesome"

export default function AchievementCard({ achievement }: { achievement: Achievement }) {
  return (
    <Card className="py-2 gap-2">
      <CardHeader>
        <CardTitle className="text-sm">Achievement ({achievement.signature.slice(0, 20)}...)</CardTitle>
        <CardDescription>
          from {achievement.authorName} ({achievement.authorAddress.slice(0, 12)}...)
        </CardDescription>
      </CardHeader>
      <CardContent>{achievement.description}</CardContent>
    </Card>
  )
}
