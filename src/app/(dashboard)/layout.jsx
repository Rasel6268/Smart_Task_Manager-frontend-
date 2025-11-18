"use client"
import Header from "@/components/dashboard/Navbar";
import Sidebar from "@/components/dashboard/Sidebar";
import { useState } from "react";

const UserLayout = ({ children }) => {
    const [sidebarOpen, setSidebarOpen] = useState(false)
  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
    <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default UserLayout;