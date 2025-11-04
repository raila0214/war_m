import {useState}  from "react";
import { Button, TextField, Stack } from "@mui/material";
import { useGameConnection } from "./hooks/useGameConnection";

type Props = {
    onJoined: (params: {
        roomName: string;
        nickName: string;
        team: "north" | "south";
        connection: ReturnType<typeof useGameConnection>;
    }) => void;
    receiver: (msg: any) => void;
};

export default function JoinRoomScreen({ onJoined }: Props) {
    const [roomName, setRoomName] = useState("");
    const [nickName, setNickName] = useState("");
    const [error, setError] = useState<string | null>(null);
    const connection = useGameConnection();

    function receiver(msg: string){
        console.log(msg);
    }


    async function handleJoin() {
        setError(null);
        if(!roomName || !nickName){
            setError("ルーム名・ニックネームを入力してください");
            return;
        }
        try {
            const state = await connection.joinRoom (roomName,nickName,receiver);
            const playerCount = state.members.length;
            let team: "north" | "south";
            if(playerCount === 1){
                team = "north";
            } else if (playerCount === 2){
                team = "south";
            } else {
                setError("すでに2人のプレイヤーが参加しています");
                return;
            }
            onJoined({ roomName, nickName, team, connection });
        } catch (e) {
            console.error(e);
            setError("接続失敗");
        }
    }
    
    return (
    <div
      style={{
        width: 400,
        margin: "50px auto",
        padding: 20,
        border: "1px solid #ccc",
        borderRadius: 10,
        background: "#f9f9f9",
      }}
    >
      <h2>ゲームに参加</h2>
      <Stack spacing={2}>
        <TextField
          label="ルーム名"
          value={roomName}
          onChange={(e) => setRoomName(e.target.value)}
        />
        <TextField
          label="ニックネーム"
          value={nickName}
          onChange={(e) => setNickName(e.target.value)}
        />

        {error && <p style={{ color: "red" }}>{error}</p>}

        <Button variant="contained" onClick={handleJoin}>
          入室
        </Button>
      </Stack>
    </div>
    );
}

