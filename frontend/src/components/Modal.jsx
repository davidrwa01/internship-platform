import React, { useState } from "react";

const Modal = ({ onClose }) => {
  const [trainings, setTrainings] = useState([""]);

  const addTraining = () => setTrainings([...trainings, ""]);
  const removeTraining = (i) =>
    setTrainings(trainings.filter((_, index) => index !== i));

  const handleSubmit = (e) => {
    e.preventDefault();
    alert("Company registration submitted successfully!");
    onClose();
  };

  return (
    <div className="modal" style={{ display: "flex" }}>
      <div className="modal-content">
        <span className="close-modal" onClick={onClose}>
          &times;
        </span>
        <h2 className="modal-title">Register Your Company</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Company Name</label>
            <input type="text" className="form-control" required />
          </div>
          <div className="form-group">
            <label>Email Address</label>
            <input type="email" className="form-control" required />
          </div>
          <div className="form-group">
            <label>Phone Number</label>
            <input type="tel" className="form-control" required />
          </div>
          <div className="form-group">
            <label>Physical Location</label>
            <select className="form-control" required>
              <option value="">Select Location</option>
              <option value="kigali">Kigali</option>
              <option value="eastern">Eastern Province</option>
              <option value="western">Western Province</option>
              <option value="northern">Northern Province</option>
              <option value="southern">Southern Province</option>
            </select>
          </div>
          <div className="form-group">
            <label>Trainings/Internships Offered</label>
            {trainings.map((t, i) => (
              <div key={i} className="training-item">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Training field (e.g., ICT, Hospitality)"
                  required
                />
                {trainings.length > 1 && (
                  <button
                    type="button"
                    className="remove-training"
                    onClick={() => removeTraining(i)}
                  >
                    &times;
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              className="add-training"
              onClick={addTraining}
            >
              Add Another Training
            </button>
          </div>
          <div className="form-group">
            <label>Company Description</label>
            <textarea className="form-control" rows="4"></textarea>
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: "100%" }}>
            Register Company
          </button>
        </form>
      </div>
    </div>
  );
};

export default Modal;
