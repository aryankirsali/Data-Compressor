import React, { useState } from "react";
import { uploadFiles as apiUploadFiles } from "../services/api"; // Import the uploadFiles function
import "../styles/UploadComponent.css";

const UploadComponent = () => {
  const [files, setFiles] = useState([]);

  const handleFileChange = (e) => {
    const selectedFiles = e.target.files;
    console.log("Selected files:", selectedFiles); // Log selected files
    const fileArray = Array.from(selectedFiles).map((file) => ({
      file: file,
      size: formatFileSize(file.size),
      status: "loading", // Set status as "loading" initially
      url: null,
      thumbnail: file.type.startsWith("image/")
        ? URL.createObjectURL(file)
        : null,
    }));
    console.log("Formatted file array:", fileArray); // Log formatted file array
    setFiles([...fileArray]);
  };

  const formatFileSize = (size) => {
    let formattedSize = "";
    if (size < 1024) {
      formattedSize = `${size.toFixed(2)} bytes`;
    } else if (size < 1048576) {
      formattedSize = `${(size / 1024).toFixed(2)} KB`;
    } else {
      formattedSize = `${(size / 1048576).toFixed(2)} MB`;
    }
    console.log("Formatted file size:", formattedSize); // Log file size formatting
    return formattedSize;
  };

  const uploadFiles = async () => {
    console.log("Starting upload for files:", files); // Log files to be uploaded
    try {
      // Start the upload for each file
      const uploadedFiles = await apiUploadFiles(
        files.map((fileObj) => fileObj.file)
      );

      uploadedFiles.forEach((fileObj, index) => {
        const newFiles = [...files];
        newFiles[index].status = "uploaded"; // Mark file as uploaded
        newFiles[index].url = fileObj.downloadUrl; // Set the URL from API response
        newFiles[index].newSize = formatFileSize(fileObj.size); // Set compressed size from API response
        console.log("Updated file after upload:", newFiles[index]); // Log updated file after upload
        setFiles(newFiles);
      });
    } catch (error) {
      console.error("Error uploading files:", error);
      files.forEach((fileObj, index) => {
        const newFiles = [...files];
        newFiles[index].status = "error"; // Mark file as error
        setFiles(newFiles);
      });
    }
  };

  const handleRemoveFile = (index) => {
    console.log(`Removing file at index ${index}`); // Log file removal
    const updatedFiles = files.filter((_, fileIndex) => fileIndex !== index);
    setFiles(updatedFiles);
    console.log("Updated file list after removal:", updatedFiles); // Log updated file list after removal
  };

  return (
    <div className="upload-component">
      <div className="upload-box">
        <input
          type="file"
          multiple
          onChange={handleFileChange}
          accept=".txt,.jpg,.png,.pdf,.zip,.rar,.tar"
          disabled={files.length >= 5}
        />
        <button onClick={uploadFiles} disabled={files.length === 0}>
          Upload Files
        </button>

        <div className="file-list">
          {files.length > 0 && (
            <ul>
              {files.map((fileObj, index) => (
                <li key={index} className="file-item">
                  {fileObj.thumbnail && (
                    <img
                      src={fileObj.thumbnail}
                      alt={fileObj.file.name}
                      className="file-thumbnail"
                    />
                  )}
                  <div className="file-info">
                    <span>
                      {fileObj.file.name} ({fileObj.size})
                    </span>
                    {fileObj.status === "uploaded" && (
                      <span className="compressed-size">
                        <br />
                        Compressed Size: {fileObj.newSize}
                      </span>
                    )}
                  </div>
                  <div className="status">
                    {fileObj.status === "loading" && (
                      <div className="loader"></div>
                    )}
                    {fileObj.status === "uploaded" && (
                      <a href={fileObj.url} download>
                        Download Compressed File ({fileObj.newSize})
                      </a>
                    )}
                    {fileObj.status === "error" && (
                      <span className="error">Failed to upload</span>
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
