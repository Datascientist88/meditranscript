from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import openai
import os
import tempfile
load_dotenv()
app = Flask(__name__)
CORS(app)

openai.api_key = os.getenv("OPENAI_API_KEY")

client = openai

def speech_to_text(audio_data_path):
    with open(audio_data_path, "rb") as audio_file:
        transcript = client.audio.transcriptions.create(
            model="whisper-1",
            response_format="text",
            file=audio_file
        )
    return transcript

def extract_fields(transcript):
    prompt = f"""
    You are a medical transcription service provider. Your main task is to extract all relevant fields of text from the transcript: {transcript}
    and display them in a user form format. Please strictly adhere to the following format template:
    **Patient Name:**
    **Patient Age:**
    **Chief Complaint:**
    **Patient History:**
    **Diagnosis:**
    **Family History:**
    **Medications Used:**
    **Required Lab Tests and Procedures:**

    Display each field on a new line, do not combine them into one sentence. Your main job is to facilitate data entry for doctors.
    """
    response = client.chat.completions.create(
        model="gpt-4",
        messages=[
            {"role": "system", "content": "You are a helpful assistant."},
            {"role": "user", "content": prompt}
        ]
    )
    return response.choices[0].message.content

@app.route("/transcribe", methods=["POST"])
def transcribe():
    if "audio_data" not in request.files:
        return jsonify({"error": "No audio file provided"}), 400

    audio_file = request.files["audio_data"]
    supported_formats = ['flac', 'm4a', 'mp3', 'mp4', 'mpeg', 'mpga', 'oga', 'ogg', 'wav', 'webm']
    file_extension = audio_file.filename.split('.')[-1].lower()
    if file_extension not in supported_formats:
        return jsonify({"error": f"Unsupported file format: {file_extension}. Supported formats: {supported_formats}"}), 400

    with tempfile.NamedTemporaryFile(delete=False, suffix=f".{file_extension}") as temp_audio:
        audio_file.save(temp_audio.name)
        temp_audio_path = temp_audio.name

    try:
        transcript_result = speech_to_text(temp_audio_path)
    finally:
        os.remove(temp_audio_path)

    return jsonify({"transcript": transcript_result.get("text", "")})

@app.route("/extract_fields", methods=["POST"])
def extract():
    data = request.get_json()
    transcript = data.get("transcript", "")
    if not transcript:
        return jsonify({"error": "No transcript provided"}), 400

    fields_result = extract_fields(transcript)
    fields = {
        "patientName": fields_result.split("**Patient Name:**")[1].split("**Patient Age:**")[0].strip(),
        "age": fields_result.split("**Patient Age:**")[1].split("**Chief Complaint:**")[0].strip(),
        "chiefComplaint": fields_result.split("**Chief Complaint:**")[1].split("**Patient History:**")[0].strip(),
        "presentIllness": fields_result.split("**Patient History:**")[1].split("**Diagnosis:**")[0].strip(),
        "medicationHistory": fields_result.split("**Diagnosis:**")[1].split("**Family History:**")[0].strip(),
        "familyHistory": fields_result.split("**Family History:**")[1].split("**Medications Used:**")[0].strip(),
        "labTests": fields_result.split("**Medications Used:**")[1].split("**Required Lab Tests and Procedures:**")[0].strip(),
    }
    return jsonify(fields)

if __name__ == "__main__":
    app.run(debug=True)
