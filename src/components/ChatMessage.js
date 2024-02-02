import React, { useEffect, useState } from 'react';
import { auth } from '../firebase';
import { AssemblyAI } from 'assemblyai'
import {ReactComponent as Tick} from '../icons/tick.svg';


const client = new AssemblyAI({
  apiKey: process.env.REACT_APP_ASSEMBLY_AI_API_KEY
})

function ChatMessage(props) {
  const [colorBlindness, setColorBlindness] = useState(false);
  const selectedPreference = props.selectedPreference;
  const { text, uid, photoURL, audioURL, imageURL, createdAt } = props.message;
  let formattedTime = null;
  if (createdAt) {
    formattedTime = createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); // Assuming createdAt is a Firebase timestamp
  }
  const messageClass = uid === auth.currentUser.uid ? 'sent' : 'received';
  const [transcription, setTranscription] = useState(null);

  useEffect(() => {
    if (selectedPreference === 'cone-monochromacy' || selectedPreference === 'rod-monochromacy' || selectedPreference === 'protanopia' || selectedPreference === 'deuteranopia' || selectedPreference === 'tritanopia') {
      setColorBlindness(true);
    } else {
      setColorBlindness(false);
    }
  }, [selectedPreference]);

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
      <img className="rounded-full w-10 h-10" src={photoURL || 'https://api.adorable.io/avatars/23/abott@adorable.png'} alt="user" style={{marginTop:"auto"}}/>
      <div className={messageClass == 'sent'? "bg-blue-600 px-3 py-2 rounded-lg flex gap-x-2": "bg-slate-600 px-3 py-2 rounded-lg flex gap-x-2"}>
        {selectedPreference === 'Blindness' ? (
          <div>
            {text && <button className='border text-base p-1 rounded-lg' onClick={() => textToSpeech(text)}>Speak</button>}
          </div>
        ) : (
          !audioURL && <p>{text}</p>
        )}
        {selectedPreference === 'Deafness' && audioURL ? <p>{transcription}</p> : audioURL && <audio controls src={audioURL}></audio>}
        {imageURL && colorBlindness && <img src={imageURL} className={`rounded-xl ${selectedPreference}`} alt="image" style={{ width: '300px', aspectRatio: '[3/2]' }} />}
        {imageURL && !colorBlindness && <img src={imageURL} className="rounded-xl" alt="image" style={{ width: '300px', aspectRatio: '[3/2]' }} />}
        {formattedTime && 
          messageClass === 'sent' ?
          (<p className='text-xs flex items-end' style={{marginBottom:"-3px", marginRight:"-4px"}}>{formattedTime}&nbsp;<Tick className='h-4 w-4 fill-white'/></p>)
          :
          (<p className='text-xs flex items-end' style={{marginBottom:"-3px", marginRight:"-4px"}}>{formattedTime}</p>)
        }
      </div>
    </div>
  );
}

export default ChatMessage;