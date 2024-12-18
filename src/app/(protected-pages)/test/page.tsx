"use client";

import { useState } from "react";

const UploadPDF = () => {
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState("");
  const [retrievedFile, setRetrievedFile] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleUpload = async () => {
    if (!file) {
      alert("Please select a file first.");
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const base64File = reader.result?.toString().split(",")[1]; // Extract Base64 content
      if (!base64File) return alert("Failed to read file.");

      try {
        setLoading(true);
        const response = await fetch("/api/test", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileName: file.name,
            fileContent: base64File,
          }),
        });

        if (response.ok) {
          alert("File uploaded successfully!");
        } else {
          const data = await response.json();
          alert(`Error: ${data.error}`);
        }
      } catch (error) {
        console.error("Upload error:", error);
        alert("File upload failed.");
      } finally {
        setLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRetrieve = async () => {
    if (!fileName) {
      alert("Please enter a file name.");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/api/test?fileName=${fileName}`);
      const data = await response.json();

      if (response.ok && data.fileContent) {
        const blob = new Blob([Buffer.from(data.fileContent, "base64")], { type: "application/pdf" });
        const fileURL = URL.createObjectURL(blob);
        setRetrievedFile(fileURL);
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error("Download error:", error);
      alert("Failed to retrieve file.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Upload PDF</h2>
      <input type="file" accept=".pdf" onChange={(e) => setFile(e.target.files?.[0] || null)} />
      <button onClick={handleUpload} disabled={loading}>
        {loading ? "Uploading..." : "Upload PDF"}
      </button>

      <hr />

      <h2>Retrieve PDF</h2>
      <input
        type="text"
        placeholder="Enter file name"
        value={fileName}
        onChange={(e) => setFileName(e.target.value)}
      />
      <button onClick={handleRetrieve} disabled={loading}>
        {loading ? "Retrieving..." : "Get PDF"}
      </button>

      {retrievedFile && (
        <div>
          <h3>Downloaded File</h3>
          <iframe src={retrievedFile} width="100%" height="500px" title="PDF Viewer" />
        </div>
      )}
    </div>
  );
};

export default UploadPDF;
