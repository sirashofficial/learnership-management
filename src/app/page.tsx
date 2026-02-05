"use client";

import Header from "@/components/Header";
import DashboardStats from "@/components/DashboardStats";
import DashboardAlerts from "@/components/DashboardAlerts";
import RecentActivity from "@/components/RecentActivity";
import TodaysSchedule from "@/components/TodaysSchedule";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { 
  GraduationCap,
  Building2,
  MessageCircle,
  Plus,
  FileText,
  CircleCheck,
  Sparkles
} from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const { stats } = useDashboardStats();

  const totalStudents = stats?.totalStudents || 0;
  const totalGroups = stats?.totalGroups || 0;
  const pendingAssessments = stats?.pendingAssessments || 0;

  return (
    <>
      <Header 
        title="Dashboard" 
        subtitle="Overview of your cohorts and activities" 
      />
      
      <div className="animate-fade-in">
        <div className="p-6 space-y-6">

          {/* Welcome Banner */}
          <div className="relative overflow-hidden bg-gradient-to-r from-primary to-primary-light rounded-2xl p-6 text-white">
            <div className="relative z-10">
              <h2 className="text-2xl font-bold">Welcome back, Ash!</h2>
              <p className="text-white/70 mt-1">
                You have {pendingAssessments} pending assessments.
              </p>
              <div className="flex items-center gap-4 mt-4">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-lg backdrop-blur-sm">
                  <GraduationCap className="w-4 h-4" />
                  <span className="text-sm font-medium">{totalStudents} Students</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-lg backdrop-blur-sm">
                  <Building2 className="w-4 h-4" />
                  <span className="text-sm font-medium">{totalGroups} Groups</span>
                </div>
              </div>
            </div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 right-20 w-32 h-32 bg-white/5 rounded-full translate-y-1/2" />
          </div>

          {/* Stats Cards */}
          <DashboardStats />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content Area */}
            <div className="lg:col-span-2 space-y-6">
              {/* Today's Schedule */}
              <TodaysSchedule />

              {/* Recent Activity */}
              <RecentActivity />
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <DashboardAlerts />
              <QuickActionsWidget />
            </div>
          </div>
        </div>
      </div>

      {/* Floating Action Button */}
      <Link 
        href="/ai"
        className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-br from-primary to-primary-light text-white rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-105 flex items-center justify-center z-50"
      >
        <MessageCircle className="w-6 h-6" />
      </Link>
    </>
  );
}

function QuickActionsWidget() {
  return (
    <div className="bg-white rounded-2xl border border-background-border shadow-sm p-5">
      <h3 className="font-semibold text-text mb-4">Quick Actions</h3>
      
      <div className="space-y-2">
        <Link 
          href="/students"
          className="w-full px-4 py-3 text-left rounded-xl text-sm font-medium bg-secondary hover:bg-secondary-dark text-white transition-colors flex items-center gap-3 block"
        >
          <Plus className="w-4 h-4" />
          Add New Student
        </Link>
        <Link 
          href="/curriculum"
          className="w-full px-4 py-3 text-left rounded-xl text-sm font-medium bg-primary hover:bg-primary-light text-white transition-colors flex items-center gap-3 block"
        >
          <Sparkles className="w-4 h-4" />
          View Curriculum
        </Link>
        <Link 
          href="/attendance"
          className="w-full px-4 py-3 text-left rounded-xl text-sm font-medium bg-background hover:bg-background-border text-text transition-colors flex items-center gap-3 block"
        >
          <CircleCheck className="w-4 h-4" />
          Mark Attendance
        </Link>
        <Link 
          href="/lessons"
          className="w-full px-4 py-3 text-left rounded-xl text-sm font-medium bg-background hover:bg-background-border text-text transition-colors flex items-center gap-3 block"
        >
          <FileText className="w-4 h-4" />
          Plan Lesson
        </Link>
      </div>
    </div>
  );
}
