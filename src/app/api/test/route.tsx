import { NextRequest, NextResponse } from "next/server";
import * as ftp from "basic-ftp";
import { Readable, Writable } from 'stream';

export async function POST(req: NextRequest) {
  const { fileName, fileContent } = await req.json();

  if (!fileName || !fileContent) {
    return NextResponse.json({ error: "Missing file name or content" }, { status: 400 });
  }

  const client = new ftp.Client();
  client.ftp.verbose = true; // Enable logs for debugging

  try {
    // FTP credentials
    const host = "storage.bunnycdn.com"; // Host from your screenshot
    const user = "ibr-resumes";      // Your username
    const password = "85f77125-3524-498e-9a9655a805b7-690d-4600"; // Secure FTP password

    // Connect to FTP server
    await client.access({
      host,
      user,
      password,
      port: 21, // Default FTP port
      secure: false, // Bunny.net uses Passive FTP
    });

    // Convert Buffer to Readable stream
    const fileBuffer = Buffer.from(fileContent, "base64");
    const uploadPath = `/temp/${fileName}`;
    
    const stream = Readable.from(fileBuffer);
    await client.uploadFrom(stream, uploadPath);

    return NextResponse.json({ message: "File uploaded successfully!" }, { status: 200 });
  } catch (error) {
    console.error("FTP Upload Error:", error);
    return NextResponse.json({ error: "File upload failed." }, { status: 500 });
  } finally {
    client.close();
  }
}


export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const fileName = searchParams.get("fileName");
  
    if (!fileName) {
      return NextResponse.json({ error: "Missing file name." }, { status: 400 });
    }
  
    const client = new ftp.Client();
    client.ftp.verbose = true;
  
    try {
      // FTP credentials
      const host = "storage.bunnycdn.com";
      const user = "ibr-resumes";
      const password = "85f77125-3524-498e-9a9655a805b7-690d-4600";
  
      await client.access({ host, user, password, port: 21, secure: false });
  
      // Download file to buffer
      const fileBuffer: Buffer[] = [];
      const writable = new Writable({
        write(chunk, encoding, callback) {
          fileBuffer.push(chunk);
          callback();
        }
      });
  
      await client.downloadTo(writable, `/temp/${fileName}`);
  
      const fileBase64 = Buffer.concat(fileBuffer).toString("base64");
  
      return NextResponse.json({ fileName, fileContent: fileBase64 }, { status: 200 });
    } catch (error) {
      console.error("FTP Download Error:", error);
      return NextResponse.json({ error: "Failed to download file." }, { status: 500 });
    } finally {
      client.close();
    }
  }