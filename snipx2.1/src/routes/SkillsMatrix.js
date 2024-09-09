import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from "../AuthProvider";
import './SkillsMatrix.css';

const SkillsMatrix = () => {
    const { user } = useAuth();
    const [users, setUsers] = useState([]);
    const [skills, setSkills] = useState([
        { id: 1, title: 'Management' },
        { id: 2, title: 'Planning' },
        { id: 3, title: 'Recruiting' },
        { id: 4, title: 'Web Development' },
        { id: 5, title: 'Excel Advanced' },
        { id: 6, title: 'Presentation Skills' },
        { id: 7, title: 'Safety Training' },
    ]);

    const [userSkills, setUserSkills] = useState({});
    const [editingSkill, setEditingSkill] = useState(null);

    useEffect(() => {
        fetchUsers();
    }, [user]);

    useEffect(() => {
        if (users.length > 0) {
            generateRandomScores(); // Generate random scores after users are fetched
        }
    }, [users]);

    const fetchUsers = async () => {
        try {
            const response = await fetch("https://extension-360407.lm.r.appspot.com/api/company_users", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(user),
            });
            const data = await response.json();
            setUsers(data);
        } catch (error) {
            console.error("Error fetching users:", error);
        }
    };

    const generateRandomScores = () => {
        const newUserSkills = {};
        users.forEach((user) => {
            newUserSkills[user.id] = {};
            skills.forEach((skill) => {
                newUserSkills[user.id][skill.id] = Math.floor(Math.random() * 5) + 1; // Random number between 1 and 5
            });
        });
        setUserSkills(newUserSkills);
    };

    const handleSkillEdit = (skillId, newTitle) => {
        setSkills((prevSkills) =>
            prevSkills.map((skill) =>
                skill.id === skillId ? { ...skill, title: newTitle } : skill
            )
        );
    };

    const handleUserSkillChange = (userId, skillId, newScore) => {
        setUserSkills((prevSkills) => ({
            ...prevSkills,
            [userId]: {
                ...prevSkills[userId],
                [skillId]: newScore,
            },
        }));
    };

    const calculateTotal = (skillId) => {
        let total = 0;
        users.forEach((user) => {
            total += parseInt(userSkills[user.id]?.[skillId] || 0, 10);
        });
        return total;
    };

    const calculateAverage = (skillId) => {
        const total = calculateTotal(skillId);
        return (total / users.length).toFixed(1);
    };

    const getCellBackgroundColor = (value) => {
        switch (value) {
            case '1':
            case 1:
                return '#FF4B55';  // Red
            case '2':
            case 2:
                return '#45B77D';  // Green
            case '3':
            case 3:
                return '#F98404';  // Orange
            case '4':
            case 4:
                return '#9046CF';  // Purple
            case '5':
            case 5:
                return '#d637bf';     // Pink
            default:
                return 'white'; // default background color
        }
    };

    return (
        <div className="skills-matrix-container">
            <h2 className="page-title">Skills Matrix</h2>

            <table className="skills-matrix-table">
                <thead>
                    <tr>
                        <th style={{ backgroundColor: '#007BFF', color: 'white' }}>Employees</th>
                        {skills.map((skill) => (
                            <th key={skill.id} style={{ backgroundColor: '#007BFF', color: 'white' }}>
                                {editingSkill === skill.id ? (
                                    <input
                                        type="text"
                                        value={skill.title}
                                        onChange={(e) => handleSkillEdit(skill.id, e.target.value)}
                                        onBlur={() => setEditingSkill(null)}
                                    />
                                ) : (
                                    <span
                                        onClick={() => setEditingSkill(skill.id)}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        {skill.title}
                                    </span>
                                )}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {users.map((user) => (
                        <tr key={user.id}>
                            <td>{user.email}</td>
                            {skills.map((skill) => (
                                <td
                                    key={skill.id}
                                    style={{
                                        backgroundColor: getCellBackgroundColor(userSkills[user.id]?.[skill.id]),
                                    }}
                                >
                                    <input
                                        type="number"
                                        value={userSkills[user.id]?.[skill.id] || ''}
                                        onChange={(e) =>
                                            handleUserSkillChange(user.id, skill.id, e.target.value)
                                        }
                                        min="1"
                                        max="5"
                                        style={{ width: '50px', textAlign: 'center' }}
                                    />
                                </td>
                            ))}
                        </tr>
                    ))}
                    {/* Total row */}
                    <tr>
                        <td><strong>Total</strong></td>
                        {skills.map((skill) => (
                            <td key={skill.id}>
                                <strong>{calculateTotal(skill.id)}</strong>
                            </td>
                        ))}
                    </tr>
                    {/* Average row */}
                    <tr>
                        <td><strong>Average</strong></td>
                        {skills.map((skill) => (
                            <td key={skill.id}>
                                <strong>{calculateAverage(skill.id)}</strong>
                            </td>
                        ))}
                    </tr>
                </tbody>
            </table>

            {/* Captions */}
            <div className="skills-matrix-captions">
                <div>
                    <span style={{ backgroundColor: '#FF4B55' }} className="caption-color"></span>
                    <span>1 - Training Required</span>
                </div>
                <div>
                    <span style={{ backgroundColor: '#45B77D' }} className="caption-color"></span>
                    <span>2 - Currently Trained</span>
                </div>
                <div>
                    <span style={{ backgroundColor: '#F98404' }} className="caption-color"></span>
                    <span>3 - Basic Complete</span>
                </div>
                <div>
                    <span style={{ backgroundColor: '#9046CF' }} className="caption-color"></span>
                    <span>4 - Skilled Enough</span>
                </div>
                <div>
                    <span style={{ backgroundColor: '#d637bf' }} className="caption-color"></span>
                    <span>5 - Can Coach</span>
                </div>
            </div>
        </div>
    );
};

export default SkillsMatrix;
