import React, { useRef, useState, useEffect } from 'react';
import { auth, firestore, storage, firebase } from '../firebase';
import { useCollectionData } from 'react-firebase-hooks/firestore';
import { ReactMic } from 'react-mic';
import ChatMessage from './ChatMessage';
import notificationSoundFile from '../audio/notification.mp3';
import {ReactComponent as Clip} from '../icons/clip.svg';
import {ReactComponent as Mic} from '../icons/mic.svg';
import {ReactComponent as Send} from '../icons/send.svg';


function ChatRoom(props) {
  const [notificationSound] = useState(new Audio(notificationSoundFile));
  const selectedPreference = props.selectedPreference;
  const chatBoxRef = useRef();
  const messagesRef = firestore.collection('messages');
  const query = messagesRef.orderBy('createdAt');
  const [messages] = useCollectionData(query, { idField: 'id' });

  const [formValue, setFormValue] = useState('');
  const [record, setRecord] = useState(false);
  const [blob, setBlob] = useState(null);
  const [image, setImage] = useState(null);

  useEffect(() => {
    const unsubscribe = messagesRef.onSnapshot((snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added' && document.hidden) {
          notificationSound.play();
        }
      });
    });

    const chatBoxElement = chatBoxRef.current;
    if (chatBoxElement && !formValue) {
      chatBoxElement.scrollIntoView({ behavior: 'smooth' });
    }

    return () => unsubscribe();
  }, [notificationSound, messagesRef]);

  const onRecordingComplete = (blobObject) => {
    setBlob(blobObject.blob);
  };

  const renderAudio = () => {
    if (blob) {
      const audioUrl = URL.createObjectURL(blob);
      return (
        <div>
          <audio controls>
            <source src={audioUrl} type="audio/wav" />
            Your browser does not support the audio element.
          </audio>
        </div>
      );
    }
    return null;
  };

  const renderImage = () => {
    if (image) {
      const imageUrl = URL.createObjectURL(image);
      console.log('Image URL:', imageUrl);

      return (
        <div>
          <img src={imageUrl} alt="image" style={{ height: '200px', width: '300px', borderRadius: '0' }} />
        </div>
      );
    }
    return null;
  };

  const sendVoiceMessage = async () => {
    console.log("voice uplaod called");
    const { uid, photoURL } = auth.currentUser;

    // Upload audio file to Firebase Storage
    const storageRef = storage.ref();
    const audioRef = storageRef.child(`${uid}/${new Date().toISOString()}.wav`);
    await audioRef.put(blob);

    // Get the URL of the uploaded audio
    const audioURL = await audioRef.getDownloadURL();

    // Add voice message to Firestore
    await messagesRef.add({
      audioURL,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      uid,
      photoURL,
    });

    setBlob(null);
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    setImage(file);
  };

  const handleImageUpload = async () => {
    const { uid, photoURL } = auth.currentUser;

    // Upload image to Firebase Storage
    const storageRef = storage.ref();
    const imageRef = storageRef.child(`${uid}/${new Date().toISOString()}.jpg`);
    await imageRef.put(image);

    // Get the URL of the uploaded image
    const imageURL = await imageRef.getDownloadURL();

    // Add image message to Firestore
    await messagesRef.add({
      imageURL,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      uid,
      photoURL,
    });

    setImage(null);
  };

  const sendMessage = async (e) => {
    e.preventDefault();

    // Send text message
    if (formValue.trim() !== '') {
      const { uid, photoURL } = auth.currentUser;
      await messagesRef.add({
        text: formValue,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        uid,
        photoURL,
      });
      setFormValue('');
    }

    if (blob) {
      await sendVoiceMessage();
    }
    if (image) {
      await handleImageUpload();
    }
  };


  return (
    <>
      <main id="chat-box-screen" className="overflow-y-scroll chat-box-screen flex flex-col p-2 gap-y-5 bg-gray-900">
        <div  className='flex min-h-full flex-col no-scrollbar'>
          {messages && messages.map((msg) => (
            <ChatMessage key={msg.id} message={msg} selectedPreference={selectedPreference} />
          ))}
          {renderAudio()}
          {renderImage()}
          <span ref={chatBoxRef}></span>
        </div>
      </main>

      <form onSubmit={sendMessage} className="form fixed right-0 left-0 bottom-0 h-15 flex items-center justify-between px-2 bg-slate-800 text-slate-50">
        {!record && <input
          type="text" id="message_input"
          className="bg-gray-600 h-11 w-4/5 text-slate-50 outline-none text-lg rounded-lg px-2 absolute"
          placeholder="Type a message..."
          onChange={(e) => setFormValue(e.target.value)}
          value={formValue}
          autoComplete='off'
        />}
        <ReactMic
          record={record}
          onStop={onRecordingComplete}
          strokeColor="#fff"
          backgroundColor="#364050"
        />

        <label htmlFor="file-upload" className="cursor-pointer p-1">
          <Clip className="w-8 h-8 fill-white" />
        </label>
        <input 
          id="file-upload"
          type='file'
          accept="image/*"
          onChange={handleImageChange}
          className='hidden'
        />

        <div className='cursor-pointer p-1' onClick={() => setRecord(!record)}>
          <Mic className="w-8 h-8 fill-white"/>
        </div>

        <button className='cursor-pointer p-1' type="submit" disabled={!formValue && !blob && !image}>
          <Send className="w-8 h-8 fill-white" />
        </button>
      </form>
    </>
  );
}

export default ChatRoom;