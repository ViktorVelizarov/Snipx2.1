import React, { useRef, useState, useEffect } from "react";
import { useAuth } from "../AuthProvider";
import axios from "axios";
import { FaAngleDoubleLeft, FaAngleDoubleRight, FaAngleLeft, FaAngleRight } from "react-icons/fa";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFlag } from '@fortawesome/free-solid-svg-icons';
import './MySnippets.css';

function MySnippets() {
  const { user } = useAuth();

  const [snippets, setSnippets] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const snippetsPerPage = 3;
  const [editingSnippetId, setEditingSnippetId] = useState(null);
  const [editingSnippet, setEditingSnippet] = useState({
    type: "",
    date: "",
    text: "",
    green: "",
    orange: "",
    red: "",
    explanations: "",
    action_text: "", // Add action_text to state
  });

  const textRef = useRef([]);
  const greenRef = useRef([]);
  const orangeRef = useRef([]);
  const redRef = useRef([]);
  const explanationsRef = useRef([]);
  const actionTextRef = useRef([]);

  useEffect(() => {
    const fetchSnippets = async () => {
      try {
        const response = await axios.post("https://extension-360407.lm.r.appspot.com/api/snipx_snippets/user", { id: user.id });
        setSnippets(response.data);
      } catch (error) {
        console.error("Error fetching snippets:", error);
      }
    };
    fetchSnippets();
  }, [user]);

  useEffect(() => {
    if (editingSnippetId !== null) {
      resizeAllTextAreas();
    }
  }, [editingSnippetId]);

  const handleDelete = async (id) => {
    try {
      const response = await fetch(`https://extension-360407.lm.r.appspot.com/api/snipx_snippets/${id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        setSnippets(snippets.filter((snippet) => snippet.id !== id));
      } else {
        console.error("Failed to delete snippet");
      }
    } catch (error) {
      console.error("Error deleting snippet:", error);
    }
  };

  const handleEditClick = (snippet) => {
    setEditingSnippetId(snippet.id);
    setEditingSnippet({
      type: snippet.type || "",
      date: snippet.date || "",
      text: snippet.text || "",
      green: snippet.green || "",
      orange: snippet.orange || "",
      red: snippet.red || "",
      explanations: snippet.explanations || "",
      action_text: snippet.action_text || "", // Add action_text to edit mode
    });
  };

  const handleSave = async (id) => {
    try {
      const response = await fetch(`https://extension-360407.lm.r.appspot.com/api/snipx_snippets/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editingSnippet),
      });
      if (response.ok) {
        const updatedSnippet = await response.json();
        setSnippets(
          snippets.map((snippet) =>
            snippet.id === id ? updatedSnippet : snippet
          )
        );
        setEditingSnippetId(null);
      } else {
        console.error("Failed to save snippet");
      }
    } catch (error) {
      console.error("Error saving snippet:", error);
    }
  };

  const handleCancel = () => {
    setEditingSnippetId(null);
  };

  const resizeAllTextAreas = () => {
    [textRef, greenRef, orangeRef, redRef, explanationsRef, actionTextRef].forEach(refGroup => {
      refGroup.current.forEach(textarea => {
        if (textarea) {
          textarea.style.height = "auto";
          textarea.style.height = `${textarea.scrollHeight}px`;
        }
      });
    });
  };

  const getUserEmail = (userId) => {
    return user ? user.email : "None";
  };

  const getUserProfilePicture = () => {
    return user?.profilePictureUrl || '';
  };

  // Calculate pagination details
  const indexOfLastSnippet = currentPage * snippetsPerPage;
  const indexOfFirstSnippet = indexOfLastSnippet - snippetsPerPage;
  const currentSnippets = snippets.slice(indexOfFirstSnippet, indexOfLastSnippet);
  const totalPages = Math.ceil(snippets.length / snippetsPerPage);

  const paginate = (pageNumber) => {
    if (pageNumber < 1) {
      setCurrentPage(1);
    } else if (pageNumber > totalPages) {
      setCurrentPage(totalPages);
    } else {
      setCurrentPage(pageNumber);
    }
  };

  return (
    <div className="snippets-page">
      <h1 className="snippets-title">My Snippets</h1>
      <div className="table-container">
        <table className="snippets-table">
          <thead>
            <tr>
              <th>Profile Picture</th> {/* Add profile picture column */}
              <th>ID</th>
              <th>Type</th>
              <th>Date</th>
              <th>Snippet Text</th>
              <th><FontAwesomeIcon icon={faFlag} style={{ color: 'green'}} /></th>
              <th><FontAwesomeIcon icon={faFlag} style={{ color: 'orange'}} /></th>
              <th><FontAwesomeIcon icon={faFlag} style={{ color: 'red'}} /></th>
              <th>Explanations</th>
              <th>Actions for Next Day</th> {/* New column for action_text */}
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentSnippets.map((snippet, index) => (
              <tr key={snippet.id}>
                <td>
                  <div className="profile-container"> {/* Smaller container */}
                    <div className="tooltip-container">
                      <img
                        src={`data:image/png;base64,${getUserProfilePicture()}`}
                        alt="Profile"
                        className="profile-picture"
                      />
                      <span className="tooltip-text">{getUserEmail(snippet.user_id)}</span>
                    </div>
                  </div>
                </td> {/* Profile picture column */}
                <td>{snippet.id}</td>
                <td>
                  {editingSnippetId === snippet.id ? (
                    <input
                      type="text"
                      value={editingSnippet.type}
                      onChange={(e) => setEditingSnippet({ ...editingSnippet, type: e.target.value })}
                      className="edit-box"
                    />
                  ) : (
                    snippet.type || ""
                  )}
                </td>
                <td>
                  {editingSnippetId === snippet.id ? (
                    <input
                      type="text"
                      value={editingSnippet.date}
                      onChange={(e) => setEditingSnippet({ ...editingSnippet, date: e.target.value })}
                      className="edit-box"
                    />
                  ) : (
                    snippet.date || ""
                  )}
                </td>
                <td>
                  {editingSnippetId === snippet.id ? (
                    <textarea
                      ref={el => (textRef.current[index] = el)}
                      value={editingSnippet.text}
                      onChange={(e) => setEditingSnippet({ ...editingSnippet, text: e.target.value })}
                      className="edit-box"
                    />
                  ) : (
                    snippet.text || ""
                  )}
                </td>
                <td>
                  {editingSnippetId === snippet.id ? (
                    <textarea
                      ref={el => (greenRef.current[index] = el)}
                      value={editingSnippet.green}
                      onChange={(e) => setEditingSnippet({ ...editingSnippet, green: e.target.value })}
                      className="edit-box"
                    />
                  ) : (
                    snippet.green || ""
                  )}
                </td>
                <td>
                  {editingSnippetId === snippet.id ? (
                    <textarea
                      ref={el => (orangeRef.current[index] = el)}
                      value={editingSnippet.orange}
                      onChange={(e) => setEditingSnippet({ ...editingSnippet, orange: e.target.value })}
                      className="edit-box"
                    />
                  ) : (
                    snippet.orange || ""
                  )}
                </td>
                <td>
                  {editingSnippetId === snippet.id ? (
                    <textarea
                      ref={el => (redRef.current[index] = el)}
                      value={editingSnippet.red}
                      onChange={(e) => setEditingSnippet({ ...editingSnippet, red: e.target.value })}
                      className="edit-box"
                    />
                  ) : (
                    snippet.red || ""
                  )}
                </td>
                <td>
                  {editingSnippetId === snippet.id ? (
                    <textarea
                      ref={el => (explanationsRef.current[index] = el)}
                      value={editingSnippet.explanations}
                      onChange={(e) => setEditingSnippet({ ...editingSnippet, explanations: e.target.value })}
                      className="edit-box"
                    />
                  ) : (
                    snippet.explanations || ""
                  )}
                </td>
                <td>
                  {editingSnippetId === snippet.id ? (
                    <textarea
                      ref={el => (actionTextRef.current[index] = el)} // Add ref for action_text
                      value={editingSnippet.action_text}
                      onChange={(e) => setEditingSnippet({ ...editingSnippet, action_text: e.target.value })}
                      className="edit-box"
                    />
                  ) : (
                    snippet.action_text || "No action provided" // Show action_text or default
                  )}
                </td>
                <td className="py-2 px-4 flex space-x-2">
                  {editingSnippetId === snippet.id ? (
                    <>
                      <button onClick={() => handleSave(snippet.id)} className="snippets-buttons">Save</button>
                      <button onClick={handleCancel} className="snippets-buttons">Cancel</button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => handleEditClick(snippet)} className="snippets-buttons">Edit</button>
                      <button onClick={() => handleDelete(snippet.id)} className="snippets-buttons">Delete</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="pagination">
        {/* First Page Button */}
        <button onClick={() => paginate(1)} disabled={currentPage === 1} className="pagination-button">
          <FaAngleDoubleLeft />
        </button>

        {/* Previous Page Button */}
        <button onClick={() => paginate(currentPage - 1)} disabled={currentPage === 1} className="pagination-button">
          <FaAngleLeft />
        </button>

        {/* Previous Two Pages */}
        {currentPage > 2 && (
          <button onClick={() => paginate(currentPage - 2)} className="pagination-button">
            {currentPage - 2}
          </button>
        )}
        {currentPage > 1 && (
          <button onClick={() => paginate(currentPage - 1)} className="pagination-button">
            {currentPage - 1}
          </button>
        )}

        {/* Current Page */}
        <button className="pagination-button active">{currentPage}</button>

        {/* Next Two Pages */}
        {currentPage < totalPages && (
          <button onClick={() => paginate(currentPage + 1)} className="pagination-button">
            {currentPage + 1}
          </button>
        )}
        {currentPage < totalPages - 1 && (
          <button onClick={() => paginate(currentPage + 2)} className="pagination-button">
            {currentPage + 2}
          </button>
        )}

        {/* Next Page Button */}
        <button onClick={() => paginate(currentPage + 1)} disabled={currentPage === totalPages} className="pagination-button">
          <FaAngleRight />
        </button>

        {/* Last Page Button */}
        <button onClick={() => paginate(totalPages)} disabled={currentPage === totalPages} className="pagination-button">
          <FaAngleDoubleRight />
        </button>
      </div>
    </div>
  );
}

export default MySnippets;