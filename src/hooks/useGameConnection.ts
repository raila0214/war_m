// src/hooks/useGameConnection.ts
import { useState, useCallback } from "react";
import {nowInSec, uuidV4, SkyWayStreamFactory, SkyWayContext, SkyWayRoom, SkyWayAuthToken } from '@skyway-sdk/room';
import type { LocalDataStream } from '@skyway-sdk/room';


const token = new SkyWayAuthToken({
  jti: uuidV4(),
  iat: nowInSec(),
  exp: nowInSec() + 60 * 60 * 24,
  version: 3,
  scope: {
    appId: "be116a72-5d3d-421e-8f6a-ef5e3c39aa7a",
    rooms: [
      {
        name: "*",
        methods: ["create", "close", "updateMetadata"],
        member: {
          name: "*",
          methods: ["publish", "subscribe", "updateMetadata"],
        },
      },
    ],
  },
}).encode("tM+toH4oSk2ApHEHqbm/RpmgNxDKUbq160B0QQFhdCk=");

export function useGameConnection() {
  const [me, setMe] = useState<any>(null);
  const [dataStream, setDataStream] = useState<LocalDataStream | null>(null);
  const [room, setRoom] = useState<any>(null);
  

  /**  トークン取得とContext初期化 */
  const initContext = useCallback(async () => {
    const context = await SkyWayContext.Create(token);
    return context;
  }, []);

  /**  ルーム参加 */
  
  const joinRoom = useCallback(async (
    roomName: string, 
    displayName: string, 
    receiver: (msg: any) => void
) => {
    const context = await initContext();
    const room = await SkyWayRoom.FindOrCreate(context, {
      type: 'p2p',
      name: roomName,
    });
    setRoom(room);
    const me = await room.join({ metadata: displayName });
    setMe(me);

    //const data:any = await SkyWayStreamFactory.createDataStream();
    //await me.publish(data);
    //setDataStream(data);
    const localStream = await SkyWayStreamFactory.createDataStream();
    await me.publish(localStream);
    setDataStream(localStream);

    room.publications.forEach(async (p) => {
      // 自分のは subscribe しない
      if (p.publisher.id === me.id) return;
      if (p.contentType !== "data") return;
      // すでに subscribe 済みならスキップ
      const already = me.subscriptions.some(sub => sub.publication.id === p.id);
      if (!already) {
        const sub = await me.subscribe(p);
        console.log(p);
        // @ts-ignore
        sub.stream.onData.add((d:any)=>{
          const mesg = JSON.parse(d);
          receiver(mesg);
        });
      }
    });

    room.onStreamPublished.add(async (e) => {
      if (e.publication.publisher.id !== me.id && e.publication.contentType === "data") {
        console.log({new:e.publication.publisher.id, me:me.id});
        const sub = await me.subscribe(e.publication);
        // @ts-ignore
        sub.stream.onData.add((d:any)=>{
          const mesg = JSON.parse(d);
          receiver(mesg);  
        });
      }
    });
    return {
        room,
        members: room.members,
        me,
    };

  }, [initContext]);

  const send = useCallback(
    (msg: any) => {
        if(!dataStream) return;
        try {
            dataStream.write(JSON.stringify(msg));
        } catch (e) {
            console.error(e);
        }
    }, [dataStream]);


  return {
    me,
    room,
    dataStream,
    joinRoom,
    send,
  };
}