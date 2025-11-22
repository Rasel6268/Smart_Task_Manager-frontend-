"use client";
import { useAuth } from "@/hooks/useAuth";
import api from "@/lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import toast from "react-hot-toast";
import { MdCreate, MdDelete, MdUpdate } from "react-icons/md";

const DashboardPage = () => {
  const { user,loading } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

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

  const { data: activityData } = useQuery({
    queryKey: ["activity-logs", user?.email],
    queryFn: async () => {
      if (!user?.email) return { activityLogs: [] };
      const res = await api.get(`/activity-logs/${user.email}?limit=10`);
      return res.data || {};
    },
    enabled: !!user?.email,
  });
  console.log(activityData)

  // Reassign tasks mutation
  const reassignTasksMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post(`/tasks/reassign/${user.email}`);
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

  const activityLogs = activityData?.activityLogs || [];
  const recentActivities = activityLogs.slice(0, 5);

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'TASK_CREATED': return <MdCreate/>;
      case 'TASK_UPDATED': return <MdUpdate/>;
      case 'TASK_DELETED': return <MdDelete/>;
      case 'TASK_REASSIGNED': return '🔄';
      case 'PROJECT_CREATED': return '📁';
      case 'TEAM_CREATED': return '👥';
      default: return '📝';
    }
  };

  const formatActivityMessage = (activity) => {
    switch (activity.type) {
      case 'TASK_REASSIGNED':
        return `Task "${activity.taskTitle}" reassigned from ${activity.fromMember?.name || 'Unassigned'} to ${activity.toMember?.name}`;
      case 'TASK_CREATED':
        return `Created task "${activity.taskTitle}"`;
      case 'TASK_UPDATED':
        return `Updated task "${activity.taskTitle}"`;
      case 'TASK_DELETED':
        return `Deleted task "${activity.taskTitle}"`;
      case 'PROJECT_CREATED':
        return `Created project "${activity.projectName}"`;
      case 'TEAM_CREATED':
        return `Created team "${activity.teamName}"`;
      default:
        return activity.taskTitle || 'Activity recorded';
    }
  };

  // Stats cards data
  const statsCards = [
    {
      title: "Total Projects",
      value: totalProjects,
      icon: (
        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
        </svg>
      ),
      color: "blue",
      path: "/projects"
    },
    {
      title: "Total Tasks",
      value: totalTasks,
      icon: (
        <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
      color: "green",
      path: "/tasks"
    },
    {
      title: "High Priority",
      value: highPriorityTasks,
      icon: (
        <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      ),
      color: "red"
    },
    {
      title: "Overdue Tasks",
      value: overdueTasks,
      icon: (
        <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: "orange"
    },
    
  ];

  const getColorClasses = (color) => {
    const colors = {
      blue: { bg: "bg-blue-100", text: "text-blue-600", hover: "hover:bg-blue-50" },
      green: { bg: "bg-green-100", text: "text-green-600", hover: "hover:bg-green-50" },
      purple: { bg: "bg-purple-100", text: "text-purple-600", hover: "hover:bg-purple-50" },
      red: { bg: "bg-red-100", text: "text-red-600", hover: "hover:bg-red-50" },
      orange: { bg: "bg-orange-100", text: "text-orange-600", hover: "hover:bg-orange-50" },
      yellow: { bg: "bg-yellow-100", text: "text-yellow-600", hover: "hover:bg-yellow-50" }
    };
    return colors[color] || colors.blue;
  };

  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Failed to load dashboard</h3>
          <p className="text-gray-600 mb-6">
            {error.message || "Something went wrong while loading your dashboard"}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition duration-200 font-medium shadow-sm"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-600 mt-2">
                Welcome back, {user?.name || "User"}! Here's your project overview.
              </p>
            </div>
            <div className="mt-4 sm:mt-0 flex space-x-3">
              <button
                onClick={() => navigateTo("/projects/new")}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition duration-200 font-medium shadow-sm flex items-center"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                New Project
              </button>
              <button
                onClick={() => navigateTo("/tasks/new")}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition duration-200 font-medium shadow-sm flex items-center"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                New Task
              </button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
          {statsCards.map((card, index) => {
            const colorClasses = getColorClasses(card.color);
            const CardComponent = card.path ? "button" : "div";
            
            return (
              <CardComponent
                key={index}
                onClick={card.path ? () => navigateTo(card.path) : undefined}
                className={`bg-white rounded-xl shadow-sm p-6 transition-all duration-200 border border-gray-100 ${
                  card.path ? "cursor-pointer hover:shadow-md hover:border-gray-200 " + colorClasses.hover : ""
                }`}
              >
                <div className="flex items-center">
                  <div className="shrink-0">
                    <div className={`w-12 h-12 ${colorClasses.bg} rounded-xl flex items-center justify-center`}>
                      {card.icon}
                    </div>
                  </div>
                  <div className="ml-4 flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-gray-500 truncate">{card.title}</h3>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{card.value}</p>
                  </div>
                </div>
              </CardComponent>
            );
          })}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Left Column - 2/3 width */}
          <div className="xl:col-span-2 space-y-8">
            {/* Team Summary */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 sm:mb-0">Team Summary</h2>
                <button
                  onClick={handleReassignTasks}
                  disabled={reassignTasksMutation.isLoading || totalTasks === 0}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-2.5 rounded-lg hover:from-blue-700 hover:to-blue-800 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition duration-200 font-medium shadow-sm flex items-center justify-center"
                >
                  {reassignTasksMutation.isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Reassigning...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Reassign Tasks
                    </>
                  )}
                </button>
              </div>

              {teamSummary.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No teams yet</h3>
                  <p className="text-gray-600 mb-6 max-w-sm mx-auto">
                    Create your first team to start collaborating and assigning tasks to team members.
                  </p>
                  <button
                    onClick={() => navigateTo("/teams")}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition duration-200 font-medium shadow-sm"
                  >
                    Create Your First Team
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {teamSummary.map((team, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-5 hover:border-gray-300 transition duration-200">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">{team.teamName}</h3>
                        <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                          {team.members?.length || 0} members
                        </span>
                      </div>
                      <div className="space-y-3">
                        {team.members?.map((member, memberIndex) => (
                          <div key={memberIndex} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center space-x-3 flex-1 min-w-0">
                              <div className="relative">
                                <div className={`w-3 h-3 rounded-full ${member.isOverloaded ? 'bg-red-500' : 'bg-green-500'}`}></div>
                                {member.isOverloaded && (
                                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-gray-900 truncate">{member.name}</p>
                                <p className="text-sm text-gray-500 truncate">{member.role}</p>
                              </div>
                            </div>
                            <div className="text-right shrink-0 ml-3">
                              <div className={`text-sm font-semibold ${member.isOverloaded ? 'text-red-600' : 'text-gray-600'}`}>
                                {member.currentTasks || 0}/{member.capacity || 0}
                              </div>
                              <div className="text-xs text-gray-400">tasks</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Recent Activity</h2>
              
              {recentActivities.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No recent activity</h3>
                  <p className="text-gray-600">Activity will appear here as you work on projects and tasks.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentActivities.map((activity, index) => (
                    <div key={index} className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition duration-200">
                      <div className="shrink-0">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-lg">
                          {getActivityIcon(activity.type)}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900 font-medium">
                          {formatActivityMessage(activity)}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(activity.timestamp).toLocaleDateString()} at {formatTime(activity.timestamp)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column - 1/3 width */}
          <div className="space-y-8">
            {/* Task Status Overview */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Task Status</h2>
              
              {totalTasks === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <p className="text-gray-600">No tasks to display</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Progress Bar */}
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700">Overall Progress</span>
                      <span className="text-sm font-bold text-gray-900">{completionRate}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className="bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full transition-all duration-500 shadow-sm"
                        style={{ width: `${completionRate}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Status Breakdown */}
                  <div className="space-y-4">
                    {[
                      { status: "Pending", count: pendingTasks, color: "bg-gray-400" },
                      { status: "In Progress", count: inProgressTasks, color: "bg-blue-500" },
                      { status: "Completed", count: completedTasks, color: "bg-green-500" }
                    ].map((item, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <div className="flex items-center space-x-3">
                          <div className={`w-3 h-3 ${item.color} rounded-full`}></div>
                          <span className="text-sm font-medium text-gray-700">{item.status}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-bold text-gray-900">{item.count}</span>
                          <span className="text-xs text-gray-500">tasks</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Priority Distribution */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Priority Distribution</h2>
              
              {totalTasks === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-600">No priority data available</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {[
                    { priority: "High", count: highPriorityTasks, color: "bg-red-500" },
                    { priority: "Medium", count: mediumPriorityTasks, color: "bg-yellow-500" },
                    { priority: "Low", count: lowPriorityTasks, color: "bg-green-500" }
                  ].map((item, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 ${item.color} rounded-full`}></div>
                        <span className="text-sm font-medium text-gray-700">{item.priority}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-bold text-gray-900">{item.count}</span>
                        <span className="text-xs text-gray-500">
                          ({totalTasks > 0 ? Math.round((item.count / totalTasks) * 100) : 0}%)
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Quick Actions</h2>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => navigateTo("/projects")}
                  className="bg-blue-50 text-blue-700 p-4 rounded-lg hover:bg-blue-100 transition duration-200 font-medium text-sm flex flex-col items-center justify-center text-center"
                >
                  <svg className="w-5 h-5 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                  </svg>
                  View Projects
                </button>
                <button
                  onClick={() => navigateTo("/tasks")}
                  className="bg-green-50 text-green-700 p-4 rounded-lg hover:bg-green-100 transition duration-200 font-medium text-sm flex flex-col items-center justify-center text-center"
                >
                  <svg className="w-5 h-5 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  View Tasks
                </button>
                <button
                  onClick={() => navigateTo("/teams")}
                  className="bg-purple-50 text-purple-700 p-4 rounded-lg hover:bg-purple-100 transition duration-200 font-medium text-sm flex flex-col items-center justify-center text-center"
                >
                  <svg className="w-5 h-5 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  Manage Teams
                </button>
                <button
                  onClick={() => navigateTo("/analytics")}
                  className="bg-orange-50 text-orange-700 p-4 rounded-lg hover:bg-orange-100 transition duration-200 font-medium text-sm flex flex-col items-center justify-center text-center"
                >
                  <svg className="w-5 h-5 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  Analytics
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;