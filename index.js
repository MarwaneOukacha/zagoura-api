import cors from 'cors';
import axios from 'axios';
import dotenv from 'dotenv';

// Load environment variables from .env
dotenv.config();

// CORS configuration for a single frontend origin
const corsOptions = {
    origin: "https://tiziri-camp-flfe.vercel.app", // Allow your frontend URL
    methods: ['POST'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true, // Allow cookies or authentication headers if needed
};

// Apply CORS middleware inside the serverless function
const corsMiddleware = cors(corsOptions);

// WhatsApp message sending logic
const sendWhatsAppMessage = async (From, message) => {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromWhatsApp = process.env.TWILIO_WHATSAPP_FROM;
    const toWhatsApp = process.env.TWILIO_WHATSAPP_TO;
    const contentSid = process.env.TWILIO_CONTENT_SID;
    const contentVariables = JSON.stringify({
        1: From,
        2: message,
    });

    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;

    try {
        const response = await axios.post(
            url,
            new URLSearchParams({
                From: fromWhatsApp,
                To: toWhatsApp,
                ContentSid: contentSid,
                ContentVariables: contentVariables,
            }),
            {
                auth: {
                    username: accountSid,
                    password: authToken,
                },
            }
        );
        return { success: true, sid: response.data.sid };
    } catch (error) {
        console.error('Failed to send message:', error.response?.data || error.message);
        return { success: false, error: error.response?.data || error.message };
    }
};

// Vercel API handler
export default async function handler(req, res) {
    // Apply CORS middleware
    corsMiddleware(req, res, async () => {
        if (req.method === 'POST') {
            const { From, message } = req.body;

            if (!From || !message) {
                return res.status(400).json({ error: 'Missing From or message parameter.' });
            }

            const result = await sendWhatsAppMessage(From, message);

            if (result.success) {
                res.status(200).json({ message: 'Message sent successfully!', sid: result.sid });
            } else {
                res.status(500).json({ error: result.error });
            }
        } else {
            res.setHeader('Allow', ['POST']);
            res.status(405).json({ error: `Method ${req.method} not allowed.` });
        }
    });
}
