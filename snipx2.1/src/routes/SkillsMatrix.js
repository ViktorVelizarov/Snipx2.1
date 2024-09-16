import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from "../AuthProvider";
import './SkillsMatrix.css';
import Modal from 'react-modal';
import { FaTrashAlt } from "react-icons/fa";

const SkillsMatrix = () => {
    const { user } = useAuth();
    const [users, setUsers] = useState([]);
    const [teams, setTeams] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [selectedFilter, setSelectedFilter] = useState('Employees');
    const [skills, setSkills] = useState([]);
    const [userSkills, setUserSkills] = useState({});
    const [editingSkill, setEditingSkill] = useState(null);
    const [newSkill, setNewSkill] = useState({ skill_name: "", descriptions: ["", "", "", "", ""] });
    const [companyId, setCompanyId] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalSkillDescriptions, setModalSkillDescriptions] = useState(["", "", "", "", ""]);
    const [modalSkillName, setModalSkillName] = useState("");

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
                headers: { "Authorization": `Bearer ${user.token}` },
            });
            console.log("skills fetched:", response.data);
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
                        // Ensure score is a number
                        skillAcc[rating.skill.id] = parseInt(rating.score, 10);
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
            const { skill_name, descriptions } = newSkill;
            const response = await axios.post(
                "https://extension-360407.lm.r.appspot.com/api/skills",
                { skillName: skill_name, companyId, desc1: descriptions[0], desc2: descriptions[1], desc3: descriptions[2], desc4: descriptions[3], desc5: descriptions[4] },
                {
                    headers: { "Authorization": `Bearer ${user.token}` },
                }
            );
            const addedSkill = response.data;
            setSkills([...skills, addedSkill]);
            setNewSkill({ skill_name: "", descriptions: ["", "", "", "", ""] });
        } catch (error) {
            console.error("Error adding skill:", error);
        }
    };

    const handleOpenModal = (skill) => {
        setModalSkillName(skill.skill_name);
        setModalSkillDescriptions([skill.desc1, skill.desc2, skill.desc3, skill.desc4, skill.desc5]);
        setEditingSkill(skill.id);
        setIsModalOpen(true);
    };

    const handleSaveSkillDescriptions = async () => {
        try {
            await axios.put(
                `https://extension-360407.lm.r.appspot.com/api/skills/${editingSkill}`,
                { skillName: modalSkillName, desc1: modalSkillDescriptions[0], desc2: modalSkillDescriptions[1], desc3: modalSkillDescriptions[2], desc4: modalSkillDescriptions[3], desc5: modalSkillDescriptions[4] },
                {
                    headers: { "Authorization": `Bearer ${user.token}` },
                }
            );
            setSkills((prevSkills) =>
                prevSkills.map((skill) =>
                    skill.id === editingSkill
                        ? { ...skill, skill_name: modalSkillName, desc1: modalSkillDescriptions[0], desc2: modalSkillDescriptions[1], desc3: modalSkillDescriptions[2], desc4: modalSkillDescriptions[3], desc5: modalSkillDescriptions[4] }
                        : skill
                )
            );
            setIsModalOpen(false);
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
                { skillId, score: parseInt(newScore, 10) },
                {
                    headers: { "Authorization": `Bearer ${user.token}` },
                }
            );
            setUserSkills((prevSkills) => ({
                ...prevSkills,
                [userId]: {
                    ...prevSkills[userId],
                    [skillId]: parseInt(newScore, 10),
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
        // Ensure value is a number
        switch (value) {
            case 1:
                return '#FF4B55';  // Red
            case 2:
                return '#45B77D';  // Green
            case 3:
                return '#F98404';  // Orange
            case 4:
                return '#9046CF';  // Purple
            case 5:
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
                                <span
                                    onClick={() => handleOpenModal(skill)}
                                    style={{ cursor: 'pointer' }}
                                >
                                    {skill.skill_name}
                                </span>
                                <button className='trash-can'
                                    onClick={() => handleDeleteSkill(skill.id)}
                                >
                                    <FaTrashAlt />
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

            {/* Modal for skill descriptions */}
            <Modal
                isOpen={isModalOpen}
                onRequestClose={() => setIsModalOpen(false)}
                contentLabel="Skill Descriptions Modal"
                style={{
                    content: {
                        top: '50%',
                        left: '50%',
                        right: 'auto',
                        bottom: 'auto',
                        transform: 'translate(-50%, -50%)',
                        width: '440px',
                        height: 'auto',
                        padding: '20px',
                        overflow: 'auto',
                    },
                    overlay: {
                        backgroundColor: 'rgba(0, 0, 0, 0.75)' // Darken background
                    }
                }}
            >
                <h2>Edit Skill Descriptions</h2>
                <div>
                    <label>Skill Name</label>
                    <input
                        type="text"
                        value={modalSkillName}
                        style={{
                            width: '95%'
                        }}
                        onChange={(e) => setModalSkillName(e.target.value)}
                    />
                </div>
                {modalSkillDescriptions.map((desc, index) => (
                    <div key={index}>
                        <label>{`Description ${index + 1}`}</label>
                        <input
                            type="text"
                            value={desc}
                            style={{
                                width: '95%'
                            }}
                            onChange={(e) => {
                                const updatedDescriptions = [...modalSkillDescriptions];
                                updatedDescriptions[index] = e.target.value;
                                setModalSkillDescriptions(updatedDescriptions);
                            }}
                        />
                    </div>
                ))}
                <button onClick={handleSaveSkillDescriptions}>Save</button>
            </Modal>

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
