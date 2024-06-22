import React, { useState } from "react";
import axios from "axios";
import { ReactMic } from "react-mic";
import Loader from "./Loader";
import "./App.css";

function App() {
  const [record, setRecord] = useState(false);
  const [loading, setLoading] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [fields, setFields] = useState({
    personalHistory: "",
    chiefComplaint: "",
    presentIllness: "",
    medicationHistory: "",
    pastHistory: "",
    familyHistory: "",
    requiredLabTestsAndProcedures: "",
  });
  const [theme, setTheme] = useState("light");

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === "light" ? "dark" : "light"));
  };

  const startRecording = () => {
    setRecord(true);
  };

  const stopRecording = () => {
    setRecord(false);
  };

  const onStop = async (recordedBlob) => {
    setLoading(true);

    const audioFile = new File([recordedBlob.blob], "temp.wav", {
      type: "audio/wav",
    });
    const formData = new FormData();
    formData.append("audio_data", audioFile);

    try {
      const response = await axios.post(
        "http://localhost:5000/transcribe",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      const transcriptText = response.data.transcript;
      setTranscript(transcriptText);

      const fieldsResponse = await axios.post(
        "http://localhost:5000/extract_fields",
        { transcript: transcriptText }
      );
      setFields(fieldsResponse.data);
    } catch (error) {
      console.error("Error during transcription:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFieldChange = (e) => {
    const { name, value } = e.target;
    setFields((prevFields) => ({
      ...prevFields,
      [name]: value,
    }));
  };

  const handleNewRecording = () => {
    setTranscript("");
    setFields({
      personalHistory: "",
      chiefComplaint: "",
      presentIllness: "",
      medicationHistory: "",
      pastHistory: "",
      familyHistory: "",
      requiredLabTestsAndProcedures: "",
    });
  };

  return (
    <div className={`App ${theme}`}>
      <div className="sidebar">
        <h1>Medical Voice Transcription</h1>
        <div className="theme-toggle">
          <label className="toggle-switch">
            <input type="checkbox" checked={theme === "dark"} onChange={toggleTheme} />
            <span className="slider"></span>
          </label>
        </div>
        <div className="record-buttons">
          <button onClick={startRecording} disabled={record}>
            Start Recording
          </button>
          <button onClick={stopRecording} disabled={!record}>
            Stop Recording
          </button>
        </div>
        <ReactMic
          record={record}
          className="sound-wave"
          onStop={onStop}
          strokeColor="#ff38bf"
          visualSetting="frequencyBars"
          backgroundColor="#FFFFFF"
        />
           {loading && (
          <div className="loader-container">
            <Loader />
          </div>
        )}
        <button onClick={handleNewRecording}>New Recording</button>
      </div>
      <div className="main-content">
        <div className="fields-section">
          <h2>Extracted Fields:</h2>
          <div>
            <label htmlFor="personalHistory">Personal History:</label>
            <textarea
              name="personalHistory"
              value={fields.personalHistory}
              onChange={handleFieldChange}
            />
          </div>
          <div>
            <label htmlFor="chiefComplaint">Chief Complaint:</label>
            <textarea
              name="chiefComplaint"
              value={fields.chiefComplaint}
              onChange={handleFieldChange}
            />
          </div>
          <div>
            <label htmlFor="presentIllness">Present Illness:</label>
            <textarea
              name="presentIllness"
              value={fields.presentIllness}
              onChange={handleFieldChange}
            />
          </div>
          <div>
            <label htmlFor="medicationHistory">Medication History:</label>
            <textarea
              name="medicationHistory"
              value={fields.medicationHistory}
              onChange={handleFieldChange}
            />
          </div>
          <div>
            <label htmlFor="pastHistory">Past History:</label>
            <textarea
              name="pastHistory"
              value={fields.pastHistory}
              onChange={handleFieldChange}
            />
          </div>
          <div>
            <label htmlFor="familyHistory">Family History:</label>
            <textarea
              name="familyHistory"
              value={fields.familyHistory}
              onChange={handleFieldChange}
            />
          </div>
          <div>
            <label htmlFor="requiredLabTestsAndProcedures">Required Lab Tests and Procedures:</label>
            <textarea
              name="requiredLabTestsAndProcedures"
              value={fields.requiredLabTestsAndProcedures}
              onChange={handleFieldChange}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
