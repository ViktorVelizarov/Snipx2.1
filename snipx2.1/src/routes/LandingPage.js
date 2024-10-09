import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFlag } from '@fortawesome/free-solid-svg-icons';
import { Line } from 'react-chartjs-2';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './LandingPage.css';
import { useAuth } from "../AuthProvider";
import axios from 'axios';
import 'chartjs-plugin-trendline';

const Home = () => {
  const { user, setUser } = useAuth();
  const { isDarkMode } = useOutletContext();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [averageScore, setAverageScore] = useState(7.4);
  const [chartData, setChartData] = useState({
    labels: [],
    datasets: [],
  });
  const [overviewData, setOverviewData] = useState([]);
  const [skills, setSkills] = useState([]);
  const [userSkills, setUserSkills] = useState({});
  const [showTrendline, setShowTrendline] = useState(false); // State to toggle trendline
  const chartRef = useRef(null);
  const [snippets, setSnippets] = useState([]);
  const navigate = useNavigate();

  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imageFile, setImageFile] = useState(null);

  useEffect(() => {
    const fetchAllSnippets = async () => {
      try {
        const response = await axios.post("https://extension-360407.lm.r.appspot.com/api/snipx_snippets/user", {
          id: user.id,
        });
        setSnippets(response.data);
      } catch (error) {
        console.error("Error fetching snippets:", error);
      }
    };

    if (user && user.id) {
      fetchAllSnippets();
      fetchUserSkills(user.id); // Fetch user skills
    }
  }, [user]);

  useEffect(() => {
    const filteredSnippets = filterSnippetsBySelectedRange(selectedDate);
    updateChartData(filteredSnippets);

    if (chartRef.current) {
      chartRef.current.update(); // Force update on chart when dark mode changes
    }
  }, [selectedDate, snippets, isDarkMode, showTrendline]); // Add showTrendline to dependencies


  const fetchUserSkills = async (userId) => {
    const skillCache = {}; // Cache for storing full skill details
    
    const fetchSkillDetails = async (skillId) => {
      if (skillCache[skillId]) {
        return skillCache[skillId]; // Return from cache if already fetched
      }
      try {
        const response = await axios.get(`https://extension-360407.lm.r.appspot.com/api/skills/${skillId}`, {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        skillCache[skillId] = response.data; // Store skill details in cache
        return response.data;
      } catch (error) {
        console.error(`Error fetching skill details for skill ID: ${skillId}`, error);
        return { skill_name: 'undefined' }; // Return 'undefined' if there's an error
      }
    };
  
    try {
      const response = await axios.get(`https://extension-360407.lm.r.appspot.com/api/users/${userId}/ratings`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
  
      console.log("Fetched user skills:", response.data); // Log fetched user skills
  
      const userSkillsData = await response.data.reduce(async (accPromise, rating) => {
        const acc = await accPromise;
        const { skill, score, created_at } = rating;
        const date = new Date(created_at).toLocaleDateString();
  
        let skillName = 'undefined';
        if (skill && skill.skill_name) {
          skillName = skill.skill_name;
        } else if (skill) {
          const fullSkill = await fetchSkillDetails(skill.id);
          skillName = fullSkill.skill_name || 'undefined';
        }
  
        if (!acc[skillName]) {
          acc[skillName] = { data: [], skillName: skillName };
        }
  
        acc[skillName].data.push({ date, score: parseFloat(score) });
  
        return acc;
      }, Promise.resolve({}));
  
      setSkills(userSkillsData);
      console.log("Processed user skills data:", userSkillsData); // Log processed user skills
    } catch (error) {
      console.error("Error fetching user skills:", error);
    }
  };
  
  
  

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        labels: {
          color: getComputedStyle(document.documentElement).getPropertyValue('--black-text').trim(),
        },
      },
      title: {
        display: true,
        text: 'Sentiment Scores Over Time',
        color: getComputedStyle(document.documentElement).getPropertyValue('--black-text').trim(),
      },
    },
    scales: {
      x: {
        ticks: {
          color: getComputedStyle(document.documentElement).getPropertyValue('--black-text').trim(),
        },
      },
      y: {
        ticks: {
          color: getComputedStyle(document.documentElement).getPropertyValue('--black-text').trim(),
        },
      },
    },
  };


  const SkillChart = ({ skillData }) => {
    if (!skillData || skillData.data.length === 0) {
      return <p>No data available for this skill.</p>; // Fallback for missing data
    }
  
    const chartData = {
      labels: skillData.data.map(d => d.date),
      datasets: [
        {
          label: skillData.skillName,
          data: skillData.data.map(d => d.score),
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 1,
          fill: false,
        },
      ],
    };
  
    const options = {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          min: 0,
          max: 11,
          ticks: {
            stepSize: 1,
          },
        },
      },
      plugins: {
        legend: {
          display: false,
        },
      },
    };
  
    return (
      <div className="skill-chart-wrapper">
        <h4>{skillData.skillName || 'Undefined Skill'}</h4>
        <Line data={chartData} options={options} />
      </div>
    );
  };
  

  const handleProfilePictureClick = () => {
    setIsPopupOpen(true);
  };

