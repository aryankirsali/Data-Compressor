import axios from "axios";

// Function to upload files to the backend
export const uploadFiles = async (files) => {
  const formData = new FormData();
  files.forEach((file) => {
    formData.append("files", file);
  });

  try {
    const response = await axios.post("/api/files/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data; // Return the list of compressed files or any other necessary info
  } catch (error) {
    console.error("Error uploading files:", error);
    throw error;
  }
};

// Function to fetch the download URL for a compressed file
export const getDownloadUrl = async (filename) => {
  try {
    const response = await axios.get(`/api/files/download/${filename}`);
    return response.data.downloadUrl;
  } catch (error) {
    console.error("Error fetching download URL:", error);
    throw error;
  }
};
