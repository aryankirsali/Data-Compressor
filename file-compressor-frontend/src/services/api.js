import axios from "axios";

export const uploadFiles = async (files) => {
  const formData = new FormData();
  files.forEach((file) => formData.append("files", file));

  await axios.post("http://localhost:3001/api/files/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};
