import Footer from "@/components/Footer"
import SideBar from "@/components/SideBar"
import CallForAchievementsView from "@/views/CallForAchievementsView"
import ContentView from "@/views/ContentView"

export default function Home() {
  return (
    <>
      <div className="flex h-screen bg-slate-100 text-slate-800 font-serif">
        <SideBar />

        <main className="w-full flex-1 overflow-auto relative flex flex-col">
          {/* Subtle grid background with faint blue lines */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: `
                 linear-gradient(rgba(30, 58, 138, 0.05) 1px, transparent 1px),
                 linear-gradient(90deg, rgba(30, 58, 138, 0.05) 1px, transparent 1px)
               `,
              backgroundSize: "20px 20px",
              zIndex: -1,
            }}
          ></div>

          <div className="flex-1">
            <ContentView>
              <CallForAchievementsView />
            </ContentView>
          </div>

          <Footer />
        </main>
      </div>
    </>
  )
}
