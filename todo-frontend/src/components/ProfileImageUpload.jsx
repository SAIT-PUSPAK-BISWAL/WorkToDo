
import React, { useEffect, useState } from "react";
import API from "../services/api";

const MAX_SIZE = 2 * 1024 * 1024;
const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function ProfileImageUpload({
  userId,
  onUploadSuccess,
}) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // Release preview URLs when the preview changes or the component unmounts.
  useEffect(() => {
    if (!preview) return undefined;

    return () => {
      URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];

    setError("");
    setMessage("");
    setFile(null);
    setPreview(null);

    if (!selectedFile) return;

    if (!ALLOWED_TYPES.includes(selectedFile.type)) {
      setError("Choose a JPEG, PNG, or WebP image.");
      e.target.value = "";
      return;
    }

    if (selectedFile.size > MAX_SIZE) {
      setError("Image must be 2 MB or smaller.");
      e.target.value = "";
      return;
    }

    setFile(selectedFile);
    setPreview(URL.createObjectURL(selectedFile));
  };

  const handleUpload = async () => {
    if (!file || !userId) {
      setError("Please select a valid image and log in again.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setMessage("");

      const formData = new FormData();
      formData.append("image", file);

      const { data } = await API.post(
        `/upload/${userId}`,
        formData
      );

      const newUrl = `${API_URL}${data.imageUrl}`;

      if (onUploadSuccess) {
        onUploadSuccess(newUrl);
      }

      setFile(null);
      setPreview(null);

      setMessage("Profile photo uploaded successfully.");

      // Allow selecting the same file again later.
      const input = document.getElementById("profile-image-input");
      if (input) input.value = "";
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Upload failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async () => {
    if (!userId) {
      setError("Please log in again before removing your photo.");
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to remove your profile photo?"
    );

    if (!confirmed) return;

    try {
      setLoading(true);
      setError("");
      setMessage("");

      await API.delete(`/upload/${userId}`);

      // App.jsx uses this callback to show the default avatar.
      if (onUploadSuccess) {
        onUploadSuccess(null);
      }

      setFile(null);
      setPreview(null);

      const input = document.getElementById("profile-image-input");
      if (input) input.value = "";

      setMessage("Profile photo removed successfully.");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Could not remove the profile photo. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ marginTop: "20px" }}>
      <h3>Update Profile Photo</h3>

      <input
        id="profile-image-input"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileChange}
        disabled={loading}
      />

      <p className="dashboard-subtitle">
        JPEG, PNG, or WebP. Maximum size: 2 MB.
      </p>

      {preview && (
        <div style={{ margin: "12px 0" }}>
          <p>Image preview</p>

          <img
            src={preview}
            alt="Selected profile preview"
            width="160"
            style={{
              display: "block",
              maxWidth: "100%",
              borderRadius: "12px",
              objectFit: "cover",
            }}
          />
        </div>
      )}

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "10px",
          marginTop: "12px",
        }}
      >
        {file && (
          <button
            type="button"
            className="btn"
            onClick={handleUpload}
            disabled={loading}
          >
            {loading ? "Please wait..." : "Upload Photo"}
          </button>
        )}

        <button
          type="button"
          className="btn btn-danger"
          onClick={handleRemove}
          disabled={loading}
        >
          {loading ? "Please wait..." : "Remove Profile Photo"}
        </button>
      </div>

      {error && (
        <p role="alert" style={{ color: "red", marginTop: "12px" }}>
          {error}
        </p>
      )}

      {message && (
        <p role="status" style={{ marginTop: "12px" }}>
          {message}
        </p>
      )}
    </div>
  );
}
