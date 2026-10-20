import React from "react";
import ProfileImageUpload from "../ProfileImageUpload";

export default function ProfileSettings({ visible, setVisible, userId, onUploadSuccess }) {
  return (
    <section id="profile-settings" className={`upload-panel ${visible ? "visible" : ""}`}>
      <div className="section-heading">
        <h2>Profile photo</h2>
        <button type="button" className="btn btn-secondary" onClick={() => setVisible(false)}>Close</button>
      </div>
      {visible && <ProfileImageUpload userId={userId} onUploadSuccess={onUploadSuccess} />}
    </section>
  );
}
