import React, { useState } from "react";
import UploadComponent from "./components/UploadComponent";
import "./styles/App.css";

function App() {
  const [darkMode, setDarkMode] = useState(false);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.body.classList.toggle("dark-mode", !darkMode);
  };

  return (
    <div className={`app ${darkMode ? "dark-mode" : ""}`}>
      <header className="app-header">
        <div className="header-content">
          <h1>File Compressor</h1>
          <div className="mode-toggle">
            <label className="switch">
              <input
                type="checkbox"
                onChange={toggleDarkMode}
                checked={darkMode}
              />
              <span className="slider round"></span>
            </label>
            <label className="symbol-label">{darkMode ? "🌙" : "🌞"}</label>
          </div>
        </div>
        <p>
          Upload your files, and we will compress them for you. Get download
          links once they're ready.
        </p>
      </header>

      <UploadComponent />
    </div>
  );
}

export default App;
