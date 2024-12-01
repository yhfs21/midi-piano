'use client';

import { useEffect, useState } from "react";

// ノート番号を音名に変換する関数
const getNoteName = (noteNumber) => {
  const notes = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  const octave = Math.floor(noteNumber / 12) - 1; // オクターブを計算
  const note = notes[noteNumber % 12]; // ノート名を計算
  return `${note}${octave}`; // "C4" のような形式で返す
};

export default function Home() {
  const [notes, setNotes] = useState([]);

  useEffect(() => {
    const initializeMIDI = async () => {
      try {
        const midiAccess = await navigator.requestMIDIAccess();
        const inputs = Array.from(midiAccess.inputs.values());

        inputs.forEach((input) => {
          input.onmidimessage = handleMIDIMessage;
        });
      } catch (error) {
        console.error("MIDIデバイスの初期化に失敗しました:", error);
      }
    };

    // MIDIメッセージを処理する関数
    const handleMIDIMessage = (message) => {
      const [status, noteNumber, velocity] = message.data;

      // ノートオン（鍵盤が押された場合）のみ処理
      if (status === 144 && velocity > 0) {
        const noteName = getNoteName(noteNumber);
        setNotes((prevNotes) => [...prevNotes, noteName]);
      }

      // ノートオフ（鍵盤が離された場合）もしくはVelocity 0
      if (status === 128 || (status === 144 && velocity === 0)) {
        const noteName = getNoteName(noteNumber);
        setNotes((prevNotes) => prevNotes.filter((note) => note !== noteName));
      }
    };

    initializeMIDI();
  }, []);

  return (
    <div>
      <h1>MIDI キーボード音名表示</h1>
      <h2>現在押されている音</h2>
      <ul>
        {notes.length > 0 ? (
          notes.map((note, index) => <li key={index}>{note}</li>)
        ) : (
          <p>音がありません。</p>
        )}
      </ul>
    </div>
  );
}
