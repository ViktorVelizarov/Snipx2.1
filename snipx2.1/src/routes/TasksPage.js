import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../AuthProvider';
import './TaskPage.css'; // Assuming similar styling as your other pages

const TaskManagement = () => {
  const { user } = useAuth(); // Fetch the logged-in user's details
  const [companyId, setCompanyId] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]); // For storing users list
  const [selectedUsers, setSelectedUsers] = useState([]); // For storing selected users to assign
  const [selectedTaskId, setSelectedTaskId] = useState(null); // Task ID to which users will be assigned
  const [newTaskName, setNewTaskName] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskType, setNewTaskType] = useState('');
  const [loading, setLoading] = useState(false);

  console.log("users:", users)

  // Fetch the company ID of the logged-in user
  useEffect(() => {
    const fetchCompanyId = async () => {
      try {
        const response = await axios.get(`https://extension-360407.lm.r.appspot.com/api/users/${user.id}/company`, {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        setCompanyId(response.data.companyId);
      } catch (error) {
        console.error('Error fetching company ID:', error);
      }
    };

    if (user) {
      fetchCompanyId();
    }
  }, [user]);

  // Fetch all tasks for the user's company
  useEffect(() => {
    const fetchTasks = async () => {
      if (!companyId) return;

      try {
        const response = await axios.get(`https://extension-360407.lm.r.appspot.com/api/tasks/${companyId}`, {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        setTasks(response.data);
      } catch (error) {
        console.error('Error fetching tasks:', error);
      }
    };

    fetchTasks();
  }, [companyId, user]);

  // Fetch all users in the company
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axios.post("https://extension-360407.lm.r.appspot.com/api/company_users", user, {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        setUsers(response.data);
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };

    if (companyId) {
      fetchUsers();
    }
  }, [companyId, user]);

  // Handle new task creation
  const createTask = async () => {
    if (!newTaskName || !companyId) {
      alert('Task name and company ID are required.');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(
        'https://extension-360407.lm.r.appspot.com/api/tasks',
        {
          task_name: newTaskName,
          task_description: newTaskDesc,
          task_type: newTaskType,
          company_id: companyId,
        },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );

      alert('Task created successfully!');
      setNewTaskName('');
      setNewTaskDesc('');
      setNewTaskType('');

      // Refresh the task list after creating a new task
      const updatedTasks = await axios.get(`https://extension-360407.lm.r.appspot.com/api/tasks/${companyId}`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      setTasks(updatedTasks.data);
    } catch (error) {
      console.error('Error creating task:', error);
      alert('Failed to create task.');
    } finally {
      setLoading(false);
    }
  };

  // Handle task deletion
  const deleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;

    try {
      await axios.delete(`https://extension-360407.lm.r.appspot.com/api/tasks/${taskId}`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });

      // Remove the deleted task from the state
      setTasks((prevTasks) => prevTasks.filter((task) => task.id !== taskId));
      alert('Task deleted successfully!');
    } catch (error) {
      console.error('Error deleting task:', error);
      alert('Failed to delete task.');
    }
  };

  // Handle user selection for task assignment
  const handleUserSelection = (userId) => {
    setSelectedUsers((prevSelected) => {
      if (prevSelected.includes(userId)) {
        return prevSelected.filter((id) => id !== userId);
      } else {
        return [...prevSelected, userId];
      }
    });
  };

  // Handle assigning selected users to the selected task
  const assignUsersToTask = async (taskId) => {
    if (!selectedUsers.length) {
      alert('No users selected.');
      return;
    }

    try {
      await axios.post(
        'https://extension-360407.lm.r.appspot.com/api/tasks/assign-users',
        { task_id: taskId, user_ids: selectedUsers },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );

      alert('Users assigned successfully!');
      setSelectedUsers([]);
    } catch (error) {
      console.error('Error assigning users to task:', error);
      alert('Failed to assign users.');
    }
  };

  return (
    <div className="task-management-container">
      <h1 className="page-title">Manage Tasks</h1>
      <div className="task-list">
        {tasks.length > 0 ? (
          tasks.map((task) => (
            <div key={task.id} className="task-item">
              <h3>{task.task_name}</h3>
              <p>{task.task_description}</p>
              <p><strong>Type:</strong> {task.task_type}</p>
              <p><strong>Created At:</strong> {new Date(task.created_at).toLocaleString()}</p>
              <button className="delete-task-button" onClick={() => deleteTask(task.id)}>Delete Task</button>
              
              {/* Assign users to this task */}
              <div className="assign-users-section">
                <h4>Assign Users to Task</h4>
                <select multiple value={selectedUsers} onChange={(e) => handleUserSelection(e.target.value)}>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>{user.name}</option>
                  ))}
                </select>
                <button className="assign-users-button" onClick={() => assignUsersToTask(task.id)}>
                  Assign Selected Users
                </button>
              </div>
            </div>
          ))
        ) : (
          <p>No tasks available for this company.</p>
        )}
      </div>

      <div className="create-task-form">
        <h2>Create New Task</h2>
        <input
          type="text"
          placeholder="Task Name"
          value={newTaskName}
          onChange={(e) => setNewTaskName(e.target.value)}
          className="task-input"
        />
        <textarea
          placeholder="Task Description"
          value={newTaskDesc}
          onChange={(e) => setNewTaskDesc(e.target.value)}
          className="task-textarea"
        />
        <input
          type="text"
          placeholder="Task Type"
          value={newTaskType}
          onChange={(e) => setNewTaskType(e.target.value)}
          className="task-input"
        />
        <button className="create-task-button" onClick={createTask} disabled={loading}>
          {loading ? 'Creating Task...' : 'Create Task'}
        </button>
      </div>
    </div>
  );
};

export default TaskManagement;
