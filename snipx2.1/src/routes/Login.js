import React, { useEffect } from 'react';
import './Login.css'; // Ensure this contains styles specific to the landing page

import recapImage from './images/recap.png';  
import heartImage from './images/heart.png';  
import pdpImage from './images/pdp.png';  
import calendarImage from './images/calendar.png';
import arrowImage from './images/arrow.png';
import marekImage from './images/Marek.png';
import martinEImage from './images/MartinE.png';
import martinSImage from './images/MartinS.png';
import kristinaImage from './images/Kristina.png';
import piotrImage from './images/Piotr.png';
import sancheImage from './images/Sanche.png';
import viktorImage from './images/Viktor.png';

const Login = () => {

  useEffect(() => {
    // Add a class to the body when the component mounts
    document.body.classList.add('login-page-background');

    // Clean up by removing the class when the component unmounts
    return () => {
      document.body.classList.remove('login-page-background');
    };
  }, []);

  return (
    <div className='login-page-container'>
      <div className="unconnected-landing-page">
        {/* The Problem Section */}
        <div className= "section the-problem">
          <h1>Skills and Upskilling Challenges in today's jobs markets and fast onboarding new gen</h1>
          <ul>
            {/* <li>
              <span className="icon">✖</span>
              <strong>Reskilling 50+ age generation</strong>
            </li> */}
            <li>
              <span className="icon">✖</span>
              <strong>Inefficient Task Tracking</strong>
            </li>
            <li>
              <span className="icon">✖</span>
              <strong>Lack of Engagement</strong>
            </li>
            <li>
              <span className="icon">✖</span>
              <strong>Fragmented Communication</strong>
            </li>
            <li>
              <span className="icon">✖</span>
              <strong>Failure to Meet Deadline</strong>
            </li>
          </ul>
        </div>

        {/* Solution Section */}
        <div className="section solution">
          <h1>Solution</h1>
          <ul className="solution-list">
            <li>A revolutionary new HR tool</li>
          </ul>
          <div className="solution-icons">
            <div className="icon-box">
              <img src={recapImage} alt="Recap daily tasks" />
              <p>Uses AI to recap daily tasks</p>
            </div>
            <div className="icon-box">
              <img src={heartImage} alt="Monitors morale" />
              <p>Monitors morale</p>
            </div>
            <div className="icon-box">
              <img src={pdpImage} alt="Develops personalized PDP" />
              <p>Develops personalized PDP</p>
            </div>
            <div className="icon-box">
              <img src={calendarImage} alt="Tracks progression" />
              <p>Tracks progression</p>
            </div>
          </div>
        </div>

        {/* Market Section */}
        <div className="section market">
          <h1>The Market</h1>
          <div className="market-content">
            <div className="market-visual">
              <div className="market-circle">
                <span className="year">2022</span>
                <span className="market-size">$260 billion</span>
              </div>
              <div className="arrow">
                <span>CAGR = 13.7%</span>
                <img src={arrowImage} alt="Arrow" />
              </div>
              <div className="market-circle large">
                <span className="year">2031</span>
                <span className="market-size">$830 billion</span>
              </div>
            </div>
            <div className="market-bullets">
              <ul>
                <li><strong>High demand</strong> for productivity tools with <strong>AI-driven automation</strong></li>
                <li><strong>Increasing adoption</strong> of remote work <strong>boosting</strong> SaaS growth</li>
              </ul>
            </div>
          </div>
        </div>

        {/* SnipX benefits Section */}
        <div className= "section the-problem">
          <h1>SnipX benefits in Various Stages</h1>
          <ul>
            <li>
              <span className="icon">✓</span>
              <strong>Individual for personal growth and Upskilling / Reskilling </strong>
            </li>
            <li>
              <span className="icon">✓</span>
              <strong>For Team and People Leads - easier navigation for mentoring and coaching</strong>
            </li>
            <li>
              <span className="icon">✓</span>
              <strong>Company level - easier control of Upskilling and Reskilling pace of the whole company</strong>
            </li>
            <li>
              <span className="icon">✓</span>
              <strong>Individual can use standalone , separated from the company just for self reflection and faster personal growth</strong>
            </li>
          </ul>
        </div>

        {/* Landscape Section */}
        <div className="section landscape">
          <h2>Landscape</h2>
          <table className="transposed-table">
            <thead>
              <tr>
                <th>Feature</th>
                <th>Task Tracking & Reporting</th>
                <th>AI-Driven Insights</th>
                <th>Gamification & Engagement</th>
                <th>Custom Apps & Solutions</th>
                <th>Real-Time Communication & Collaboration</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Snippets</strong></td>
                <td>✓</td>
                <td>✓</td>
                <td>✓</td>
                <td>✓</td>
                <td>✓</td>
              </tr>
              <tr>
                <td><strong>Wrike</strong></td>
                <td>✓</td>
                <td>✖</td>
                <td>✖</td>
                <td>✖</td>
                <td>✖</td>
              </tr>
              <tr>
                <td><strong>ClickUp</strong></td>
                <td>✖</td>
                <td>✓</td>
                <td>✖</td>
                <td>✖</td>
                <td>✖</td>
              </tr>
              <tr>
                <td><strong>Airtable</strong></td>
                <td>✖</td>
                <td>✖</td>
                <td>✖</td>
                <td>✓</td>
                <td>✖</td>
              </tr>
              <tr>
                <td><strong>Habitica</strong></td>
                <td>✖</td>
                <td>✖</td>
                <td>✓</td>
                <td>✖</td>
                <td>✖</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Company Purpose Section */}
        <div className="section company-purpose">
          <h1>Company Purpose</h1>
            <p>
              “To transform workplace productivity with an all-in-one platform that simplifies daily operations for businesses, delivering real-time insights and automating task tracking and reporting”
            </p>
        </div>

      {/* Centering Wrapper */}
      <div className="center-wrapper">
        {/* Team Section */}
        <div className="section team">
          <h2>The Team</h2>
          <div className="team-members">
            <div className="team-member">
              <img src={marekImage} alt="Marek" />
              <h3>Marek</h3>
              <p>CEO</p>
              <ul>
                <li>Lived and worked in 10 countries</li>
                <li>Fluent in 6 languages</li>
                <li>7+ years at Google</li>
              </ul>
            </div>
            <div className="team-member">
              <img src={martinSImage} alt="Martin" />
              <h3>Martin</h3>
              <p>COO</p>
              <ul>
                <li>20+ years experience in technology projects</li>
                <li>10+ years PM Experience</li>
              </ul>
            </div>
            <div className="team-member">
              <img src={piotrImage} alt="Piotr" />
              <h3>Piotr</h3>
              <p>Senior Fellow</p>
              <ul>
                <li>Previously Head of Marketing at eBay</li>
                <li>Scaleup.Agency Partner (5+ years)</li>
              </ul>
            </div>
            <div className="team-member">
              <img src={kristinaImage} alt="Kristina" />
              <h3>Kristina</h3>
              <p>Team Lead</p>
              <ul>
                <li>4+ years of experience as a Team Lead at SCALEUP</li>
              </ul>
            </div>
            <div className="team-member">
              <img src={martinEImage} alt="Martin" />
              <h3>Martin</h3>
              <p>Team Lead</p>
              <ul>
                <li>4+ years of experience as a Team Lead and PM</li>
              </ul>
            </div>
            <div className="team-member">
              <img src={sancheImage} alt="Sanche" />
              <h3>Sanche</h3>
              <p>UI Designer</p>
              <ul>
                <li>Very good looking man</li>
              </ul>
            </div>
            <div className="team-member">
              <img src={viktorImage} alt="Viktor" />
              <h3>Viktor</h3>
              <p>UX Programmer</p>
              <ul>
                <li>Litteraly Batman</li>
              </ul>
            </div>
          </div>
        </div>
      </div>


    </div>
  </div>
  );
};

export default Login;
