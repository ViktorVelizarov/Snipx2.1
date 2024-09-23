import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../AuthProvider';
import './TaskPage.css'; // Assuming similar styling as your other pages

const TaskManagement = () => {
  const { user } = useAuth(); // Fetch the logged-in user's details
  const [companyId, setCompanyId] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [newTaskName, setNewTaskName] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskType, setNewTaskType] = useState('');
  const [loading, setLoading] = useState(false);

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
