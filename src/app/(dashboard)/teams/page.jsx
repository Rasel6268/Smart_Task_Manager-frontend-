"use client";
import { useAuth } from "@/hooks/useAuth";
import api from "@/lib/api";
import ProtectedRoute from "@/protectedRoute/ProtectedRoute";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import toast from "react-hot-toast";

const TeamsPage = () => {
  const { user,loading } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    members: [
      {
        name: user?.name || "",
        role: "Team Lead",
        capacity: 5
      }
    ]
  });

  
  const { data: teams = [], isLoading, error } = useQuery({
    queryKey: ["teams", user?.email],
    queryFn: async () => {
      if (!user?.email) {
        return [];
      }
      const res = await api.get(`/teams/${user.email}`);
      return res.data?.teams || [];
    },
    enabled: !!user?.email,
  });

  
  const createTeamMutation = useMutation({
    mutationFn: async (teamData) => {
      const res = await api.post("/teams", {
        ...teamData,
        createdBy: user.email
      });
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(["teams"]);
      setShowCreateModal(false);
      resetForm();
      toast.success(data.message)
    }
  });

  
  const deleteTeamMutation = useMutation({
    mutationFn: async (teamId) => {
      const res = await api.delete(`/teams/${teamId}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["teams"]);
      setShowDeleteConfirm(null);
    }
  });

  const navigateToTeamProjects = (teamId) => {
    router.push(`/projects?team=${teamId}`);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleMemberChange = (index, field, value) => {
    const updatedMembers = [...formData.members];
    updatedMembers[index] = {
      ...updatedMembers[index],
      [field]: value
    };
    setFormData(prev => ({
      ...prev,
      members: updatedMembers
    }));
  };

  const addMember = () => {
    setFormData(prev => ({
      ...prev,
      members: [
        ...prev.members,
        { name: "",role: "Member", capacity: 3 }
      ]
    }));
  };

  const removeMember = (index) => {
    if (formData.members.length === 1) return;
    
    setFormData(prev => ({
      ...prev,
      members: prev.members.filter((_, i) => i !== index)
    }));
  };

  const handleCreateTeam = (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      alert("Team name is required");
      return;
    }
    for (let i = 0; i < formData.members.length; i++) {
      const member = formData.members[i];
      if (!member.name.trim(), !member.role.trim()) {
        alert(`Please fill in all fields for member ${i + 1}`);
        return;
      }
    }

    createTeamMutation.mutate(formData);
  };

  const handleDeleteTeam = (teamId) => {
    deleteTeamMutation.mutate(teamId);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      members: [
        {
          name: user?.name || "",
          role: "Team Lead",
          capacity: 5
        }
      ]
    });
  };

  const closeModal = () => {
    setShowCreateModal(false);
    resetForm();
  };

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
            Failed to load teams
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
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Teams</h1>
            <p className="text-gray-600 mt-2">Manage your teams and members</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition duration-200 font-medium"
          >
            Create Team
          </button>
        </div>

        {teams.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">👥</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No teams yet</h3>
            <p className="text-gray-600 mb-6">Create your first team to get started</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition duration-200"
            >
              Create Team
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {teams.map((team) => (
              <div
                key={team._id}
                className="bg-white rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition duration-200"
              >
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-semibold text-gray-900 truncate">
                      {team.name}
                    </h3>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => navigateToTeamProjects(team._id)}
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                      >
                        Projects
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(team._id)}
                        className="text-red-600 hover:text-red-700 text-sm font-medium"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {team.description || 'No description provided'}
                  </p>
                  
                  <div className="space-y-3">
                    <div className="text-sm text-gray-700">
                      <span className="font-medium">{team.members?.length || 0}</span> members
                    </div>
                    
                    <div className="space-y-2">
                      {team.members?.slice(0, 3).map((member, index) => (
                        <div key={index} className="flex justify-between items-center text-sm">
                          <span className="font-medium text-gray-900">{member.name}</span>
                          <span className="text-gray-600 capitalize">{member.role}</span>
                          <span className="text-blue-600">Capacity: {member.capacity}</span>
                        </div>
                      ))}
                      {team.members?.length > 3 && (
                        <div className="text-sm text-gray-500">
                          +{team.members.length - 3} more members
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm text-gray-500 mt-4 pt-4 border-t border-gray-100">
                    <div>
                      Created: {new Date(team.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create Team Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">Create New Team</h2>
                  <button
                    onClick={closeModal}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <form onSubmit={handleCreateTeam}>
                  <div className="space-y-6">
                    {/* Team Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Team Name *
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter team name"
                      />
                    </div>

                    {/* Team Description */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description
                      </label>
                      <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        rows="3"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter team description"
                      />
                    </div>

                    {/* Team Members */}
                    <div>
                      <div className="flex justify-between items-center mb-4">
                        <label className="block text-sm font-medium text-gray-700">
                          Team Members *
                        </label>
                        <button
                          type="button"
                          onClick={addMember}
                          className="text-sm bg-green-600 text-white px-3 py-1 rounded-md hover:bg-green-700 transition duration-200"
                        >
                          Add Member
                        </button>
                      </div>

                      <div className="space-y-4">
                        {formData.members.map((member, index) => (
                          <div key={index} className="border border-gray-200 rounded-lg p-4">
                            <div className="flex justify-between items-center mb-3">
                              <h4 className="text-sm font-medium text-gray-700">
                                Member
                              </h4>
                              {formData.members.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => removeMember(index)}
                                  className="text-red-600 hover:text-red-700 text-sm"
                                >
                                  Remove
                                </button>
                              )}
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                              <div className="lg:col-span-2">
                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                  Name *
                                </label>
                                <input
                                  type="text"
                                  value={member.name}
                                  onChange={(e) => handleMemberChange(index, 'name', e.target.value)}
                                  required
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                                  placeholder="Member name"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                  Role *
                                </label>
                                <select
                                  value={member.role}
                                  onChange={(e) => handleMemberChange(index, 'role', e.target.value)}
                                  required
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                                >
                                  <option value="Project Manager(PM)</">Project Manager(PM)</option>
                                  <option value="Frontend Developer">Frontend Developer</option>
                                  <option value="Backend Developer">Backend Developer</option>
                                  <option value="Full-Stack Developer">Full-Stack Developer</option>
                                  <option value="QA / Test Engineer">QA / Test Engineer</option>
                                  <option value="UI/UX Designer">UI/UX Designer</option>
                                </select>
                              </div>
                              
                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                  Capacity *
                                </label>
                                <select
                                  value={member.capacity}
                                  onChange={(e) => handleMemberChange(index, 'capacity', parseInt(e.target.value))}
                                  required
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                                >
                                  {[1, 2, 3, 4, 5].map(num => (
                                    <option key={num} value={num}>
                                      {num} task{num !== 1 ? 's' : ''}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={closeModal}
                      className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition duration-200"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={createTeamMutation.isLoading}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition duration-200"
                    >
                      {createTeamMutation.isLoading ? "Creating..." : "Create Team"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <div className="text-center">
                <div className="text-red-500 text-6xl mb-4">⚠️</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Delete Team?
                </h3>
                <p className="text-gray-600 mb-6">
                  Are you sure you want to delete this team? This action cannot be undone.
                </p>
                <div className="flex justify-center space-x-3">
                  <button
                    onClick={() => setShowDeleteConfirm(null)}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleDeleteTeam(showDeleteConfirm)}
                    disabled={deleteTeamMutation.isLoading}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition duration-200"
                  >
                    {deleteTeamMutation.isLoading ? "Deleting..." : "Delete Team"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
    </ProtectedRoute>
  );
};

export default TeamsPage;