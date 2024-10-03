import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../AuthProvider';
import './TasksPage.css'; // Corrected styling with new design

const TaskManagement = () => {
  const { user } = useAuth(); 
  const [companyId, setCompanyId] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [skills, setSkills] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [skillScore, setSkillScore] = useState(0);
  const [newTaskName, setNewTaskName] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskType, setNewTaskType] = useState('');
  const [newTaskEndsAt, setNewTaskEndsAt] = useState('');
  const [loading, setLoading] = useState(false);

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
    if (user) fetchCompanyId();
  }, [user]);

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
    if (companyId) fetchUsers();
  }, [companyId, user]);

  useEffect(() => {
    const fetchSkills = async () => {
      try {
        // Fetch skills that are not associated with a company
        const skillsNoCompanyResponse = await axios.get(
          'https://extension-360407.lm.r.appspot.com/api/skills-no-company',
          { headers: { Authorization: `Bearer ${user.token}` } }
        );
        // Fetch skills that are associated with the user's company
        const companySkillsResponse = await axios.get(
          `https://extension-360407.lm.r.appspot.com/api/skills/${companyId}`,
          { headers: { Authorization: `Bearer ${user.token}` } }
        );
        // Combine skills from both responses
        const combinedSkills = [...skillsNoCompanyResponse.data, ...companySkillsResponse.data];
        
        // Set the combined skills
        setSkills(combinedSkills);
      } catch (error) {
        console.error('Error fetching skills:', error);
      }
    };
    fetchSkills();
  }, [companyId, user]);

  const createTask = async () => {
    if (!newTaskName || !companyId || !newTaskEndsAt) {
      alert('Task name and company ID are required.');
      return;
    }
    setLoading(true);
    try {
      await axios.post(
        'https://extension-360407.lm.r.appspot.com/api/tasks',
        {
          task_name: newTaskName,
          task_description: newTaskDesc,
          task_type: newTaskType,
          company_id: companyId,
          endsAt: newTaskEndsAt,
        },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      alert('Task created successfully!');
      setNewTaskName('');
      setNewTaskDesc('');
      setNewTaskType('');
      setNewTaskEndsAt('');
      const updatedTasks = await axios.get(`https://extension-360407.lm.r.appspot.com/tasks/${companyId}`, {
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

  const deleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      await axios.delete(`https://extension-360407.lm.r.appspot.com/api/tasks/${taskId}`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      setTasks((prevTasks) => prevTasks.filter((task) => task.id !== taskId));
      alert('Task deleted successfully!');
    } catch (error) {
      console.error('Error deleting task:', error);
      alert('Failed to delete task.');
    }
  };

  const handleUserSelection = (userId) => {
    setSelectedUsers((prevSelected) => {
      if (prevSelected.includes(userId)) {
        return prevSelected.filter((id) => id !== userId);
      } else {
        return [...prevSelected, userId];
      }
    });
  };

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

  const handleSkillSelection = (skillId) => {
    setSelectedSkills((prevSelected) => {
      if (prevSelected.includes(skillId)) {
        return prevSelected.filter((id) => id !== skillId);
      } else {
        return [...prevSelected, skillId];
      }
    });
  };

  const assignSkillsToTask = async (taskId) => {
    if (!selectedSkills.length || !skillScore) {
      alert('No skills or score selected.');
      return;
    }
    try {
      await axios.post(
        `https://extension-360407.lm.r.appspot.com/api/tasks/${taskId}/assign-skills`,
        {
          skill_ids: selectedSkills,
          score: skillScore,
        },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      alert('Skills assigned successfully!');
      setSelectedSkills([]);
      setSkillScore(0);
    } catch (error) {
      console.error('Error assigning skills to task:', error);
      alert('Failed to assign skills.');
    }
  };

  return (
    <div className="task-management-container">
      <h1 className="page-title">Manage Tasks</h1>

      <div className="create-task-section">
        <h2>Create New Task</h2>
        <input 
          type="text" 
          placeholder="Task Name" 
          value={newTaskName} 
          onChange={(e) => setNewTaskName(e.target.value)} 
        />
        <textarea 
          placeholder="Task Description" 
          value={newTaskDesc} 
          onChange={(e) => setNewTaskDesc(e.target.value)} 
        />
        <input 
          type="text" 
          placeholder="Task Type" 
          value={newTaskType} 
          onChange={(e) => setNewTaskType(e.target.value)} 
        />
        <input 
          type="datetime-local" 
          placeholder="Ends At" 
          value={newTaskEndsAt} 
          onChange={(e) => setNewTaskEndsAt(e.target.value)} 
        />
        <button onClick={createTask} disabled={loading}>{loading ? 'Creating...' : 'Create Task'}</button>
      </div>
      
      <div className="task-list">
        {tasks.length > 0 ? (
          tasks.map((task) => (
            <div key={task.id} className="task-item">
              <h3>{task.task_name}</h3>
              <p>{task.task_description}</p>
              <p><strong>Type:</strong> {task.task_type}</p>
              <p><strong>Created At:</strong> {new Date(task.created_at).toLocaleString()}</p>
              <p><strong>Assigned Users:</strong> {task.hasUsersAssigned ? 'Yes' : 'No'}</p>
              <p><strong>Assigned Skills:</strong> 
                {task.taskSkills && task.taskSkills.length > 0
                  ? task.taskSkills.map(skill => skill.skill_id).join(', ')
                  : 'No skills assigned'}
              </p>
              <button className="delete-task-button" onClick={() => deleteTask(task.id)}>Delete Task</button>

              <div className="assign-users-section">
                <h4>Assign Users to Task</h4>
                <select multiple value={selectedUsers} onChange={(e) => handleUserSelection(e.target.value)}>
                  {users.map((user) => {
                    const isAssigned = task.assignedUsers.some(assignedUser => assignedUser.user_id === user.id);
                    return (
                      <option key={user.id} value={user.id} disabled={isAssigned}>
                        {user.email} {isAssigned ? '(Already Assigned)' : ''}
                      </option>
                    );
                  })}
                </select>
                <button className="assign-users-button" onClick={() => assignUsersToTask(task.id)}>Assign Users</button>
              </div>

              <div className="assign-skills-section">
                <h4>Assign Skills to Task</h4>
                <select multiple value={selectedSkills} onChange={(e) => handleSkillSelection(e.target.value)}>
                  {skills.map((skill) => {
                    const isAssigned = task.taskSkills.some(taskSkill => taskSkill.skill_id === skill.id);
                    return (
                      <option key={skill.id} value={skill.id} disabled={isAssigned}>
                        {skill.skill_name} {isAssigned ? '(Already Assigned)' : ''}
                      </option>
                    );
                  })}
                </select>
                <input 
                  type="number" 
                  placeholder="Enter score" 
                  value={skillScore} 
                  onChange={(e) => setSkillScore(Number(e.target.value))}
                />
                <button className="assign-skills-button" onClick={() => assignSkillsToTask(task.id)}>Assign Skills</button>
              </div>
            </div>
          ))
        ) : (
          <p>No tasks available.</p>
        )}
      </div>
    </div>
  );
};

export default TaskManagement;
