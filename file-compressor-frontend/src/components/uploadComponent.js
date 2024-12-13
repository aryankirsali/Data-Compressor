import React, { useState, useEffect } from "react";
import { uploadFiles as apiUploadFiles } from "../services/api";
import {
  FaFilePdf,
  FaFileAlt,
  FaFileArchive,
  FaFile,
  FaVideo,
  FaMusic,
  FaImage,
} from "react-icons/fa"; // Import React Icons
import "../styles/UploadComponent.css";

const UploadComponent = () => {
  const [files, setFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false); // Track the uploading state

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:3001");

    ws.onopen = () => {
      console.log("WebSocket connection established");
    };

    ws.onmessage = (event) => {
      const update = JSON.parse(event.data);
      const { filename, status, url, error, compressedSize } = update;

      setFiles((prevFiles) =>
        prevFiles.map((file) =>
          file.file.name === filename
            ? {
                ...file,
                status,
                url: status === "success" ? url : null,
                error: status === "failed" ? error : null,
                compressedSize, // Store compressed size
              }
            : file
        )
      );
    };

    ws.onclose = () => {
      console.log("WebSocket connection closed");
    };

    return () => {
      ws.close();
    };
  }, []);

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files).map((file) => {
      let thumbnail = null;
      const fileExtension = file.name.split(".").pop().toLowerCase(); // Get file extension

      // Set file thumbnail based on the extension
      if (fileExtension === "pdf") {
        thumbnail = <FaFilePdf size={50} color="#FF6347" />; // PDF files use a PDF icon
      } else if (fileExtension === "txt") {
        thumbnail = <FaFileAlt size={50} color="#1E90FF" />; // Text files use a text file icon
      } else if (fileExtension === "zip") {
        thumbnail = <FaFileArchive size={50} color="#FFD700" />; // Zip files use a zip file icon
      } else if (
        fileExtension === "mp4" ||
        fileExtension === "mkv" ||
        fileExtension === "webm"
      ) {
        thumbnail = <FaVideo size={50} color="#FF4500" />; // Video files use a video icon
      } else if (
        fileExtension === "mp3" ||
        fileExtension === "wav" ||
        fileExtension === "flac"
      ) {
        thumbnail = <FaMusic size={50} color="#32CD32" />; // Audio files use an audio icon
      } else if (file.type.startsWith("image/")) {
        thumbnail = <FaImage size={50} color="#FF6347" />; // Image files use an image icon
      } else {
        thumbnail = <FaFile size={50} color="#A9A9A9" />; // Default icon for other file types
      }

      return {
        file,
        originalSize: formatFileSize(file.size), // Store original size
        status: "loading", // Set status to "loading" initially
        url: null,
        compressedSize: null, // Store compressed size later
        thumbnail, // Set the appropriate thumbnail based on file extension
      };
    });
    setFiles((prevFiles) => [...prevFiles, ...selectedFiles]);
  };

  const formatFileSize = (size) => {
    if (size < 1024) return `${size} bytes`;
    if (size < 1048576) return `${(size / 1024).toFixed(2)} KB`;
    return `${(size / 1048576).toFixed(2)} MB`;
  };

  const uploadFiles = async () => {
    setIsUploading(true); // Start loader when upload starts
    const fileList = files.map((fileObj) => fileObj.file);

    try {
      await apiUploadFiles(fileList);
    } catch (error) {
      console.error("Error uploading files:", error);
      setFiles((prevFiles) =>
        prevFiles.map((file) => ({ ...file, status: "error" }))
      );
    }
  };

  const handleRemoveFile = (index) => {
    const updatedFiles = files.filter((_, fileIndex) => fileIndex !== index);
    setFiles(updatedFiles);
  };

  // Check if all files have finished processing (status is not "loading")
  const allFilesProcessed = files.every((file) => file.status !== "loading");

  // Update `isUploading` once all files are processed
  useEffect(() => {
    if (allFilesProcessed) {
      setIsUploading(false); // Once all files have been processed, stop the upload state
    }
  }, [allFilesProcessed]);

  return (
    <div className="upload-component">
      <div className="upload-box">
        <input
          type="file"
          multiple
          onChange={handleFileChange}
          accept=".txt,.jpg,.png,.pdf,.zip,.rar,.tar,.mp4,.mkv,.webm,.mp3,.wav,.flac"
          disabled={files.length >= 5 || isUploading} // Disable if files are being uploaded
        />
        <button
          onClick={uploadFiles}
          disabled={files.length === 0 || isUploading || allFilesProcessed} // Disable during upload or if all files are processed
        >
          {isUploading ? "Uploading..." : "Upload Files"}
        </button>

        <div className="file-list">
          {files.length > 0 && (
            <ul>
              {files.map((fileObj, index) => (
                <li key={index} className="file-item">
                  {/* Show thumbnail for the file */}
                  <div className="file-thumbnail">{fileObj.thumbnail}</div>

                  <div className="file-info">
                    <span>
                      {/* Show file name with original size */}
                      {fileObj.file.name} {`(${fileObj.originalSize})`}
                    </span>
                  </div>
                  <div className="status">
                    {fileObj.status === "loading" && (
                      <div className="loader"></div> // Show only the loader, without "Processing..."
                    )}
                    {fileObj.status === "success" && fileObj.compressedSize && (
                      <a href={fileObj.url} download>
                        Download Compressed ({fileObj.compressedSize})
                      </a>
                    )}
                    {fileObj.status === "failed" && (
                      <span className="error">Failed: {fileObj.error}</span>
                    )}
                  </div>
                  <button
                    className="remove-file-btn"
                    onClick={() => handleRemoveFile(index)}
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default UploadComponent;
