import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link, Outlet } from 'react-router-dom';
import { FaHome, FaPlusSquare, FaClipboardList, FaUsers, FaSignOutAlt, FaChartBar, FaRegCircle, FaCircle, FaCalendarPlus, FaAngleDoubleLeft, FaAngleDoubleRight, FaSignInAlt } from 'react-icons/fa';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useAuth } from '../AuthProvider';
import './style.css';
import SnipXWhiteImage from './images/SNIPX-Logo-White.png';
import SnipXGradientImage from './images/SNIPX-Logo-Gradient.png';

const NavBar = () => {
    const { user, logout, login, auth, checkDatabase } = useAuth();
    const [isDarkMode, setIsDarkMode] = useState(true);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [snipXImage, setSnipXImage] = useState(SnipXWhiteImage);
    const [firebaseUser, loading] = useAuthState(auth);
    const navigate = useNavigate();
    const location = useLocation(); // Get the current path

    useEffect(() => {
        if (user?.email) {
            return navigate('/home');
        } else if (!loading && firebaseUser) {
            checkDatabase(firebaseUser);
        }
    }, [user, loading, firebaseUser, navigate, checkDatabase]);

    const handleSubmit = (event) => {
        event.preventDefault();
        login();
    };

    const toggleColors = () => {
        if (isDarkMode) {
            document.documentElement.style.setProperty('--navbar-color', 'rgb(30, 30, 30)');
            document.documentElement.style.setProperty('--navbar-color2', 'rgb(30, 30, 30)');
            document.documentElement.style.setProperty('--btn-bg-color', '#00bd9b');
            document.documentElement.style.setProperty('--btn-bg-color2', 'rgb(0, 213, 255)');
            document.documentElement.style.setProperty('--graph-line-color', 'rgb(0, 213, 255)');
            document.documentElement.style.setProperty('--bg-color', 'rgb(40, 40, 40)');
            document.documentElement.style.setProperty('--container-color1', 'rgb(100, 100, 100)');
            document.documentElement.style.setProperty('--container-color2', 'rgb(100, 100, 100)');
            document.documentElement.style.setProperty('--colored-text', 'white');
            document.documentElement.style.setProperty('--black-text', 'white');
            document.documentElement.style.setProperty('--pagination-disabled', 'rgb(100,100,100)');
            document.documentElement.style.setProperty('--chart-section', 'rgb(100,100,100)');
            setSnipXImage(SnipXGradientImage);
        } else {
            document.documentElement.style.setProperty('--navbar-color', '#8C4EA0');
            document.documentElement.style.setProperty('--navbar-color2', '#E4277D');
            document.documentElement.style.setProperty('--btn-bg-color', '#8C4EA0');
            document.documentElement.style.setProperty('--btn-bg-color2', '#E4277D');
            document.documentElement.style.setProperty('--graph-line-color', '#8C4EA0');
            document.documentElement.style.setProperty('--bg-color', '#ebedee');
            document.documentElement.style.setProperty('--container-color1', '#8C4EA0');
            document.documentElement.style.setProperty('--container-color2', '#E4277D');
            document.documentElement.style.setProperty('--colored-text', '#8C4EA0');
            document.documentElement.style.setProperty('--black-text', 'black');
            document.documentElement.style.setProperty('--pagination-disabled', '#ccc');
            document.documentElement.style.setProperty('--chart-section', 'white');
            setSnipXImage(SnipXWhiteImage);
        }
        setIsDarkMode(!isDarkMode);
    };


    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    // Function to check if the current path matches the link path
    const isActiveLink = (path) => location.pathname === path;

    return (
        <>
            <nav className={`sidebar ${isSidebarOpen ? 'open' : 'closed'}`}>
                <div className="logo">
                    <Link to="/home"><img src={snipXImage} alt="SnipX by ScaleUP" /></Link>
                </div>
                <ul>
                    {user ? (
                        <>
                            <li className={isActiveLink('/home') ? 'active' : ''}>
                                <Link to="/home"><FaHome /> Home</Link>
                            </li>
                            <li className={isActiveLink('/add-snippet') ? 'active' : ''}>
                                <Link to="/add-snippet"><FaPlusSquare /> Create Snippets</Link>
                            </li>
                            <li className={isActiveLink('/user-pdp') ? 'active' : ''}>
                                <Link to="/user-pdp"><FaPlusSquare /> My PDP</Link>
                            </li>
                            <li className={isActiveLink('/weekly-report') ? 'active' : ''}>
                                <Link to="/weekly-report"><FaCalendarPlus /> Weekly Report</Link>
                            </li>
                            <li className={isActiveLink('/my-snippets') ? 'active' : ''}>
                                <Link to="/my-snippets"><FaClipboardList /> My Snippets</Link>
                            </li>
                            <li className={isActiveLink('/graphs') ? 'active' : ''}>
                                <Link to="/graphs"><FaChartBar /> Graphs</Link>
                            </li>
                            {user.role === 'admin' && (
                                <>
                                    <li className={isActiveLink('/snippets') ? 'active' : ''}>
                                        <Link to="/snippets"><FaChartBar /> All Snippets</Link>
                                    </li>
                                    <li className={isActiveLink('/users') ? 'active' : ''}>
                                        <Link to="/users"><FaUsers /> Users</Link>
                                    </li>
                                    <li className={isActiveLink('/teams') ? 'active' : ''}>
                                        <Link to="/teams"><FaUsers /> Teams</Link>
                                    </li>
                                    <li className={isActiveLink('/tasks') ? 'active' : ''}>
                                        <Link to="/tasks"><FaUsers /> Tasks</Link>
                                    </li>
                                    <li className={isActiveLink('/notifications') ? 'active' : ''}>
                                        <Link to="/notifications"><FaUsers /> Notifications</Link>
                                    </li>
                                </>
                            )}
                            <li className="logout">
                                <Link to="/login" onClick={logout}><FaSignOutAlt /> Log Out</Link>
                            </li>
                        </>
                    ) : (
                        <li className={isActiveLink('/login') ? 'active' : ''}>
                            <Link to="/login" onClick={handleSubmit}><FaSignInAlt /> Login</Link>
                        </li>
                    )}
                    <li>
                        <Link to="#" onClick={(e) => {
                            e.preventDefault();
                            toggleColors();
                        }}>
                            {isDarkMode ? <><FaRegCircle /> Switch Dark Mode</> : <><FaCircle /> Switch Scaleup Mode</>}
                        </Link>
                    </li>
                </ul>
            </nav>
            <div className="toggle-btn" onClick={toggleSidebar}>
                {isSidebarOpen ? <FaAngleDoubleLeft /> : <FaAngleDoubleRight />}
            </div>
            <div className={`content ${isSidebarOpen ? '' : 'shifted'}`}>
                <Outlet context={{ isDarkMode, toggleColors }} />
            </div>
        </>
    );
};

export default NavBar;
