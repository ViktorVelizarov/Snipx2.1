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
    const [newSkill, setNewSkill] = useState({ skill_name: "", descriptions: [""] });
    const [companyId, setCompanyId] = useState(null);

    useEffect(() => {
        if (user) {
            fetchCompanyId();
            fetchTeams();
        }
    }, [user]);

    useEffect(() => {
        if (companyId) {
            fetchSkills();
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
            fetchUserSkills(response.data.map(user => user.id));
        } catch (error) {
            console.error("Error fetching users:", error);
        }
    };

    const fetchSkills = async () => {
        if (!companyId) return;
        try {
            const response = await axios.get(`https://extension-360407.lm.r.appspot.com/api/skills/${companyId}`, {
                headers: { "Authorization": `Bearer ${user.token}`},
            });
            console.log("skills fetched:", response.data)
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
                    if (rating.skill && rating.skill.id) {
                        skillAcc[rating.skill.id] = rating.score;
                    }
                    return skillAcc;
                }, {});
                return acc;
            }, {});
    
            setUserSkills(skillsData);
        } catch (error) {
            console.error("Error fetching user skills:", error);
        }
    };

    const handleNewSkillDescriptionChange = (index, value) => {
        setNewSkill((prev) => {
            const newDescriptions = [...prev.descriptions];
            newDescriptions[index] = value;
            return { ...prev, descriptions: newDescriptions };
        });
    };

    const handleAddSkill = async () => {
        try {
            const response = await axios.post(
                "https://extension-360407.lm.r.appspot.com/api/skills",
                { ...newSkill, companyId },
                {
                    headers: { "Authorization": `Bearer ${user.token}` },
                }
            );
            const addedSkill = response.data;
            setSkills([...skills, addedSkill]);
            setNewSkill({ skill_name: "", descriptions: [""] });
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
                    skill.id === skillId ? { ...skill, skill_name: newTitle } : skill
                )
            );
        } catch (error) {
            console.error("Error updating skill:", error);
        }
    };

    const handleSkillDescriptionEdit = async (skillId, descIndex, newDescription) => {
        try {
            const skillToUpdate = skills.find(skill => skill.id === skillId);
            if (skillToUpdate) {
                const updatedDescriptions = [...skillToUpdate.descriptions];
                updatedDescriptions[descIndex] = newDescription;

                await axios.put(
                    `https://extension-360407.lm.r.appspot.com/api/skills/${skillId}`,
                    { descriptions: updatedDescriptions },
                    {
                        headers: { "Authorization": `Bearer ${user.token}` },
                    }
                );

                setSkills((prevSkills) =>
                    prevSkills.map((skill) =>
                        skill.id === skillId
                            ? { ...skill, descriptions: updatedDescriptions }
                            : skill
                    )
                );
            }
        } catch (error) {
            console.error("Error updating skill descriptions:", error);
        }
    };

    const handleDeleteSkill = async (skillId) => {
        try {
            await axios.delete(`https://extension-360407.lm.r.appspot.com/api/skills/${skillId}`, {
                headers: { "Authorization": `Bearer ${user.token}` },
            });
            setSkills(skills.filter(skill => skill.id !== skillId));
        } catch (error) {
            console.error("Error deleting skill:", error);
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
                title={(Object.keys(skill).filter(key => key.startsWith('desc')).map(key => skill[key]) ?? []).join(', ')}
            >
                {skill.skill_name}
            </span>
        )}
        <button
            onClick={() => handleDeleteSkill(skill.id)}
            style={{ marginLeft: '10px', cursor: 'pointer', backgroundColor: 'red', color: 'white' }}
        >
            Delete
        </button>
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
                    <tr>
                        <td>Total</td>
                        {skills.map((skill) => (
                            <td key={skill.id}>{calculateTotal(skill.id)}</td>
                        ))}
                    </tr>
                    <tr>
                        <td>Average</td>
                        {skills.map((skill) => (
                            <td key={skill.id}>{calculateAverage(skill.id)}</td>
                        ))}
                    </tr>
                </tbody>
            </table>

            <div>
                <input
                    type="text"
                    value={newSkill.skill_name}
                    onChange={(e) => setNewSkill((prev) => ({ ...prev, skill_name: e.target.value }))}
                    placeholder="Add new skill"
                />
                {newSkill.descriptions.map((desc, index) => (
                    <input
                        key={index}
                        type="text"
                        value={desc}
                        onChange={(e) => handleNewSkillDescriptionChange(index, e.target.value)}
                        placeholder={`Description ${index + 1}`}
                    />
                ))}
                <button onClick={handleAddSkill}>Add Skill</button>
            </div>

            <div className="skill-level-captions">
                <p><span style={{ color: '#FF4B55' }}>●</span> Low Skill (1)</p>
                <p><span style={{ color: '#45B77D' }}>●</span> Competent (2)</p>
                <p><span style={{ color: '#F98404' }}>●</span> Experienced (3)</p>
                <p><span style={{ color: '#9046CF' }}>●</span> Expert (4)</p>
                <p><span style={{ color: '#d637bf' }}>●</span> Master (5)</p>
            </div>
        </div>
    );
};

export default SkillsMatrix;
