'use client';

import { useEffect, useState } from "react";

export default function Home() {
  const [midiDevices, setMidiDevices] = useState([]);

  useEffect(() => {
    // MIDIデバイスを取得する関数
    const initializeMIDI = async () => {
      try {
        // MIDIアクセスを取得
        const midiAccess = await navigator.requestMIDIAccess();

        // 入力デバイスを取得
        const inputs = Array.from(midiAccess.inputs.values());

        // デバイス情報を保存
        setMidiDevices(inputs);

        // イベントリスナーを設定
        inputs.forEach(input => {
          input.onmidimessage = handleMIDIMessage;
        });
      } catch (error) {
        console.error("MIDIデバイスの初期化に失敗しました:", error);
      }
    };

    // MIDIメッセージを処理する関数
    const handleMIDIMessage = (message) => {
      const [status, data1, data2] = message.data;
      console.log("MIDIメッセージ受信:", { status, data1, data2 });
    };

    initializeMIDI();
  }, []);

  return (
    <div>
      <h1>MIDIキーボード認識アプリ</h1>
      <h2>接続されたMIDIデバイス</h2>
      <ul>
        {midiDevices.length > 0 ? (
          midiDevices.map((device, index) => (
            <li key={index}>{device.name}</li>
          ))
        ) : (
          <p>デバイスが見つかりません。</p>
        )}
      </ul>
    </div>
  );
}
