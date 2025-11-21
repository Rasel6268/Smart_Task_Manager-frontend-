'use client'

import React from 'react';

const demoData = {
  totalProjects: 5,
  totalTasks: 20,
  teams: [
    { name: 'Riya', role: 'Designer', tasks: 4, capacity: 3 },
    { name: 'Farhan', role: 'Developer', tasks: 2, capacity: 5 },
    { name: 'Sara', role: 'QA', tasks: 3, capacity: 3 },
  ],
  recentReassignments: [
    { time: '10:30 AM', task: 'UI Design', from: 'Riya', to: 'Farhan' },
    { time: '09:45 AM', task: 'Backend API', from: 'Farhan', to: 'Sara' },
    { time: '09:00 AM', task: 'Testing', from: 'Sara', to: 'Farhan' },
  ]
};

const Dashboard = () => {
  const { totalProjects, totalTasks, teams, recentReassignments } = demoData;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Smart Task Manager Dashboard</h1>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="bg-white shadow rounded-lg p-4">
          <p className="text-gray-500">Total Projects</p>
          <p className="text-2xl font-bold">{totalProjects}</p>
        </div>
        <div className="bg-white shadow rounded-lg p-4">
          <p className="text-gray-500">Total Tasks</p>
          <p className="text-2xl font-bold">{totalTasks}</p>
        </div>
        <div className="bg-white shadow rounded-lg p-4">
          <p className="text-gray-500">Reassign Tasks</p>
          <button className="mt-2 w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700">
            Reassign Tasks
          </button>
        </div>
      </div>

      {/* Team Summary */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Team Summary</h2>
        <div className="overflow-x-auto">
          <table className="w-full table-auto">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-4 py-2 text-left">Member</th>
                <th className="px-4 py-2 text-left">Role</th>
                <th className="px-4 py-2 text-left">Tasks / Capacity</th>
              </tr>
            </thead>
            <tbody>
              {teams.map((member) => (
                <tr key={member.name} className="border-b">
                  <td className="px-4 py-2">{member.name}</td>
                  <td className="px-4 py-2">{member.role}</td>
                  <td className={`px-4 py-2 font-bold ${member.tasks > member.capacity ? 'text-red-600' : ''}`}>
                    {member.tasks} / {member.capacity}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Reassignments */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Recent Reassignments</h2>
        <ul className="space-y-2">
          {recentReassignments.map((log, index) => (
            <li key={index} className="border-b pb-2">
              <span className="text-gray-500 mr-2">{log.time} —</span>
              Task <span className="font-semibold">{log.task}</span> reassigned from <span className="font-semibold">{log.from}</span> to <span className="font-semibold">{log.to}</span>.
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Dashboard;
