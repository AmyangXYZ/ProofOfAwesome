import Footer from "@/components/footer"
import CallForAchievementsView from "@/views/call-for-achievements"
import ContentView from "@/views/content"

export default function Home() {
  return (
    <>
      <ContentView>
        <CallForAchievementsView />
      </ContentView>

      <Footer />
    </>
  )
}
