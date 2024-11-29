import recorder from 'node-record-lpcm16';
import speech from 'speech-to-text';

export async function convertVoiceToText(audioBuffer) {
  try {
    const result = await speech.recognize(audioBuffer, {
      language: 'en-US',
    });
    return result.text;
  } catch (error) {
    console.error('Error converting voice to text:', error);
    throw error;
  }
}