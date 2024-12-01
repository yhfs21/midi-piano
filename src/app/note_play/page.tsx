'use client';

import { useEffect, useState } from "react";

// ノート番号を音名に変換する関数
const getNoteName = (noteNumber: number) => {
  const notes = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  const octave = Math.floor(noteNumber / 12) - 1; // オクターブを計算
  const note = notes[noteNumber % 12]; // ノート名を計算
  return `${note}${octave}`; // "C4" のような形式で返す
};

// ノート番号を周波数に変換する関数
const noteToFrequency = (noteNumber: number) => {
  const A4 = 440; // A4の周波数
  return A4 * Math.pow(2, (noteNumber - 69) / 12);
};

export default function Home() {
  const [activeNotes, setActiveNotes] = useState<string[]>([]);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [oscillators, setOscillators] = useState<Record<number, OscillatorNode[]>>({});

  // ユーザーのクリックで AudioContext を開始
  const startAudioContext = () => {
    if (!audioContext) {
      const context = new (window.AudioContext || window.webkitAudioContext)();
      context.resume(); // ユーザーのインタラクション後にコンテキストを開始
      setAudioContext(context);
    }
  };

  // ノートを再生
  const playNote = (noteNumber: number) => {
    if (!audioContext) return;

    // オシレーターがすでに存在する場合は再利用しない
    if (oscillators[noteNumber]) return;

    const oscillator = audioContext.createOscillator();
    oscillator.type = 'sine'; // 音の波形
    oscillator.frequency.setValueAtTime(noteToFrequency(noteNumber), audioContext.currentTime);
    oscillator.connect(audioContext.destination);
    oscillator.start();

    // 重複処理しきれずに余分にoscillatorを作成してしまった場合も、
    // アクセスできなくなって削除できなくなるのを防ぐためにoscillatorsに追加する
    setOscillators((prev) => ({ ...prev,  [noteNumber]: [...(prev[noteNumber] || []), oscillator] }));
    console.log("playNote", oscillators);
  };

  // ノートを停止
  const stopNote = (noteNumber: number) => {
    if (oscillators[noteNumber]) {
      // オシレーターを停止
      oscillators[noteNumber].forEach(oscillator => {
        oscillator.stop();
        oscillator.disconnect();
      });
      setOscillators((prev) => {
        const updated = { ...prev };
        delete updated[noteNumber]; // 止めた音を削除
        return updated;
      });
      console.log("stopNote", oscillators);
    }
  };

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

    // const handleMIDIMessage = (message: WebMidi.MIDIMessageEvent) => {
    //   const [status, noteNumber, velocity] = message.data;
    //   const noteName = getNoteName(noteNumber);

    //   setActiveNotes((prevNotes) => {
    //     const updatedNotes = [...prevNotes];

    //     // ノートオン（鍵盤が押された場合）
    //     if (status === 144 && velocity > 0 && !updatedNotes.includes(noteName)) {
    //       updatedNotes.push(noteName);
    //       playNote(noteNumber); // 音を再生
    //     }

    //     // ノートオフ（鍵盤が離された場合）またはVelocity 0
    //     if (status === 128 || (status === 144 && velocity === 0)) {
    //       const index = updatedNotes.indexOf(noteName);
    //       if (index !== -1) {
    //         stopNote(noteNumber); // 音を止める
    //         updatedNotes.splice(index, 1); // 音名を削除
    //       }
    //     }

    //     return updatedNotes;
    //   });
    //   if (status !== 248) {
    //     console.log("handleMIDIMessage", { status, noteNumber, noteName, velocity });
    //     console.log("activeNotes", activeNotes);
    //     console.log("oscillators", oscillators);
    //   }
    // };
    const handleMIDIMessage = (message: WebMidi.MIDIMessageEvent) => {
      const [status, noteNumber, velocity] = message.data;
      const noteName = getNoteName(noteNumber);
    
      setActiveNotes((prevNotes) => {
        const updatedNotes = [...prevNotes];
    
        // ノートオン（鍵盤が押された場合）
        if (status === 144 && velocity > 0 && !updatedNotes.includes(noteName)) {
          updatedNotes.push(noteName);
        }
    
        // ノートオフ（鍵盤が離された場合）またはVelocity 0
        if (status === 128 || (status === 144 && velocity === 0)) {
          const index = updatedNotes.indexOf(noteName);
          if (index !== -1) {
            updatedNotes.splice(index, 1); // 音名を削除
          }
        }
    
        return updatedNotes;
      });

      // ノートオン（鍵盤が押された場合）
      if (status === 144 && velocity > 0) {
        playNote(noteNumber); // 音を再生
      }
  
      // ノートオフ（鍵盤が離された場合）またはVelocity 0
      if (status === 128 || (status === 144 && velocity === 0)) {
        stopNote(noteNumber); // 音を止める
      }
    
      // ログを出力してデバッグ
      if (status !== 248) {
        console.log("handleMIDIMessage", { status, noteNumber, noteName, velocity });
        console.log("activeNotes", activeNotes);
        console.log("oscillators", oscillators);
      }
    };
    
    initializeMIDI();
  }, [audioContext, oscillators]);

  return (
    <div>
      {/* ユーザーがページをクリックすることでAudioContextを開始 */}
      <div onClick={startAudioContext} style={{ padding: "10px", border: "1px solid black" }}>
        クリックしてAudioContextを開始
      </div>
      <h1>MIDI キーボード音名表示</h1>
      <h2>現在押されている音</h2>
      <ul>
        {activeNotes.length > 0 ? (
          activeNotes.map((note, index) => <li key={index}>{note}</li>)
        ) : (
          <p>音がありません。</p>
        )}
      </ul>
    </div>
  );
}
