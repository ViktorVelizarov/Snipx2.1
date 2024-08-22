import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Line } from 'react-chartjs-2';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './LandingPage.css';
import { useAuth } from "../AuthProvider";
import axios from 'axios';
import { Navigate } from "react-router-dom";


const Home = ({ isDarkMode }) => {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [averageScore, setAverageScore] = useState(7.4); // Initial average score
  const [chartData, setChartData] = useState({
    labels: [],
    datasets: [],
  });
  const [overviewData, setOverviewData] = useState([]); // Store overview data
  const chartRef = useRef(null); // Reference to the chart instance
  const [snippets, setSnippets] = useState([]); // Store all snippets
  const navigate = useNavigate(); // Get the navigate function

  // Fetch all snippets data when the component mounts
  useEffect(() => {
   
    
    const fetchAllSnippets = async () => {
      try {
        const response = await axios.post("https://extension-360407.lm.r.appspot.com/api/snipx_snippets/user", {
          id: user.id,
        });
        setSnippets(response.data); // Store all snippets
      } catch (error) {
        console.error("Error fetching snippets:", error);
      }
    };

    if (user && user.id) {
      fetchAllSnippets();
    }
  }, [user]);

    // Update chart data whenever a new date is selected on the calendar
    useEffect(() => {
        const filteredSnippets = filterSnippetsBySelectedRange(selectedDate);
        updateChartData(filteredSnippets);
      }, [selectedDate, snippets, isDarkMode]); // Re-run when selectedDate, snippets, or isDarkMode changes
    

  // Function to update chart data based on current CSS variable values
  const updateChartData = (filteredSnippets) => {
    const sortedSnippets = filteredSnippets.sort((a, b) => new Date(a.date) - new Date(b.date));
    const scores = sortedSnippets.map(snippet => snippet.score);
    const labels = sortedSnippets.map(snippet => new Date(snippet.date).toLocaleDateString());

    const newChartData = {
      labels,
      datasets: [
        {
          label: 'Sentiment Scores',
          data: scores,
          borderColor: getComputedStyle(document.documentElement).getPropertyValue('--graph-line-color').trim(),
          backgroundColor: 'rgba(228, 39, 125, 0.2)',
        },
      ],
    };

    setChartData(newChartData);
    calculateAverageScore(scores); // Calculate average score
    updateOverviewData(sortedSnippets); // Update overview data

    // Update chart instance if it exists
    if (chartRef.current) {
      chartRef.current.update();
    }
  };

  // Function to filter snippets by the selected range (7 days around the selected date)
  const filterSnippetsBySelectedRange = (selectedDate) => {
    const today = new Date();
    const selectedDay = new Date(selectedDate);
    let startDayOffset = 3;
    let endDayOffset = 3;

    // Adjust the range based on the proximity to today
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

    // Filter snippets that fall within the adjusted range
    const filteredSnippets = snippets.filter(snippet => {
      const snippetDate = new Date(snippet.date);
      return snippetDate >= startDate && snippetDate <= endDate;
    });

    return filteredSnippets;
  };

  // Calculate the average score from the scores array
  const calculateAverageScore = (scores) => {
    const total = scores.reduce((sum, score) => sum + parseFloat(score), 0);
    const average = total / scores.length || 0;
    setAverageScore(average.toFixed(2)); // Set average score to two decimal places
  };

  // Update the overview data for the selected date range
  const updateOverviewData = (filteredSnippets) => {
    const overviewData = filteredSnippets.map(snippet => ({
      date: new Date(snippet.date).toLocaleDateString(),
      green: snippet.green || 'N/A',
      orange: snippet.orange || 'N/A',
      red: snippet.red || 'N/A',
    })).reverse();

    setOverviewData(overviewData);
  };

    // Function to handle the chart click and navigate to add-snippet page
    const handleChartClick = () => {
        navigate('/graphs');
    };

  // Function to handle date changes in the calendar
  const handleDateChange = (date) => {
    setSelectedDate(date);
  };

  return (
    <div className="landing-page">
      <div className="profile-section">
        <div className="profile-picture">Profile Picture (Scaleup)</div>
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

      <div className="overview-section">
        <h2>Weekly Overview</h2>
        <div className="landing-page-table-wrapper">
          <table className="overview-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Green</th>
                <th>Yellow</th>
                <th>Red</th>
              </tr>
            </thead>
            <tbody>
              {overviewData.map((row, index) => (
                <tr key={index}>
                  <td>{row.date}</td>
                  <td>{row.green}</td>
                  <td>{row.orange}</td>
                  <td>{row.red}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div  onClick={handleChartClick} style={{ cursor: 'pointer' }} className="analysis-section">
        <h2>Sentiment Analysis</h2>
            <Line className="sentiment-analysis-graph" ref={chartRef} data={chartData} />
        <div className="average-score">
          <div className="circle">{averageScore}</div>
        </div>
      </div>

      <div className="calendar-section">
        <Calendar onChange={handleDateChange} value={selectedDate} />
        {/* <div className="calendar-controls">
          <button>Green</button>
          <button>Yellow</button>
          <button>Red</button>
          <button>Week</button>
          <button>Month</button>
        </div> */}
      </div>
    </div>
  );

};

export default Home;