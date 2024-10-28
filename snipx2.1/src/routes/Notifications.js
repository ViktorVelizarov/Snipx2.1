import React, { useState, useEffect } from "react";
import './Notifications.css'; 
import { useAuth } from "../AuthProvider";
import axios from 'axios';

function UserSkillHoursAndNotifications() {
    const [userSkillHours, setUserSkillHours] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const { user } = useAuth();

    // Function to fetch user skill hours
    const fetchUserSkillHours = async () => {
        try {
            const response = await axios.post("https://extension-360407.lm.r.appspot.com/api/user-skill-hours", user);
            console.log('Received user skill hours:', response.data);
                setUserSkillHours(response.data);
          }  catch (error) {
            console.error("Error fetching user skill hours:", error);
        }
    };
    
    
    // Function to fetch notifications
    const fetchNotifications = async () => {
        try {
            const response = await axios.post("https://extension-360407.lm.r.appspot.com/api/notifications", user);
            console.log('Received notifications:', response.data);
            setNotifications(response.data);
          } 
       catch (error) {
            console.error("Error fetching notifications:", error);
        }
    };

    // Function to handle approving a notification
    const handleApprove = async (id) => {
        const confirmed = window.confirm("Are you sure you want to approve this notification?");
        if (confirmed) {
            try {
                const response = await fetch(`https://extension-360407.lm.r.appspot.com/api/notification/${id}`, {
                    method: "DELETE",
                });
                if (response.ok) {
                    fetchNotifications(); // Refresh notifications
                } else {
                    console.error("Failed to approve notification");
                }
            } catch (error) {
                console.error("Error approving notification:", error);
            }
        }
    };

    // Fetch user skill hours and notifications on component mount
    useEffect(() => {
        fetchUserSkillHours();
        fetchNotifications();
    }, []);

    return (
        <div className="container">
            <h1 className="page-title">User Skill Hours and Notifications</h1>

            {/* User Skill Hours Table */}
            <h2 className="table-title">User Skill Hours</h2>
            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>User ID</th>
                            <th>Skill ID</th>
                            <th>Hours</th>
                        </tr>
                    </thead>
                    <tbody>
                        {userSkillHours.map((record) => (
                            <tr key={record.id}>
                                <td>{record.id}</td>
                                <td>{record.user.email}</td>
                                <td>{record.skill.skill_name}</td>
                                <td>{record.hours}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Notifications Table */}
            <h2 className="table-title">Notifications</h2>
            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>User ID</th>
                            <th>Skill ID</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {notifications.map((notification) => (
                            <tr key={notification.id}>
                                <td>{notification.id}</td>
                                <td>{notification.user.email}</td>
                                <td>{notification.skill.skill_name}</td>
                                <td>
                                    {!notification.approved && (
                                        <button 
                                            onClick={() => handleApprove(notification.id)} 
                                            className="approve-button"
                                        >
                                            Approve
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default UserSkillHoursAndNotifications;
