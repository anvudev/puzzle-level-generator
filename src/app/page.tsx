import { PuzzleLevelGenerator } from "@/components/puzzle-level-generator";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50">
      <main className="container mx-auto px-6 py-8">
        <PuzzleLevelGenerator />
      </main>
    </div>
  );
}
