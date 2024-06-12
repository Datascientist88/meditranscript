import React, { useState } from "react";
import axios from "axios";
import { ReactMic } from "react-mic";
import "./App.css";

function App() {
  const [record, setRecord] = useState(false);
  const [loading, setLoading] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [fields, setFields] = useState({
    patientName: "",
    age: "",
    chiefComplaint: "",
    presentIllness: "",
    medicationHistory: "",
    familyHistory: "",
    labTests: ""
  });

  const startRecording = () => {
    setRecord(true);
  };

  const stopRecording = () => {
    setRecord(false);
  };

  const onStop = async (recordedBlob) => {
    setLoading(true);
    const formData = new FormData();
    formData.append("audio_data", recordedBlob.blob);

    try {
      const response = await axios.post("http://localhost:5000/transcribe", formData, {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      });

      const transcriptText = response.data.transcript;
      setTranscript(transcriptText);

      const fieldsResponse = await axios.post("http://localhost:5000/extract_fields", { transcript: transcriptText });
      setFields(fieldsResponse.data);
    } catch (error) {
      console.error("Error during transcription:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFieldChange = (e) => {
    const { name, value } = e.target;
    setFields(prevFields => ({
      ...prevFields,
      [name]: value
    }));
  };

  return (
    <div className="App">
      <h1>Medical Voice Transcription</h1>
      <div className="record-buttons">
        <button onClick={startRecording} disabled={record}>Start Recording</button>
        <button onClick={stopRecording} disabled={!record}>Stop Recording</button>
      </div>
      <ReactMic
        record={record}
        className="sound-wave"
        onStop={onStop}
        strokeColor="#000000"
        backgroundColor="#FF4081"
      />
      {loading && <p>Processing...</p>}
      <div className="fields-section">
        <h2>Extracted Fields:</h2>
        {Object.entries(fields).map(([field, value]) => (
          <div key={field}>
            <label htmlFor={field}>{field}:</label>
            <input type="text" name={field} value={value} onChange={handleFieldChange} />
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
