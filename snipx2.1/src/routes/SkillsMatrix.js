import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from "../AuthProvider";
import './SkillsMatrix.css';

const SkillsMatrix = () => {
    const { user } = useAuth();
    const [users, setUsers] = useState([]);
    const [teams, setTeams] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [selectedFilter, setSelectedFilter] = useState('Employees');
    const [skills, setSkills] = useState([]);
    const [userSkills, setUserSkills] = useState({});
    const [editingSkill, setEditingSkill] = useState(null);
    const [newSkill, setNewSkill] = useState("");
    const [companyId, setCompanyId] = useState(null);

    
    console.log("all skills:", skills);
    console.log("skills data global: ", userSkills)
    
    useEffect(() => {
        if (user) {
            fetchCompanyId(); // Fetch company ID when user is available
            fetchTeams();
            console.log("userID in useEffect", user.id)
            
        }
    }, [user]);

    useEffect(() => {
        if (companyId) {
            fetchSkills(); // Fetch skills only when companyId is available
            fetchUsers();

        }
    }, [companyId]);

    useEffect(() => {
        filterUsers();
    }, [selectedFilter, users, teams]);

    const fetchCompanyId = async () => {
        try {
            const response = await axios.get(`https://extension-360407.lm.r.appspot.com/api/users/${user.id}/company`, {
                headers: { "Authorization": `Bearer ${user.token}` },
            });
            console.log("companyID in fetchCompanyID:", response.data.companyId)
            setCompanyId(response.data.companyId);
        } catch (error) {
            console.error("Error fetching company ID:", error);
        }
    };

    const fetchTeams = async () => {
        try {
            const response = await axios.get(`https://extension-360407.lm.r.appspot.com/api/teams?userId=${user.id}`, {
                headers: { "Authorization": `Bearer ${user.token}` },
            });
            setTeams(response.data);
        } catch (error) {
            console.error("Error fetching teams:", error);
        }
    };

    const fetchUsers = async () => {
        try {
            const response = await axios.post("https://extension-360407.lm.r.appspot.com/api/company_users", user);
            setUsers(response.data);
            // Fetch user skills once users are loaded
            fetchUserSkills(response.data.map(user => user.id));
        } catch (error) {
            console.error("Error fetching users:", error);
        }
    };

    const fetchSkills = async () => {
        console.log("companyID in fetchSkills:", companyId)
        if (!companyId) return;
        try {
            console.log("getting skills...")
            const response = await axios.get(`https://extension-360407.lm.r.appspot.com/api/skills/${companyId}`, {
                headers: { "Authorization": `Bearer ${user.token}`},
            });
            console.log("got skills")
            setSkills(response.data);
        } catch (error) {
            console.error("Error fetching skills:", error);
        }
    };

    const fetchUserSkills = async (userIds) => {
        try {
            const userSkillsResponse = await Promise.all(userIds.map(userId =>
                axios.get(`https://extension-360407.lm.r.appspot.com/api/users/${userId}/ratings`, {
                    headers: { "Authorization": `Bearer ${user.token}` },
                })
            ));
            const skillsData = userSkillsResponse.reduce((acc, { data }, idx) => {
                acc[userIds[idx]] = data.reduce((skillAcc, rating) => {
                    skillAcc[rating.skill.id] = rating.score;
                    return skillAcc;
                }, {});
                return acc;
            }, {});
            console.log("userSkillsResponse: ", userSkillsResponse)
            console.log("skills data: ", skillsData)
            setUserSkills(skillsData);
        } catch (error) {
            console.error("Error fetching user skills:", error);
        }
    };

    const handleAddSkill = async () => {
        try {
            const response = await axios.post(
                "https://extension-360407.lm.r.appspot.com/api/skills",
                { skillName: newSkill, companyId },
                {
                    headers: { "Authorization": `Bearer ${user.token}` },
                }
            );
            const addedSkill = response.data;
            setSkills([...skills, addedSkill]);
            setNewSkill(""); // Clear input after adding
        } catch (error) {
            console.error("Error adding skill:", error);
        }
    };

    const handleSkillEdit = async (skillId, newTitle) => {
        try {
            await axios.put(
                `https://extension-360407.lm.r.appspot.com/api/skills/${skillId}`,
                { skillName: newTitle },
                {
                    headers: { "Authorization": `Bearer ${user.token}` },
                }
            );
            setSkills((prevSkills) =>
                prevSkills.map((skill) =>
                    skill.id === skillId ? { ...skill, title: newTitle } : skill
                )
            );
        } catch (error) {
            console.error("Error updating skill:", error);
        }
    };

    const handleUserSkillChange = async (userId, skillId, newScore) => {
        try {
            await axios.post(
                `https://extension-360407.lm.r.appspot.com/api/users/${userId}/ratings`,
                { skillId, score: parseInt(newScore) },
                {
                    headers: { "Authorization": `Bearer ${user.token}` },
                }
            );
            setUserSkills((prevSkills) => ({
                ...prevSkills,
                [userId]: {
                    ...prevSkills[userId],
                    [skillId]: newScore,
                },
            }));
        } catch (error) {
            console.error("Error updating user skill:", error);
        }
    };

    const filterUsers = () => {
        if (selectedFilter === 'Employees') {
            setFilteredUsers(users);
        } else {
            const team = teams.find(team => team.team_name === selectedFilter);
            if (team && team.teamMembers) {
                setFilteredUsers(users.filter(user => team.teamMembers.some(member => member.user_id === user.id)));
            } else {
                setFilteredUsers([]);
            }
        }
    };

    const calculateTotal = (skillId) => {
        let total = 0;
        filteredUsers.forEach((user) => {
            total += parseInt(userSkills[user.id]?.[skillId] || 0, 10);
        });
        return total;
    };

    const calculateAverage = (skillId) => {
        const total = calculateTotal(skillId);
        return (total / filteredUsers.length).toFixed(1);
    };

    const getCellBackgroundColor = (value) => {
        switch (value) {
            case '1':
                return '#FF4B55';  // Red
            case '2':
                return '#45B77D';  // Green
            case '3':
                return '#F98404';  // Orange
            case '4':
                return '#9046CF';  // Purple
            case '5':
                return '#d637bf';  // Pink
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
                        <th style={{ backgroundColor: '#007BFF', color: 'white' }}>
                            <select
                                value={selectedFilter}
                                onChange={(e) => setSelectedFilter(e.target.value)}
                                className="team-dropdown"
                            >
                                <option value="Employees">Employees</option>
                                {teams.map(team => (
                                    <option key={team.id} value={team.team_name}>{team.team_name}</option>
                                ))}
                            </select>
                        </th>
                        {skills.map((skill) => (
                            <th key={skill.id} style={{ backgroundColor: '#007BFF', color: 'white' }}>
                                {editingSkill === skill.id ? (
                                    <input
                                        type="text"
                                        value={skill.skill_name}
                                        onChange={(e) => handleSkillEdit(skill.id, e.target.value)}
                                        onBlur={() => setEditingSkill(null)}
                                    />
                                ) : (
                                    <span
                                        onClick={() => setEditingSkill(skill.id)}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        {skill.skill_name}
                                    </span>
                                )}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {filteredUsers.map((user) => (
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

            {/* Button to add a new skill */}
            <div>
                <input
                    type="text"
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    placeholder="Add new skill"
                />
                <button onClick={handleAddSkill}>Add Skill</button>
            </div>

            {/* Skill Level Captions */}
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