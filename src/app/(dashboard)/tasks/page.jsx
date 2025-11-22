"use client";
import CapacityIndicator from "@/components/CapacityIndicator";
import CapacityWarningModal from "@/components/CapacityWarningModal";
import { useAuth} from "@/hooks/useAuth";
import api from "@/lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import toast from "react-hot-toast";

const TasksPage = () => {
  const { user,loading } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCapacityWarning, setShowCapacityWarning] = useState(false);
  const [capacityWarnings, setCapacityWarnings] = useState([]);
  const [pendingTaskData, setPendingTaskData] = useState(null);

  const [filters, setFilters] = useState({
    project: "",
    status: "",
    priority: "",
    member: "",
  });

  // Task form state
  const [taskFormData, setTaskFormData] = useState({
    title: "",
    description: "",
    assignedMembers: [],
    priority: "Medium",
    status: "Pending",
    projectId: "",
  });

  // Fetch tasks
  const {
    data: tasks = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["tasks", user?.email],
    queryFn: async () => {
      if (!user?.email) {
        throw new Error("No user email found");
      }
      const res = await api.get(`/tasks/${user.email}`);
      return res.data;
    },
    enabled: !!user?.email,
  });

  // Fetch projects for filter and task creation
  const { data: projects = [] } = useQuery({
    queryKey: ["projects", user?.email],
    queryFn: async () => {
      if (!user?.email) {
        return [];
      }
      const res = await api.get(`/projects/${user.email}`);
      return res.data?.projects || [];
    },
    enabled: !!user?.email,
  });

  // Fetch tasks for selected project (for capacity checking)
  const { data: projectTasksData = {} } = useQuery({
    queryKey: ["project-tasks", taskFormData.projectId],
    queryFn: async () => {
      if (!taskFormData.projectId) return { tasks: [] };
      const res = await api.get(`/tasks?projectId=${taskFormData.projectId}`);
      return res.data;
    },
    enabled: !!taskFormData.projectId,
  });

  // Extract tasks from the response
  const projectTasks = projectTasksData.tasks || [];

  // Update task status mutation
  const updateTaskMutation = useMutation({
    mutationFn: async ({ taskId, updates }) => {
      const res = await api.put(`/tasks/${taskId}`, updates);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(["tasks"]);
      toast.success("Task updated successfully");
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || "Failed to update task");
    },
  });

  // Delete task mutation
  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId) => {
      const res = await api.delete(`/tasks/${taskId}`);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(["tasks"]);
      setShowDeleteConfirm(null);
      toast.success(data?.message || "Task Deleted Successfully");
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || "Failed to delete task");
    },
  });

  // Create task mutation
  const createTaskMutation = useMutation({
    mutationFn: async (taskData) => {
      const res = await api.post("/tasks", taskData);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(["tasks"]);
      setShowCreateModal(false);
      resetTaskForm();
      toast.success(data?.message || "Task Created Successfully");
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || "Failed to create task");
    },
  });

  // Auto-assign mutation
  const autoAssignMutation = useMutation({
    mutationFn: async ({projectId, email}) => {
      const res = await api.post("/tasks/auto-assign", { projectId,email });
      return res.data;
    },
    onSuccess: (data) => {
      if (data.assignedMember) {
        setTaskFormData((prev) => ({
          ...prev,
          assignedMembers: [data.assignedMember],
        }));
        toast.success(`Auto-assigned to ${data.assignedMember.name}`);
      }
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || "Failed to auto-assign");
    },
  });

  
  const filteredTasks = tasks.filter((task) => {
    if (filters.project && task.project?._id !== filters.project) return false;
    if (filters.status && task.status !== filters.status) return false;
    if (filters.priority && task.priority !== filters.priority) return false;
    if (
      filters.member &&
      !task.assignedMember.some((member) => member.name === filters.member)
    )
      return false;
    return true;
  });

  const handleFilterChange = (filterType, value) => {
    setFilters((prev) => ({
      ...prev,
      [filterType]: value,
    }));
  };

  const handleStatusChange = (taskId, newStatus) => {
    updateTaskMutation.mutate({
      taskId,
      updates: { status: newStatus },
    });
  };

  const handleDeleteTask = (taskId) => {
    deleteTaskMutation.mutate(taskId);
  };

  const clearFilters = () => {
    setFilters({
      project: "",
      status: "",
      priority: "",
      member: "",
    });
  };

  
  const handleTaskInputChange = (e) => {
    const { name, value } = e.target;
    setTaskFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    
    if (name === "projectId") {
      setTaskFormData((prev) => ({
        ...prev,
        assignedMembers: [],
      }));
      setCapacityWarnings([]);
    }
  };

  const handleMemberToggle = (member) => {
    const isSelected = taskFormData.assignedMembers.some(
      (m) => m.name === member.name
    );

    if (isSelected) {
     
      setTaskFormData((prev) => ({
        ...prev,
        assignedMembers: prev.assignedMembers.filter(
          (m) => m.name !== member.name
        ),
      }));
      setCapacityWarnings((prev) =>
        prev.filter((w) => w.memberName !== member.name)
      );
    } else {
   
      setTaskFormData((prev) => ({
        ...prev,
        assignedMembers: [...prev.assignedMembers, member],
      }));
    }
  };

  const checkMemberCapacity = (members) => {
    const warnings = [];
    const selectedProject = projects.find(
      (p) => p._id === taskFormData.projectId
    );

    if (!selectedProject) return warnings;

    members.forEach((member) => {
      const memberTaskCount = (projectTasks || []).filter((task) =>
        task.assignedMember.some((am) => am.name === member.name)
      ).length;

      if (memberTaskCount >= member.capacity) {
        const isOverCapacity = memberTaskCount > member.capacity;
        warnings.push({
          memberName: member.name,
          currentTasks: memberTaskCount,
          capacity: member.capacity,
          message: `${member.name} has ${memberTaskCount} tasks but capacity is ${member.capacity}.`,
          isOverCapacity,
          severity: isOverCapacity ? "error" : "warning",
        });
      }
    });

    return warnings;
  };

  const handleCreateTask = (e) => {
    e.preventDefault();

    if (!taskFormData.title.trim()) {
      toast.error("Task title is required");
      return;
    }

    if (!taskFormData.projectId) {
      toast.error("Please select a project");
      return;
    }

   
    const warnings = checkMemberCapacity(taskFormData.assignedMembers);
    const hasOverCapacity = warnings.some((w) => w.isOverCapacity);

    if (warnings.length > 0) {
      setCapacityWarnings(warnings);
      setPendingTaskData({ ...taskFormData });
      setShowCapacityWarning(true);
      return;
    }

   
    createTaskMutation.mutate({
      ...taskFormData,
      createdBy: user.email,
    });
  };

  const handleCapacityWarningConfirm = () => {
  
    setShowCapacityWarning(false);
    createTaskMutation.mutate({
      ...pendingTaskData,
      createdBy: user.email,
    });
  };

  const handleCapacityWarningAutoAssign = () => {
  setShowCapacityWarning(false);
  autoAssignMutation.mutate({
    projectId: pendingTaskData.projectId,
    email: user?.email
  });
};


  const handleCapacityWarningCancel = () => {
    
    setShowCapacityWarning(false);
    setTaskFormData({
      ...pendingTaskData,
      assignedMembers: [],
    });
  };

  const clearAllMembers = () => {
    setTaskFormData((prev) => ({
      ...prev,
      assignedMembers: [],
    }));
    setCapacityWarnings([]);
  };

  const handleAutoAssign = () => {
    if (!taskFormData.projectId) {
      toast.error("Please select a project first");
      return;
    }

    const selectedProject = projects.find(
      (p) => p._id === taskFormData.projectId
    );
    if (!selectedProject?.team?.members) {
      toast.error("No team members found for this project");
      return;
    }

   
    const memberWorkload = selectedProject.team.members.map((member) => {
      const taskCount = (projectTasks || []).filter((task) =>
        task.assignedMember.some((am) => am.name === member.name)
      ).length;
      return {
        member,
        taskCount,
        availableCapacity: member.capacity - taskCount,
      };
    });

    
    const availableMembers = memberWorkload
      .filter(({ availableCapacity }) => availableCapacity > 0)
      .sort((a, b) => b.availableCapacity - a.availableCapacity);

    if (availableMembers.length === 0) {
      toast.error("No team members have available capacity");
      return;
    }

    
    const bestMember = availableMembers[0].member;

    setTaskFormData((prev) => ({
      ...prev,
      assignedMembers: [bestMember],
    }));

    toast.success(
      `Auto-assigned to ${bestMember.name} (${availableMembers[0].availableCapacity} tasks available)`
    );
  };

  const resetTaskForm = () => {
    setTaskFormData({
      title: "",
      description: "",
      assignedMembers: [],
      priority: "Medium",
      status: "Pending",
      projectId: "",
    });
    setCapacityWarnings([]);
    setPendingTaskData(null);
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "High":
        return "bg-red-100 text-red-800 border-red-200";
      case "Medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "Low":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Done":
        return "bg-green-100 text-green-800 border-green-200";
      case "In Progress":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "Pending":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };


  const uniqueMembers = [
    ...new Set(
      tasks
        .flatMap((task) => task.assignedMember.map((member) => member.name))
        .filter(Boolean)
    ),
  ];

 
  const selectedProject = projects.find(
    (p) => p._id === taskFormData.projectId
  );

  if (isLoading || loading) {
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
            Failed to load tasks
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
      <div className="w-11/12 mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">All Tasks</h1>
            <p className="text-gray-600 mt-2">
              Manage and track all your tasks across projects
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition duration-200 font-medium"
          >
            Create Task
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Project
              </label>
              <select
                value={filters.project}
                onChange={(e) => handleFilterChange("project", e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Projects</option>
                {projects.map((project) => (
                  <option key={project._id} value={project._id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange("status", e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Status</option>
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Done">Done</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Priority
              </label>
              <select
                value={filters.priority}
                onChange={(e) => handleFilterChange("priority", e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Priority</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Member
              </label>
              <select
                value={filters.member}
                onChange={(e) => handleFilterChange("member", e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Members</option>
                {uniqueMembers.map((member) => (
                  <option key={member} value={member}>
                    {member}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {(filters.project ||
            filters.status ||
            filters.priority ||
            filters.member) && (
            <div className="flex justify-between items-center mt-4">
              <span className="text-sm text-gray-600">
                Showing {filteredTasks.length} of {tasks.length} tasks
              </span>
              <button
                onClick={clearFilters}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>

        {/* Tasks List */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Tasks ({filteredTasks.length})
              {filters.project ||
              filters.status ||
              filters.priority ||
              filters.member
                ? ` (Filtered)`
                : ""}
            </h2>
          </div>

          {filteredTasks.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">📝</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {tasks.length === 0
                  ? "No tasks yet"
                  : "No tasks match your filters"}
              </h3>
              <p className="text-gray-600 mb-6">
                {tasks.length === 0
                  ? "Create your first task to get started"
                  : "Try changing your filters"}
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition duration-200"
              >
                Create Task
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTasks.map((task) => (
                <div
                  key={task._id}
                  className="border border-gray-200 rounded-xl p-5 hover:shadow-lg transition-all duration-300 bg-white flex flex-col h-full"
                >
                  {/* Header Section */}
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900 truncate">
                        {task.title}
                      </h3>
                      {task.description && (
                        <p className="text-gray-600 mt-2 text-sm line-clamp-2">
                          {task.description}
                        </p>
                      )}
                    </div>
                    <div className="flex space-x-2 ml-3 shrink-0">
                      <button
                        onClick={() =>
                          router.push(
                            `/projects/${task.project?._id}/tasks/${task._id}/edit`
                          )
                        }
                        className="text-blue-600 hover:text-blue-800 p-1.5 rounded-full hover:bg-blue-50 transition-colors"
                        title="Edit task"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(task._id)}
                        className="text-red-600 hover:text-red-800 p-1.5 rounded-full hover:bg-red-50 transition-colors"
                        title="Delete task"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Project Info */}
                  <div className="mb-4">
                    <div className="flex items-center text-sm text-gray-500">
                      <svg
                        className="w-4 h-4 mr-1.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                        />
                      </svg>
                      <span className="truncate">
                        {task.project?.name || "No Project"}
                      </span>
                    </div>
                  </div>

                  {/* Tags Section */}
                  <div className="flex flex-wrap gap-2 mb-5">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getPriorityColor(
                        task.priority
                      )}`}
                    >
                      {task.priority} Priority
                    </span>
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                        task.status
                      )}`}
                    >
                      {task.status}
                    </span>
                  </div>

                  {/* Assigned Members */}
                  <div className="mb-5">
                    <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                      Assigned To
                    </h4>
                    {task.assignedMember.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {task.assignedMember.map((member, index) => (
                          <div
                            key={index}
                            className="flex items-center bg-purple-50 text-purple-700 px-2.5 py-1.5 rounded-lg text-xs font-medium"
                          >
                            <div className="w-2 h-2 rounded-full bg-purple-400 mr-1.5"></div>
                            {member.name} ({member.role})
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex items-center text-gray-500 text-sm">
                        <svg
                          className="w-4 h-4 mr-1.5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                          />
                        </svg>
                        Unassigned
                      </div>
                    )}
                  </div>

                  {/* Footer Section */}
                  <div className="mt-auto pt-4 border-t border-gray-100">
                    <div className="flex justify-between items-center">
                      <div className="text-xs text-gray-500 flex items-center">
                        <svg
                          className="w-3.5 h-3.5 mr-1"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                        {new Date(task.createdAt).toLocaleDateString()}
                      </div>
                      <div className="flex space-x-2">
                        <select
                          value={task.status}
                          onChange={(e) =>
                            handleStatusChange(task._id, e.target.value)
                          }
                          disabled={updateTaskMutation.isLoading}
                          className="text-xs border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 bg-white"
                        >
                          <option value="Pending">Pending</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Done">Done</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Create Task Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Create New Task
                  </h2>
                  <button
                    onClick={() => {
                      setShowCreateModal(false);
                      resetTaskForm();
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>

                <form onSubmit={handleCreateTask}>
                  <div className="space-y-6">
                    {/* Title */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Task Title *
                      </label>
                      <input
                        type="text"
                        name="title"
                        value={taskFormData.title}
                        onChange={handleTaskInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter task title"
                      />
                    </div>

                    {/* Description */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description
                      </label>
                      <textarea
                        name="description"
                        value={taskFormData.description}
                        onChange={handleTaskInputChange}
                        rows="4"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter task description"
                      />
                    </div>

                    {/* Project Selection */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Project *
                      </label>
                      <select
                        name="projectId"
                        value={taskFormData.projectId}
                        onChange={handleTaskInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select a project</option>
                        {projects.map((project) => (
                          <option key={project._id} value={project._id}>
                            {project.name} - {project.team?.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Priority */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Priority
                      </label>
                      <select
                        name="priority"
                        value={taskFormData.priority}
                        onChange={handleTaskInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                      </select>
                    </div>

                    {/* Assigned Members */}
                    {selectedProject && (
                      <div>
                        <div className="flex justify-between items-center mb-4">
                          <label className="block text-sm font-medium text-gray-700">
                            Assigned Members
                          </label>
                          <div className="flex space-x-2">
                            <button
                              type="button"
                              onClick={handleAutoAssign}
                              className="text-sm bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition duration-200"
                            >
                              Auto-assign
                            </button>
                            <button
                              type="button"
                              onClick={clearAllMembers}
                              className="text-sm bg-gray-600 text-white px-3 py-1 rounded-md hover:bg-gray-700 transition duration-200"
                            >
                              Clear All
                            </button>
                          </div>
                        </div>

                        {/* Selected Members */}
                        {taskFormData.assignedMembers.length > 0 && (
                          <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Selected Members (
                              {taskFormData.assignedMembers.length})
                            </label>
                            <div className="flex flex-wrap gap-2">
                              {taskFormData.assignedMembers.map(
                                (member, index) => (
                                  <div
                                    key={index}
                                    className="flex items-center space-x-2 bg-blue-100 text-blue-800 px-3 py-2 rounded-full"
                                  >
                                    <span className="text-sm font-medium">
                                      {member.name} ({member.role})
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => handleMemberToggle(member)}
                                      className="text-blue-600 hover:text-blue-800 text-sm"
                                    >
                                      ×
                                    </button>
                                  </div>
                                )
                              )}
                            </div>
                          </div>
                        )}

                        {/* Available Members */}
                        <div className="border border-gray-200 rounded-lg p-4">
                          <label className="block text-sm font-medium text-gray-700 mb-3">
                            Available Team Members
                            <span className="text-xs text-gray-500 ml-2">
                              (Current tasks / Capacity)
                            </span>
                          </label>

                          <div className="space-y-3">
                            {selectedProject.team?.members?.map(
                              (member, index) => {
                                const isSelected =
                                  taskFormData.assignedMembers.some(
                                    (m) => m.name === member.name
                                  );
                                const memberTaskCount = (
                                  projectTasks || []
                                ).filter((task) =>
                                  task.assignedMember.some(
                                    (am) => am.name === member.name
                                  )
                                ).length;
                                const isAtCapacity =
                                  memberTaskCount >= member.capacity;
                                const isOverCapacity =
                                  memberTaskCount > member.capacity;

                                return (
                                  <div
                                    key={index}
                                    className={`border rounded-lg p-4 cursor-pointer transition-all duration-200 ${
                                      isSelected
                                        ? "border-blue-500 bg-blue-50 ring-2 ring-blue-200"
                                        : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                                    } ${
                                      isOverCapacity
                                        ? "border-red-300 bg-red-50"
                                        : isAtCapacity
                                        ? "border-yellow-300 bg-yellow-50"
                                        : ""
                                    }`}
                                    onClick={() =>
                                      !isOverCapacity &&
                                      handleMemberToggle(member)
                                    }
                                  >
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center space-x-3 flex-1">
                                        <input
                                          type="checkbox"
                                          checked={isSelected}
                                          onChange={() =>
                                            !isOverCapacity &&
                                            handleMemberToggle(member)
                                          }
                                          disabled={isOverCapacity}
                                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                                        />

                                        <div className="flex-1">
                                          <div className="flex items-center space-x-2">
                                            <span className="font-medium text-gray-900">
                                              {member.name}
                                            </span>
                                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                              {member.role}
                                            </span>
                                          </div>

                                          <div className="mt-2">
                                            <CapacityIndicator
                                              current={memberTaskCount}
                                              max={member.capacity}
                                              showWarning={true}
                                            />
                                          </div>

                                          {isOverCapacity && (
                                            <div className="mt-2 text-xs text-red-600 bg-red-100 px-2 py-1 rounded">
                                              ⚠️ Over capacity! Cannot assign
                                              more tasks
                                            </div>
                                          )}
                                          {isAtCapacity && !isOverCapacity && (
                                            <div className="mt-2 text-xs text-yellow-600 bg-yellow-100 px-2 py-1 rounded">
                                              ⚠️ At capacity - assign with
                                              caution
                                            </div>
                                          )}
                                        </div>
                                      </div>

                                      {!isOverCapacity && (
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleMemberToggle(member);
                                          }}
                                          className={`ml-4 px-3 py-1 text-sm rounded-md ${
                                            isSelected
                                              ? "bg-red-100 text-red-700 hover:bg-red-200"
                                              : "bg-blue-100 text-blue-700 hover:bg-blue-200"
                                          }`}
                                        >
                                          {isSelected ? "Remove" : "Add"}
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                );
                              }
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Status */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Status
                      </label>
                      <select
                        name="status"
                        value={taskFormData.status}
                        onChange={handleTaskInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="Pending">Pending</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Done">Done</option>
                      </select>
                    </div>

                    {/* Submit Buttons */}
                    <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                      <button
                        type="button"
                        onClick={() => {
                          setShowCreateModal(false);
                          resetTaskForm();
                        }}
                        className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition duration-200"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={createTaskMutation.isLoading}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition duration-200"
                      >
                        {createTaskMutation.isLoading
                          ? "Creating..."
                          : "Create Task"}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Capacity Warning Modal */}
        {showCapacityWarning && (
          <CapacityWarningModal
            warnings={capacityWarnings}
            onConfirm={handleCapacityWarningConfirm}
            onCancel={handleCapacityWarningCancel}
            onChooseAnother={handleCapacityWarningAutoAssign}
          />
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-sm w-full p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Delete Task
              </h3>
              <p className="text-gray-600 mb-4">
                Are you sure you want to delete this task? This action cannot be
                undone.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteTask(showDeleteConfirm)}
                  disabled={deleteTaskMutation.isLoading}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition duration-200"
                >
                  {deleteTaskMutation.isLoading ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TasksPage;
