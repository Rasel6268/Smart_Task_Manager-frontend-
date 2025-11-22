"use client";
import { useAuth } from "@/hooks/useAuth";
import api from "@/lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import toast from "react-hot-toast";

const DashboardPage = () => {
  const { user } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  // Fetch dashboard data
  const {
    data: dashboardData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["dashboard", user?.email],
    queryFn: async () => {
      if (!user?.email) {
        throw new Error("No user email found");
      }
      const res = await api.get(`/dashboard/${user.email}`);
      return res.data || {};
    },
    enabled: !!user?.email,
  });

  // Reassign tasks mutation
  const reassignTasksMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post("/tasks/reassign");
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(["dashboard"]);
      queryClient.invalidateQueries(["tasks"]);
      queryClient.invalidateQueries(["projects"]);
      toast.success(data?.message || "Tasks reassigned successfully");
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || "Failed to reassign tasks");
    }
  });

  const handleReassignTasks = () => {
    reassignTasksMutation.mutate();
  };

  const navigateTo = (path) => {
    router.push(path);
  };


  const totalProjects = dashboardData?.totalProjects || 0;
  const totalTasks = dashboardData?.totalTasks || 0;
  const teamSummary = dashboardData?.teamSummary || [];
  const recentReassignments = dashboardData?.recentReassignments || [];

  
  const completedTasks = dashboardData?.completedTasks || 0;
  const pendingTasks = dashboardData?.pendingTasks || 0;
  const inProgressTasks = dashboardData?.inProgressTasks || 0;
  const highPriorityTasks = dashboardData?.highPriorityTasks || 0;
  const mediumPriorityTasks = dashboardData?.mediumPriorityTasks || 0;
  const lowPriorityTasks = dashboardData?.lowPriorityTasks || 0;
  const overdueTasks = dashboardData?.overdueTasks || 0;

  const completionRate = totalTasks > 0 ? 
    Math.round((completedTasks / totalTasks) * 100) : 0;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Failed to load dashboard
          </h3>
          <p className="text-gray-600 mb-6">
            {error.message || "Something went wrong"}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition duration-200"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
       
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Welcome back! Here's an overview of your projects and teams.
          </p>
        </div>

        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
         
          <div 
            className="bg-white rounded-lg shadow-md p-6 cursor-pointer hover:shadow-lg transition duration-200"
            onClick={() => navigateTo("/projects")}
          >
            <div className="flex items-center">
              <div className="shrink-0">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500">Total Projects</h3>
                <p className="text-2xl font-semibold text-gray-900">{totalProjects}</p>
              </div>
            </div>
          </div>

        
          <div 
            className="bg-white rounded-lg shadow-md p-6 cursor-pointer hover:shadow-lg transition duration-200"
            onClick={() => navigateTo("/tasks")}
          >
            <div className="flex items-center">
              <div className="shrink-0">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500">Total Tasks</h3>
                <p className="text-2xl font-semibold text-gray-900">{totalTasks}</p>
              </div>
            </div>
          </div>

         
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="shrink-0">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500">Completion Rate</h3>
                <p className="text-2xl font-semibold text-gray-900">{completionRate}%</p>
              </div>
            </div>
          </div>

         
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="shrink-0">
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500">High Priority</h3>
                <p className="text-2xl font-semibold text-gray-900">{highPriorityTasks}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
       
          <div className="lg:col-span-2 space-y-8">
            
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Team Summary</h2>
                <button
                  onClick={handleReassignTasks}
                  disabled={reassignTasksMutation.isLoading || totalTasks === 0}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition duration-200 text-sm font-medium"
                >
                  {reassignTasksMutation.isLoading ? "Reassigning..." : "Reassign Tasks"}
                </button>
              </div>

              {teamSummary.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-gray-400 text-6xl mb-4">👥</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No teams yet</h3>
                  <p className="text-gray-600 mb-4">Create your first team to get started</p>
                  <button
                    onClick={() => navigateTo("/teams")}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition duration-200"
                  >
                    Create Team
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {teamSummary.map((team, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">{team.teamName}</h3>
                      <div className="space-y-3">
                        {team.members?.map((member, memberIndex) => (
                          <div key={memberIndex} className="flex justify-between items-center">
                            <div className="flex items-center space-x-3">
                              <div className="shrink-0">
                                <div className={`w-3 h-3 rounded-full ${member.isOverloaded ? 'bg-red-500' : 'bg-green-500'}`}></div>
                              </div>
                              <div>
                                <span className="font-medium text-gray-900">{member.name}</span>
                                <span className="text-sm text-gray-500 ml-2">({member.role})</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className={`text-sm font-medium ${member.isOverloaded ? 'text-red-600' : 'text-gray-600'}`}>
                                {member.currentTasks || 0} / {member.capacity || 0} tasks
                              </div>
                              {member.isOverloaded && (
                                <div className="text-xs text-red-500">Overloaded</div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          
          </div>

         
          <div className="space-y-8">
           
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Recent Reassignments</h2>
              
              {recentReassignments.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-gray-400 text-6xl mb-4">🔄</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No recent reassignments</h3>
                  <p className="text-gray-600">Tasks will appear here after using "Reassign Tasks"</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentReassignments.slice(0, 5).map((activity, index) => (
                    <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                      <div className="shrink-0">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                          </svg>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900">
                          Task <span className="font-medium">"{activity.taskTitle}"</span> reassigned
                        </p>
                        <p className="text-sm text-gray-500">
                          From {activity.fromMember?.name || "Unassigned"} to {activity.toMember?.name}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(activity.timestamp).toLocaleDateString()} at{" "}
                          {new Date(activity.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Task Status</h2>
              
              {totalTasks === 0 ? (
                <div className="text-center py-8">
                  <div className="text-gray-400 text-6xl mb-4">📊</div>
                  <p className="text-gray-600">No tasks to display</p>
                </div>
              ) : (
                <div className="space-y-4">
                 
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                      <span className="text-sm text-gray-600">Pending</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">
                      {pendingTasks}
                    </span>
                  </div>
                  
                
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span className="text-sm text-gray-600">In Progress</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">
                      {inProgressTasks}
                    </span>
                  </div>
                  
                 
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="text-sm text-gray-600">Done</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">
                      {completedTasks}
                    </span>
                  </div>

                 
                  <div className="mt-4">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${completionRate}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>Progress</span>
                      <span>{completionRate}%</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

          
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Priority Distribution</h2>
              
              {totalTasks === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-600">No priority data available</p>
                </div>
              ) : (
                <div className="space-y-3">
                
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <span className="text-sm text-gray-600">High</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">
                      {highPriorityTasks}
                    </span>
                  </div>
                  
                
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                      <span className="text-sm text-gray-600">Medium</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">
                      {mediumPriorityTasks}
                    </span>
                  </div>
                  
                
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="text-sm text-gray-600">Low</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">
                      {lowPriorityTasks}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;