import React, { useState, useEffect } from "react";
import './Teams.css';
import { useAuth } from "../AuthProvider";

function Teams() {
    const [teams, setTeams] = useState([]);
    const [newTeamName, setNewTeamName] = useState("");
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [userSearchTerm, setUserSearchTerm] = useState("");
    const [users, setUsers] = useState([]);
    const [editingTeam, setEditingTeam] = useState(null);  // Track the team being edited
    const { user } = useAuth();

    // Function to fetch teams
    const fetchTeams = async () => {
        try {
            const response = await fetch(`https://extension-360407.lm.r.appspot.com/api/teams?userId=${user.id}`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${user.token}`
                }
            });

            const data = await response.json();
            const formattedTeams = data.map(team => ({
                ...team,
                average_score: parseFloat(team.average_score.toFixed(1))
            }));

            setTeams(formattedTeams);
        } catch (error) {
            console.error("Error fetching teams:", error);
        }
    };

    // Function to fetch users
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

    useEffect(() => {
        fetchTeams();
        fetchUsers();
    }, [user]);

    const filteredUsers = users.filter(user =>
        user.email.toLowerCase().includes(userSearchTerm.toLowerCase())
    );

    // Function to handle creating a new team
    const handleCreateTeam = async () => {
        try {
            const response = await fetch("https://extension-360407.lm.r.appspot.com/api/teams", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    teamName: newTeamName,
                    userIds: selectedUsers,
                    currentUserId: user.id,
                }),
            });
            if (response.ok) {
                await fetchTeams();
                setNewTeamName("");
                setSelectedUsers([]);
            } else {
                console.error("Failed to create team");
            }
        } catch (error) {
            console.error("Error creating team:", error);
        }
    };

    // Function to handle editing a team
    const handleEditTeam = async () => {
        try {
            const response = await fetch(`https://extension-360407.lm.r.appspot.com/api/teams/${editingTeam.id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    team_name: newTeamName,
                    userIds: selectedUsers,
                }),
            });
            if (response.ok) {
                await fetchTeams();
                setEditingTeam(null);  // Reset after editing
                setNewTeamName("");
                setSelectedUsers([]);
            } else {
                console.error("Failed to edit team");
            }
        } catch (error) {
            console.error("Error editing team:", error);
        }
    };

    // Function to handle deleting a team
    const handleDeleteTeam = async (teamId) => {
        try {
            const response = await fetch(`https://extension-360407.lm.r.appspot.com/api/teams/${teamId}`, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                },
            });
            if (response.ok) {
                await fetchTeams();  // Refresh teams after deletion
            } else {
                console.error("Failed to delete team");
            }
        } catch (error) {
            console.error("Error deleting team:", error);
        }
    };

    // MultiSelectUsers component
    const MultiSelectUsers = ({ selectedUsers, setSelectedUsers }) => (
        <div className="multi-select-container">
            <div className="multi-select scrollable">
                {filteredUsers.map(user => (
                    <div
                        key={user.id}
                        className={`multi-select-item ${selectedUsers.includes(user.id) ? 'selected' : ''}`}
                        onClick={() => {
                            if (selectedUsers.includes(user.id)) {
                                setSelectedUsers(selectedUsers.filter(id => id !== user.id));
                            } else {
                                setSelectedUsers([...selectedUsers, user.id]);
                            }
                        }}
                    >
                        {user.email}
                    </div>
                ))}
            </div>
        </div>
    );

    return (
        <div className="teams-container">
            <h1 className="page-title">Teams</h1>

            {/* New/Edit Team Form */}
            <div className="new-team-form">
                <h2 className="form-title">{editingTeam ? "Edit Team" : "Add Team"}</h2>
                <div className="team-creation-grid">
                    <div className="input-and-its-title">
                        <label className="input-title">Team Name:</label>
                        <input
                            type="text"
                            placeholder="Team name..."
                            value={newTeamName}
                            onChange={(e) => setNewTeamName(e.target.value)}
                            className="input-field"
                        />
                    </div>

                    <div className="input-and-its-title">
                        <label className="input-title">Filter Users:</label>
                        <input
                            type="text"
                            placeholder="Search users..."
                            value={userSearchTerm}
                            onChange={(e) => setUserSearchTerm(e.target.value)}
                            className="input-field"
                        />
                    </div>

                    <MultiSelectUsers
                        selectedUsers={selectedUsers}
                        setSelectedUsers={setSelectedUsers}
                    />

                    <div className="button-group">
                        <button className="clear-button" onClick={() => setSelectedUsers([])}>Clear All</button>
                        <button className="select-all-button" onClick={() => setSelectedUsers(filteredUsers.map(user => user.id))}>Select All</button>
                    </div>

                    <div className="button-group">
                        {editingTeam ? (
                            <button onClick={handleEditTeam} className="teams-create-button">Update</button>
                        ) : (
                            <button onClick={handleCreateTeam} className="teams-create-button">Create</button>
                        )}
                    </div>
                </div>
            </div>

            {/* Teams Table */}
            <div className="teams-table">
                <table>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Team Name</th>
                            <th>Members</th>
                            <th>Average Score</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {teams.map((team) => (
                            <tr key={team.id}>
                                <td>{team.id}</td>
                                <td>{team.team_name}</td>
                                <td>{team.teamMembers.map(member => users.find(user => user.id === member.user_id)?.email || "Unknown").join(", ")}</td>
                                <td>{team.average_score.toFixed(1)}</td>
                                <td>
                                    <button className="edit-button" onClick={() => {
                                        setEditingTeam(team);
                                        setNewTeamName(team.team_name);
                                        setSelectedUsers(team.teamMembers.map(member => member.user_id));
                                    }}>Edit</button>
                                    <button className="delete-button" onClick={() => handleDeleteTeam(team.id)}>Delete</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default Teams;
