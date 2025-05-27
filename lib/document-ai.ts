import { readFileSync } from 'fs';
import { join } from 'path';

// Read credentials from JSON file
const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || join(process.cwd(), 'google-credentials.json');
const credentials = JSON.parse(readFileSync(credentialsPath, 'utf-8'));

export async function extractTextFromDocument(fileBuffer: Buffer, mimeType: string): Promise<string> {
  try {
    const projectId = credentials.project_id;
    const location = 'us';
    const processorId = process.env.GOOGLE_PROCESSOR_ID;

    if (!projectId || !processorId) {
      throw new Error('Missing Google Cloud configuration');
    }

    // Convert the file buffer to base64
    const content = fileBuffer.toString('base64');

    const request = {
      name: `projects/${projectId}/locations/${location}/processors/${processorId}`,
      rawDocument: {
        content,
        mimeType,
      },
    };

    // Get access token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: generateJWT(credentials),
      }),
    });

    if (!tokenResponse.ok) {
      throw new Error('Failed to get access token');
    }

    const { access_token } = await tokenResponse.json();

    // Call Document AI API
    const response = await fetch(
      `https://${location}-documentai.googleapis.com/v1/projects/${projectId}/locations/${location}/processors/${processorId}:process`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Document AI API error: ${error.error?.message || 'Unknown error'}`);
    }

    const result = await response.json();
    if (!result.document?.text) {
      throw new Error('No text extracted from document');
    }

    return result.document.text;
  } catch (error) {
    console.error('Error processing document with Document AI:', error);
    throw error;
  }
}

// Helper function to generate JWT for Google Cloud authentication
function generateJWT(credentials: { 
  private_key: string; 
  client_email: string;
  private_key_id?: string;
}): string {
  const header = {
    alg: 'RS256',
    typ: 'JWT',
    ...(credentials.private_key_id && { kid: credentials.private_key_id }),
  };

  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: credentials.client_email,
    sub: credentials.client_email,
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
    scope: 'https://www.googleapis.com/auth/cloud-platform',
  };

  const encodedHeader = btoa(JSON.stringify(header));
  const encodedPayload = btoa(JSON.stringify(payload));

  const signatureInput = `${encodedHeader}.${encodedPayload}`;
  const signature = require('crypto')
    .createSign('RSA-SHA256')
    .update(signatureInput)
    .sign(credentials.private_key, 'base64');

  return `${signatureInput}.${signature}`;
} 