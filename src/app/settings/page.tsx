import Header from "@/components/Header";
import { User, Bell, Shield, Globe, Palette } from "lucide-react";

export default function SettingsPage() {
  return (
    <>
      <Header title="Settings" subtitle="Manage your account and preferences" />
      
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Settings Menu */}
          <div className="bg-white rounded-xl border border-background-border p-4">
            <nav className="space-y-1">
              {[
                { icon: User, label: "Profile", active: true },
                { icon: Bell, label: "Notifications", active: false },
                { icon: Shield, label: "Security", active: false },
                { icon: Globe, label: "Language", active: false },
                { icon: Palette, label: "Appearance", active: false },
              ].map((item) => (
                <button
                  key={item.label}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    item.active 
                      ? "bg-primary text-white" 
                      : "text-text hover:bg-background"
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Settings Content */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-background-border p-6">
            <h3 className="text-lg font-semibold text-text mb-6">Profile Settings</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text mb-2">Full Name</label>
                <input
                  type="text"
                  defaultValue="Ash"
                  className="w-full px-4 py-2 border border-background-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text mb-2">Email</label>
                <input
                  type="email"
                  defaultValue="ash@yeha.training"
                  className="w-full px-4 py-2 border border-background-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text mb-2">Role</label>
                <input
                  type="text"
                  defaultValue="Facilitator"
                  disabled
                  className="w-full px-4 py-2 border border-background-border rounded-lg bg-background text-text-light"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text mb-2">Phone Number</label>
                <input
                  type="tel"
                  placeholder="+27 XX XXX XXXX"
                  className="w-full px-4 py-2 border border-background-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button className="px-6 py-2 bg-primary hover:bg-primary-light text-white rounded-lg font-medium transition-colors">
                  Save Changes
                </button>
                <button className="px-6 py-2 bg-background hover:bg-background-border text-text rounded-lg font-medium transition-colors">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
