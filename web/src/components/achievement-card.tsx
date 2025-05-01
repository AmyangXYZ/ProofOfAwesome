import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Achievement } from "@/awesome/awesome"

export default function AchievementCard({ achievement }: { achievement: Achievement }) {
  return (
    <Card className="py-4 gap-2 bg-zinc-700/50">
      <CardHeader>
        <CardTitle>Achievement - {achievement.signature.slice(0, 8)}...</CardTitle>
        <CardDescription>
          {achievement.authorName} - {achievement.authorAddress.slice(0, 8)}...
        </CardDescription>
      </CardHeader>
      <CardContent>{achievement.description}</CardContent>
    </Card>
  )
}