const handleImageUpload = async (event) => {
  const file = event.target.files[0];
  if (file) {
    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setSelectedImage(reader.result);
    };
    reader.readAsDataURL(file);

    try {
      // Prepare form data to send the image file and user ID
      const formData = new FormData();
      formData.append('profilePicture', file); // Append the image file
      formData.append('userId', user.id); // Append the user ID

      // Call the backend API to upload the profile picture
      await axios.post('https://extension-360407.lm.r.appspot.com/api/uploadProfilePicture', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Reset the file input value to prevent it from reopening
      event.target.value = null;

      // Close the popup after the image is uploaded
      setIsPopupOpen(false);

      console.log("Profile picture uploaded successfully!");

      // Instead of refreshing the entire page, refetch user data or update the UI
      // For example, you can call a function to refetch the user's profile or picture data
      await refetchUserProfile(); // Make sure to define this function
    } catch (error) {
      console.error("Error uploading profile picture:", error);
    }
  }
};

// Function to refetch the user's profile picture
const refetchUserProfile = async () => {
  try {
    const response = await axios.get(`https://extension-360407.lm.r.appspot.com/api/profilePicture/${user.id}`);
    const { profilePictureUrl } = response.data; // Adjust based on your response structure
    
    // Update the user's profile picture URL in state
    setUser(prevUser => ({
      ...prevUser,
      profilePictureUrl, // Set the new profile picture URL
    }));
    console.log("new user:", user)
  } catch (error) {
    console.error("Error fetching profile picture:", error);
  }
};
  

  const updateChartData = (filteredSnippets) => {
    const sortedSnippets = filteredSnippets.sort((a, b) => new Date(a.date) - new Date(b.date));
    const scores = sortedSnippets.map(snippet => parseFloat(snippet.score)); // Convert string scores to numbers
    const labels = sortedSnippets.map(snippet => new Date(snippet.date).toLocaleDateString());
  
    const datasets = [
      {
        label: 'Sentiment Scores',
        data: scores,
        borderColor: getComputedStyle(document.documentElement).getPropertyValue('--graph-line-color').trim(),
        backgroundColor: 'rgba(228, 39, 125, 0.2)',
      },
    ];
  
    // Calculate Linear Regression if trendline is enabled
    if (showTrendline) {
      const trendlinePoints = calculateLinearRegression(scores);
  
      datasets.push({
        label: 'Trendline',
        data: trendlinePoints, // Add trendline points to the chart
        borderColor: 'rgba(0, 123, 255, 0.75)', // Blue for trendline
        backgroundColor: 'rgba(0, 123, 255, 0.1)',
        type: 'line',
        fill: false,
      });
    }
  
    const newChartData = {
      labels,
      datasets,
    };
  
    setChartData(newChartData);
    calculateAverageScore(scores);
    updateOverviewData(sortedSnippets);
  
    if (chartRef.current) {
      chartRef.current.update();
    }
  };
  
  // Helper function to calculate linear regression trendline
  const calculateLinearRegression = (data) => {
    const N = data.length;
    const xSum = (N * (N - 1)) / 2; // Sum of indexes 0, 1, 2...N-1
    const ySum = data.reduce((acc, y) => acc + parseFloat(y), 0); // Convert y to number, then sum
    const xySum = data.reduce((acc, y, x) => acc + x * parseFloat(y), 0); // Convert y to number, then sum of x * y
    const xSqSum = (N * (N - 1) * (2 * N - 1)) / 6; // Sum of squares of indexes 0^2, 1^2, 2^2...N-1^2
  
    // Calculate slope (m) and intercept (b)
    const m = (N * xySum - xSum * ySum) / (N * xSqSum - xSum ** 2);
    const b = (ySum - m * xSum) / N;
  
    // Generate the y-values for the trendline
    return data.map((_, x) => m * x + b);
  };
  

  const filterSnippetsBySelectedRange = (selectedDate) => {
    const today = new Date();
    const selectedDay = new Date(selectedDate);
    let startDayOffset = 3;
    let endDayOffset = 3;

    if (today.toDateString() === selectedDay.toDateString()) {
      startDayOffset = 6;
      endDayOffset = 0;
    } else if (today.getTime() - selectedDay.getTime() <= 1 * 24 * 60 * 60 * 1000) {
      startDayOffset = 5;
      endDayOffset = 1;
    } else if (today.getTime() - selectedDay.getTime() <= 2 * 24 * 60 * 60 * 1000) {
      startDayOffset = 4;
      endDayOffset = 2;
    }

    const startDate = new Date(selectedDay);
    startDate.setDate(selectedDay.getDate() - startDayOffset);
    const endDate = new Date(selectedDay);
    endDate.setDate(selectedDay.getDate() + endDayOffset);

    const filteredSnippets = snippets.filter(snippet => {
      const snippetDate = new Date(snippet.date);
      return snippetDate >= startDate && snippetDate <= endDate;
    });

    return filteredSnippets;
  };

  const calculateAverageScore = (scores) => {
    const total = scores.reduce((sum, score) => sum + parseFloat(score), 0);
    const average = total / scores.length || 0;
    setAverageScore(average.toFixed(2));
  };

  const updateOverviewData = (filteredSnippets) => {
    const overviewData = filteredSnippets.map(snippet => ({
      date: new Date(snippet.date).toLocaleDateString(),
      green: snippet.green || 'N/A',
      orange: snippet.orange || 'N/A',
      red: snippet.red || 'N/A',
      actionText: snippet.action_text || 'No action provided',
    })).reverse();

    setOverviewData(overviewData);
  };

  const handleDateChange = (date) => {
    setSelectedDate(date);
  };

  const toggleTrendline = () => {
    setShowTrendline(!showTrendline);
  };

  return (
    <div className="landing-page">
      <div className="profile-section">
        <div className="profile-content">
          <div
            className="profile-picture"
            style={{
              backgroundImage: user?.profilePictureUrl ? `url(data:image/png;base64,${user.profilePictureUrl})` : 'none',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              cursor: 'pointer',
            }}
            onClick={handleProfilePictureClick}
          >
            {!user?.profilePictureUrl && 'Profile Picture'}
          </div>
          <div className="profile-info">
            {user ? (
              <>
                <h2>Name: {user.email.substring(0, 3)}</h2>
                <p>Email: {user.email}</p>
                <p>Position: {user.role}</p>
              </>
            ) : (
              <p>Loading user information...</p>
            )}
          </div>
        </div>
        {/* Sentiment Analysis title placed below */}
        <h2 className="sentiment-analysis">Sentiment Analysis</h2>
      </div>

      {isPopupOpen && (
        <div className="upload-popup">
          <div className="upload-popup-content">
            <h2>Upload New Profile Picture</h2>
            <div
              className="upload-area"
              onDrop={handleImageUpload}
              onDragOver={(e) => e.preventDefault()}
            >
              {selectedImage ? (
                <img src={selectedImage} alt="Selected" className="preview-image" />
              ) : (
                <p>Drag and drop an image here or click to select</p>
              )}
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              style={{ display: 'none' }}
              id="file-upload"
            />
            <button onClick={() => document.getElementById('file-upload').click()}>
              Upload Image
            </button>
            <button onClick={() => setIsPopupOpen(false)}>Cancel</button>
          </div>
        </div>
      )}

      <div className="overview-section">
        <h2>Weekly Overview</h2>
        <div className="landing-page-table-wrapper">
          <table className="overview-table">
            <thead>
              <tr>
                <th>Date</th>
                <th><FontAwesomeIcon icon={faFlag} style={{ color: 'green'}} /></th>
                <th><FontAwesomeIcon icon={faFlag} style={{ color: 'orange'}} /></th>
                <th><FontAwesomeIcon icon={faFlag} style={{ color: 'red'}} /></th>
                <th>Actions for next day</th>
              </tr>
            </thead>
            <tbody>
              {overviewData.map((row, index) => (
                <tr key={index}>
                  <td>{row.date}</td>
                  <td>{row.green}</td>
                  <td>{row.orange}</td>
                  <td>{row.red}</td>
                  <td>{row.actionText}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="analysis-section">
        <Line
          className="sentiment-analysis-graph"
          data={chartData}
          options={chartOptions}
          ref={chartRef}
        />
        <div className="average-score-container">
          <div className="average-score">
            <div className="circle">{averageScore}</div>
          </div>
          <button onClick={toggleTrendline} className="toggle-trendline-button">
            {showTrendline ? 'Hide' : 'Show'} Trendline
          </button>
        </div>

      </div>

      <div className="calendar-section">
        <Calendar onChange={handleDateChange} value={selectedDate} />
      </div>
      
      <div className="skills-section">
        <h2 className='user-skills'>User Skills</h2>
        <table className="skills-table">
          <thead>
            <tr>
              <th>Skill Name</th>
              <th>Score</th>
              <th>Progress Visualization</th>
            </tr>
          </thead>
          <tbody>
            {Object.keys(skills).map((skillName, index) => (
              <tr key={index}>
                <td>{skillName !== 'undefined' ? skillName : 'Unknown Skill'}</td>
                <td>{skills[skillName]?.data?.[0]?.score || 'No rating'}</td> {/* Show the first score as an example */}
                <td>
                  <div className="skills-chart-container">
                    <SkillChart key={index} skillData={skills[skillName]} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Home;
