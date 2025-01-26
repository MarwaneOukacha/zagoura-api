import express from 'express';
import axios from 'axios';
import dotenv from 'dotenv';
import cors from 'cors';

// Charger les variables d'environnement depuis le fichier .env
dotenv.config();

const app = express();
const port = 4000;

// Middleware pour parser le JSON
app.use(express.json());

// CORS Configuration
const corsOptions = {
    origin: 'http://localhost:3000', // Allow your frontend URL
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true, // Allow cookies or authentication headers if needed
};

app.use(cors(corsOptions));

app.options('*', cors());

export const sendWhatsAppMessage = async (From, message) => {
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

app.post('/send-message', async (req, res) => {
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
});

app.listen(port, () => {
    console.log(`API en cours d'exécution sur http://localhost:${port}`);
});
