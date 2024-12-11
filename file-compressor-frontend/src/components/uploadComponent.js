import React, { useState } from "react";
import axios from "axios";

// UploadComponent handles the file upload and displaying results
const UploadComponent = () => {
  const [files, setFiles] = useState([]);
  const [compressedFiles, setCompressedFiles] = useState([]);
  const [errorMessages, setErrorMessages] = useState([]);

  // Handle file selection and upload
  const handleFileUpload = async (event) => {
    const selectedFiles = event.target.files;
    const formData = new FormData();

    for (let file of selectedFiles) {
      formData.append("files", file);
    }

    try {
      // Sending files to the backend for compression
      const response = await axios.post("/api/files/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      // Update compressed files state with response data
      setCompressedFiles(response.data.files); // Assuming this is the list of compressed files
    } catch (error) {
      console.error("Error uploading files:", error);
      setErrorMessages(["Error uploading files. Please try again."]);
    }
  };

  // Fetch and open the download URL for a compressed file
  const handleDownload = async (filename) => {
    try {
      const response = await axios.get(`/api/files/download/${filename}`);
      const downloadUrl = response.data.downloadUrl;
      window.open(downloadUrl, "_blank");
    } catch (error) {
      console.error("Error fetching download URL:", error);
    }
  };

  return (
    <div>
      <h2>Upload Files for Compression</h2>
      <input type="file" multiple onChange={handleFileUpload} />

      {/* Display error messages if any */}
      {errorMessages.length > 0 && (
        <div>
          {errorMessages.map((msg, index) => (
            <p key={index} style={{ color: "red" }}>
              {msg}
            </p>
          ))}
        </div>
      )}

      {/* Display uploaded and compressed file details */}
      <div>
        {compressedFiles.length > 0 && (
          <div>
            <h3>Compressed Files:</h3>
            {compressedFiles.map((file, index) => (
              <div key={index}>
                <p>
                  <strong>Original File:</strong> {file.originalName} (Size:{" "}
                  {file.originalSize} bytes)
                </p>
                <p>
                  <strong>Compressed File:</strong> {file.compressedName} (Size:{" "}
                  {file.compressedSize} bytes)
                </p>
                <button onClick={() => handleDownload(file.compressedName)}>
                  Download Compressed File
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default UploadComponent;
