import Header from "@/components/Header";
import { Lightbulb, Plus, Calendar } from "lucide-react";

export default function LessonsPage() {
  return (
    <>
      <Header title="Lesson Planner" subtitle="Plan and organize your training sessions" />
      
      <div className="p-6 space-y-6">
        <div className="bg-white rounded-xl border border-background-border p-8 text-center">
          <Lightbulb className="w-16 h-16 text-primary mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-text mb-2">Lesson Planning Assistant</h3>
          <p className="text-text-light mb-6">Create structured lesson plans for your training sessions</p>
          <button className="px-6 py-3 bg-primary hover:bg-primary-light text-white rounded-lg font-medium transition-colors inline-flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Create New Lesson Plan
          </button>
        </div>

        <div className="bg-white rounded-xl border border-background-border p-6">
          <h3 className="font-semibold text-text mb-4">Upcoming Lessons</h3>
          <div className="space-y-3">
            {[
              { title: "Module 3: Market Requirements", site: "Kelpack Manufacturing", date: "Feb 5, 2026", time: "09:00 - 14:00" },
              { title: "Module 2: Communication Skills", site: "City Logistics", date: "Feb 6, 2026", time: "09:00 - 14:00" },
              { title: "Module 5: Financial Requirements", site: "Monteagle Consumer", date: "Feb 7, 2026", time: "09:00 - 14:00" },
            ].map((lesson, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 border border-background-border rounded-lg hover:bg-background transition-colors">
                <div className="flex items-center gap-3">
                  <Calendar className="w-8 h-8 text-primary" />
                  <div>
                    <p className="font-medium text-text">{lesson.title}</p>
                    <p className="text-sm text-text-light">{lesson.site} • {lesson.time}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-text">{lesson.date}</p>
                  <button className="text-primary hover:text-secondary text-sm font-medium">
                    Edit Plan
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
