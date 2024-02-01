import React, { useEffect, useState } from 'react';
import { auth } from '../firebase';
import { AssemblyAI } from 'assemblyai'

const client = new AssemblyAI({
  apiKey: process.env.REACT_APP_ASSEMBLY_AI_API_KEY
})

function ChatMessage(props) {
  const selectedPreference = props.selectedPreference;
  const { text, uid, photoURL, audioURL, imageURL, createdAt } = props.message;
  const formattedTime = createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); // Assuming createdAt is a Firebase timestamp
  const messageClass = uid === auth.currentUser.uid ? 'sent' : 'received';
  const [transcription, setTranscription] = useState(null);

  const textToSpeech = (text) => {
    console.log("text to speech called");
    const synth = window.speechSynthesis;
    const utterance = new SpeechSynthesisUtterance(text);
    synth.speak(utterance);
  };

  const params = {
    audio: audioURL,
  };

  const speechToText = async () => {
    try {
      const transcript = await client.transcripts.transcribe(params);
      setTranscription(transcript.text);
    } catch (error) {
      console.log('Error converting audio to text:', error);
    }
  };


  useEffect(() => {
    speechToText();
    return () => {
      setTranscription(null);
    };
  }, [selectedPreference, audioURL]);

  return (
    <div className={`message ${messageClass} flex gap-x-1 items-center py-3`}>
      <img className="rounded-full w-10 h-10" src={photoURL || 'https://api.adorable.io/avatars/23/abott@adorable.png'} alt="user" />
      <div className={messageClass == 'sent'? "bg-blue-600 px-3 py-2 rounded-lg flex gap-x-2": "bg-slate-600 px-3 py-2 rounded-lg flex gap-x-2"}>
        {selectedPreference === 'Blindness' ? (
          <div>
            {text && <button onClick={() => textToSpeech(text)}>Speak</button>}
          </div>
        ) : (
          !audioURL && <p>{text}</p>
        )}
        {selectedPreference === 'Deafness' && audioURL ? <p className="bg-slate-50 px-4 py-2 rounded-3xl">{transcription}</p> : audioURL && <audio controls src={audioURL}></audio>}
        {imageURL && selectedPreference == "Color-Blindness" && <img src={imageURL} className={`rounded-xl ${selectedPreference}`} alt="image" style={{ width: '300px', aspectRatio: '[3/2]' }} />}
        {imageURL && !(selectedPreference === "Color-Blindness") && <img src={imageURL} className="rounded-xl" alt="image" style={{ width: '300px', aspectRatio: '[3/2]' }} />}
        <p className='text-xs flex items-end'>{formattedTime}</p>
      </div>
    </div>
  );
}

export default ChatMessage;