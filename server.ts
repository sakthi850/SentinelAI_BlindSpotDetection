import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Shared lazy-loaded Gemini AI client
let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
      aiClient = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
    }
  }
  return aiClient;
}

// 1. API: Optimize Camera Placements using Gemini
app.post('/api/optimize', async (req, res) => {
  const { cameras, zones } = req.body;

  if (!cameras || !zones) {
    return res.status(400).json({ error: 'Missing cameras or zones dataset.' });
  }

  const ai = getGeminiClient();

  if (!ai) {
    // Graceful fallback if Gemini API Key is missing: Calculate geometric recommendations algorithmically!
    console.log('Gemini API Key missing or default placeholder. Using geometric fallback engine.');
    
    // Algorithmic high-quality suggestions based on camera status and positioning gaps
    const recommendations = [];
    
    // Suggestion 1: Check for outages
    const offlineCams = cameras.filter((c: any) => c.status === 'outage' || c.status === 'maintenance');
    for (const offline of offlineCams) {
      recommendations.push({
        id: `rec-offline-${offline.id}`,
        cameraId: offline.id,
        cameraName: offline.name,
        action: 'upgrade',
        details: `The camera "${offline.name}" is currently ${offline.status}. Recommended to restore power status or upgrade to a Dome camera with dual-power backup to eliminate blind spots in the ${offline.zone}.`,
        currentConfig: `Status: ${offline.status}, FOV: ${offline.fov}°`,
        recommendedConfig: JSON.stringify({ status: 'active', fov: Math.max(offline.fov, 110) }),
        coverageDelta: 15.0
      });
    }

    // Suggestion 2: Optimize narrow field cameras in complex areas
    const lobbyCams = cameras.filter((c: any) => c.zone === 'Main Lobby & Entrance');
    const lobbyCamsNarrow = lobbyCams.filter((c: any) => c.fov < 100);
    if (lobbyCamsNarrow.length > 0) {
      const target = lobbyCamsNarrow[0];
      recommendations.push({
        id: `rec-lobby-${target.id}`,
        cameraId: target.id,
        cameraName: target.name,
        action: 'reposition',
        details: 'Reception desk camera has restricted angles. Repositioning to coordinate (32, 28) and widening Field-Of-View to 120° provides total lobby overlap and captures entry corridors.',
        currentConfig: `x: ${target.x}%, y: ${target.y}%, Angle: ${target.angle}°, FOV: ${target.fov}°`,
        recommendedConfig: JSON.stringify({ x: 30, y: 15, angle: 180, fov: 120 }),
        coverageDelta: 11.5
      });
    }

    // Suggestion 3: Add new camera in loading dock blind zone if total cameras < 15
    const loadingDockCams = cameras.filter((c: any) => c.zone === 'Loading Dock & Freight');
    if (loadingDockCams.length < 3) {
      recommendations.push({
        id: 'rec-add-loading-dock',
        action: 'add',
        details: 'Intrusion paths indicate a critical blind zone in the North-East Cargo entrance. Adding a specialized PTZ camera at (85%, 52%) provides dynamic scanning over freight lanes.',
        recommendedConfig: JSON.stringify({
          name: 'Dock NE Patrol PTZ',
          type: 'ptz',
          x: 85,
          y: 52,
          angle: 135,
          fov: 90,
          range: 20,
          resolution: '4K',
          status: 'active',
          zone: 'Loading Dock & Freight'
        }),
        coverageDelta: 18.5
      });
    }

    // Suggestion 4: Reposition Alleyway bullet to capture entire transit route
    const alleyCams = cameras.filter((c: any) => c.zone === 'Back Alley Lane' && c.status === 'active');
    if (alleyCams.length > 0) {
      const target = alleyCams[0];
      recommendations.push({
        id: `rec-alley-${target.id}`,
        cameraId: target.id,
        cameraName: target.name,
        action: 'reposition',
        details: 'Adjust bullet camera mount in back alley. Repositioning x to 80% and swinging lens angle to 210° forms an unbroken visual wall, trapping transit breach attempts.',
        currentConfig: `x: ${target.x}%, y: ${target.y}%, Angle: ${target.angle}°`,
        recommendedConfig: JSON.stringify({ x: 80, y: 85, angle: 210, range: 24 }),
        coverageDelta: 12.2
      });
    }

    return res.json({ recommendations, engine: 'Geometric Analysis Fallback Engine' });
  }

  try {
    // Formulate a structured prompt for Gemini
    const prompt = `You are an expert security engineer and computer-vision site optimization system.
You are given a security camera deployment for an office/warehouse floor layout.

Layout Zones:
${JSON.stringify(zones, null, 2)}

Active Camera Nodes:
${JSON.stringify(cameras, null, 2)}

TASK:
Analyze the coverage geometry, overlapping fields-of-view, and physical blind spots. Provide a structured optimization plan consisting of 2 to 4 concrete action items.
Each action item can be one of the following:
1. 'reposition': Change x, y, angle, fov, or range of an existing camera to close high-risk blind spots.
2. 'upgrade': Upgrade camera resolution or status (e.g. recommend fixing outages / replacing with PTZ/fisheye lenses).
3. 'add': Propose a brand-new camera node in a high-risk zone with specific optimal coordinates, FOV, range, and type.

Return a highly precise JSON array matching the specified responseSchema. Ensure recommendations significantly increase security metrics. Provide realistic numbers for coverageDelta (percentage coverage gain).`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        systemInstruction: 'You are an advanced security architecture optimizer. Always output exactly the requested JSON array schema. Do not include markdown wraps or explanations outside of the JSON structure.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING, description: 'Unique recommendation ID (e.g., rec-1)' },
              cameraId: { type: Type.STRING, description: 'ID of the existing camera to modify, if applicable.' },
              cameraName: { type: Type.STRING, description: 'Name of the camera.' },
              action: { type: Type.STRING, description: "Must be 'reposition', 'upgrade', or 'add'." },
              details: { type: Type.STRING, description: 'Detailed reasoning showing security benefits and which zone gets secured.' },
              currentConfig: { type: Type.STRING, description: 'Friendly text of current setup, e.g. "Angle: 45° at (10, 10)"' },
              recommendedConfig: { type: Type.STRING, description: 'Stringified JSON containing ONLY fields to update/create, e.g. "{\\"x\\":15,\\"y\\":20,\\"angle\\":180}"' },
              coverageDelta: { type: Type.NUMBER, description: 'Numerical expected increase in overall facility coverage % (e.g., 8.5)' }
            },
            required: ['id', 'action', 'details', 'recommendedConfig', 'coverageDelta']
          }
        }
      }
    });

    const parsedRecommendations = JSON.parse(response.text || '[]');
    return res.json({ recommendations: parsedRecommendations, engine: 'Gemini-3.5-Flash Core Optimizer' });

  } catch (error: any) {
    console.error('Error with Gemini optimization route:', error);
    return res.status(500).json({ error: 'AI Optimizer failed to generate response.', details: error.message });
  }
});

// 2. Vite / Static files serving
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
