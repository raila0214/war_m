import { useState } from "react";
import JoinRoomScreen from "./JoinRoomScreen";
import TeamSetupScreen from "./TeamSetupScreen";
import FormationSetupScreen from "./FormationSetupScreen";
import GameScreen from "./GameScreen";
import type { FormationInput } from "./formationLogic";
import { useGameConnection } from "./hooks/useGameConnection";

export default function App() {
  const [page, setPage] = useState<"join" |"setup" | "formation" | "game">("join");
  const [connection, setConnection] = useState<ReturnType<typeof useGameConnection> | null > (null);
  const [team, setTeam] = useState<"north" | "south" | null>(null);
  const [roomName, setRoomName] = useState("");
  const [nickName, setNickName] = useState("");
  const [northFormation, setNorthFormation] = useState<FormationInput | null>(null);
  const [southFormation, setSouthFormation] = useState<FormationInput | null>(null);

  function handleJoined({
    team,
    roomName,
    nickName,
    connection,
  }:{
    team: "north" | "south";
    roomName: string;
    nickName: string;
    connection: ReturnType<typeof useGameConnection>;
  }) {
    setTeam(team);
    setRoomName(roomName);
    setNickName(nickName);
    setConnection(connection);
    setPage("setup");
  }

  // === 部隊編成完了時 ===
  const handleSetupComplete = (north: FormationInput, south: FormationInput) => {
    setNorthFormation(north);
    setSouthFormation(south);
    setPage("formation");
  };

  // === 配置完了時 ===
  const handleFormationComplete = (
    placedNorth: FormationInput,
    placedSouth: FormationInput
  ) => {
    setNorthFormation(placedNorth);
    setSouthFormation(placedSouth);
    setPage("game");
  };
  if (page === "join"){
    return <JoinRoomScreen onJoined={handleJoined} />;
  }

  if (page === "setup" && team && connection) {
    return <TeamSetupScreen 
    team={team}
    connection = {connection}
    onComplete={handleSetupComplete} 
    />;
  }

  if (page === "formation" && team && connection && northFormation && southFormation) {
    return (
      <FormationSetupScreen
        team={team}
        connection={connection}
        northFormation={northFormation}
        southFormation={southFormation}
        onComplete={handleFormationComplete}
      />
    );
  }

  if (page === "game"&& team && connection && northFormation && southFormation) {
    return (
      <GameScreen
        team={team}
        connection={connection}
        northFormation={northFormation}
        southFormation={southFormation}
        roomName={roomName}
        nickName={nickName}
      />
    );
  }

  return null;
}
