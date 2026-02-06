'use client';

import Header from "@/components/Header";
import { Sparkles, MessageCircle, FileText, Calendar, TrendingUp } from "lucide-react";

export default function AIAssistantPage() {
  return (
    <>
      <Header />
      
      <div className="p-6 space-y-6">
        <div className="bg-gradient-to-r from-primary to-primary-light rounded-2xl p-8 text-white text-center">
          <Sparkles className="w-16 h-16 mx-auto mb-4" />
          <h3 className="text-2xl font-bold mb-2">AI-Powered Training Assistant</h3>
          <p className="text-white/80 mb-6">Get intelligent suggestions for lesson planning, reporting, and student support</p>
        </div>

        {/* AI Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button 
            onClick={() => alert('AI Lesson Plan Generator\n\nThis feature will use AI to create structured lesson plans based on your curriculum. Coming soon!')}
            className="bg-white rounded-xl border border-background-border p-6 hover:shadow-md transition-shadow cursor-pointer text-left w-full"
          >
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center mb-4">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="font-semibold text-text mb-2">Auto-Generate Lesson Plans</h3>
            <p className="text-sm text-text-light mb-4">Create structured lesson plans based on curriculum requirements</p>
            <span className="text-primary hover:text-secondary text-sm font-medium">
              Generate Now →
            </span>
          </button>

          <button 
            onClick={() => alert('AI Progress Insights\n\nThis feature will analyze student performance patterns and provide recommendations. Coming soon!')}
            className="bg-white rounded-xl border border-background-border p-6 hover:shadow-md transition-shadow cursor-pointer text-left w-full"
          >
            <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-lg flex items-center justify-center mb-4">
              <TrendingUp className="w-6 h-6" />
            </div>
            <h3 className="font-semibold text-text mb-2">Student Progress Insights</h3>
            <p className="text-sm text-text-light mb-4">Get AI-powered analysis of student performance trends</p>
            <span className="text-primary hover:text-secondary text-sm font-medium">
              View Insights →
            </span>
          </button>

          <button 
            onClick={() => alert('AI Smart Scheduling\n\nThis feature will optimize your timetable using AI to maximize learning outcomes. Coming soon!')}
            className="bg-white rounded-xl border border-background-border p-6 hover:shadow-md transition-shadow cursor-pointer text-left w-full"
          >
            <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center mb-4">
              <Calendar className="w-6 h-6" />
            </div>
            <h3 className="font-semibold text-text mb-2">Smart Scheduling</h3>
            <p className="text-sm text-text-light mb-4">Optimize your training schedule with AI recommendations</p>
            <span className="text-primary hover:text-secondary text-sm font-medium">
              Optimize Schedule →
            </span>
          </button>

          <button 
            onClick={() => alert('AI Report Generation\n\nThis feature will automatically generate comprehensive compliance and progress reports. Coming soon!')}
            className="bg-white rounded-xl border border-background-border p-6 hover:shadow-md transition-shadow cursor-pointer text-left w-full"
          >
            <div className="w-12 h-12 bg-green-50 text-green-600 rounded-lg flex items-center justify-center mb-4">
              <MessageCircle className="w-6 h-6" />
            </div>
            <h3 className="font-semibold text-text mb-2">Report Generation</h3>
            <p className="text-sm text-text-light mb-4">Automatically generate compliance and progress reports</p>
            <span className="text-primary hover:text-secondary text-sm font-medium">
              Create Report →
            </span>
          </button>
        </div>
      </div>
    </>
  );
}
