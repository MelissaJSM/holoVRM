import type { NextApiRequest, NextApiResponse } from 'next';
import NaturalLanguageUnderstandingV1 from 'ibm-watson/natural-language-understanding/v1';
import { IamAuthenticator } from 'ibm-watson/auth';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const naturalLanguageUnderstanding = new NaturalLanguageUnderstandingV1({
    version: '2022-04-07',
    authenticator: new IamAuthenticator({
        apikey: process.env.IBM_API_KEY || '',
    }),
    serviceUrl: process.env.IBM_SITE_URL || '',
});

interface MyMemoryResponse {
    responseData: {
        translatedText: string;
    };
    quotaFinished: boolean;
    mtLangSupported: string;
    responseDetails: string;
    responseStatus: number;
    responderId: string;
    exception_code?: string;
    matches: Array<{
        id: string;
        segment: string;
        translation: string;
        source: string;
        target: string;
        quality: string;
        reference: string;
        usageCount: number;
        subject: string;
        createdBy: string;
        lastUpdatedBy: string;
        createDate: string;
        lastUpdateDate: string;
        match: number;
    }>;
}

const translateText = async (text: string, targetLang: string): Promise<string> => {
    const response = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=ko|${targetLang}`);
    const data = await response.json() as MyMemoryResponse;
    if (data.responseData) {
        //console.log(`Translated text: ${data.responseData.translatedText}`);
        return data.responseData.translatedText;
    }
    throw new Error('Translation failed');
};

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
    const { text } = req.body;

    if (!text) {
        return res.status(400).json({ error: 'Text is required' });
    }

    try {
        const translatedText = await translateText(text, 'en');

        // Ensure the translated text is in English by setting the language explicitly
        const analyzeParams = {
            text: translatedText,
            features: {
                emotion: {}
            },
            language: 'en' // Explicitly set the language to English
        };

        const analysisResults = await naturalLanguageUnderstanding.analyze(analyzeParams);

        if (analysisResults.result?.emotion?.document?.emotion) {
            const emotions = analysisResults.result.emotion.document.emotion;
            return res.status(200).json({
                //translatedText,  // Include translated text in the response
                기쁨: emotions.joy ?? 0,
                공포: emotions.fear ?? 0,
                슬픔: emotions.sadness ?? 0,
                역겨움: emotions.disgust ?? 0,
                화남: emotions.anger ?? 0
            });
        } else {
            return res.status(500).json({ error: 'Emotion analysis result is undefined' });
        }
    } catch (error) {
        console.error('Error:', error);
        if (error instanceof Error) {
            return res.status(500).json({ error: error.message });
        } else {
            return res.status(500).json({ error: 'Unknown error occurred' });
        }
    }
};

export default handler;
