import React, { useEffect, useState,useRef } from "react";
import type { FormationInput } from "./formationLogic";
import Board from "./Board";
import { createBoard } from "./boardSetup";
import type { Terrain, GameObject, UnitType, Team } from "./types";
import { useGameConnection } from "./hooks/useGameConnection";

type PlacedUnit = {
  id: string;
  name: string;
  x: number;
  y: number;
};

const terrainColor: Record<Terrain, string> = {
    plain: "white",
    wall: "gray",
    block1: "yellow",
    block2: "#ffeeaa",
    tankloard: "blue",
  };

const coreColor: Record<GameObject["type"], string> = {
    coreMain: "red",
    coreSub: "orange",
};

const unitLabel: Record<UnitType, string> = {
    infantry: "小隊",
    raider: "遊撃部隊",
    support: "支援部隊",
    battalion: "大隊",
    supply: "物資部隊",
    tank: "戦車",
};

type Props = {
  northFormation: FormationInput;
  southFormation: FormationInput;
  team: Team;
  connection: ReturnType<typeof useGameConnection>;
  onComplete: (north: FormationInput, south: FormationInput) => void;
  messages: any[];
};

export default function FormationSetupScreen({
  northFormation,
  southFormation,
  team,
  connection,
  onComplete,
  messages,
}: Props) {
  
  const [selectedUnit, setSelectedUnit] = useState<string | null>(null);
  //盤面配置
  const [placedUnits, setPlacedUnits] = useState<PlacedUnit[]>([]);
  const [placedUnitsNorth, setPlacedUnitsNorth] = useState<PlacedUnit[]>([]);
  const [placedUnitsSouth, setPlacedUnitsSouth] = useState<PlacedUnit[]>([]);

  //ready
  const [isReady,setIsReady] = useState(false);
  const [isNorthCorrect, setIsNorthCorrect] = useState(false);

  const board = createBoard();
  // 盤面サイズ
  const cols = 16;
  const rows = 30;
  const cellSize = 20;

  const northRow = 5;
  const southRow = 24;

  const myFormation = team === "north" ? northFormation : southFormation;
  
  const lastMsgIdx = useRef(0);

  function handleMessage(msg: any){
    if(!msg)return;
    switch (msg.type) {
      case "placeCompleteNorth": 
        setPlacedUnitsNorth(msg.placedUnits ?? []);
        setIsNorthCorrect(true);
        break;
      
      case"placeCompleteSouth":
        setPlacedUnitsSouth(msg.placedUnits ?? []);
        break;
      
      case"gameStart":
        applyBothOnComplete();
        break;
      
    }
  }

  useEffect(() => {
    if (messages.length <= 0) return;
  
    const newMsgs = messages.slice(lastMsgIdx.current);
    newMsgs.forEach((msg) => handleMessage(msg));
  
    lastMsgIdx.current = messages.length;
  }, [messages]);
  

  // 配置可能マスクリック
  const handleCellClick = (x: number, y: number) => {
    if(isReady) return;
    if(!selectedUnit) return;
    const deployRow = (team === "north" && y === northRow) || (team === "south" && y === southRow);
    if(!deployRow)return;
    
    const alreadyPlaced = placedUnits.some((p) => p.x === x && p.y === y);
      if(alreadyPlaced){
        alert("このマスは選択不可です");
        return;
      }

    // 同じチームの同じユニットの配置更新
    setPlacedUnits((prev) => {
      const filtered = prev.filter((p) => p.id !== selectedUnit);
      const newPlaced = {
        id: selectedUnit,
        name: `${team}_${selectedUnit}`,
        x,
        y,
      };
      return [...filtered, newPlaced];
    });
  }

  // 配置完了 取り消し
  function handleComplete(){
    setIsReady(true);
    if(team === "north"){
      connection.send({
        type: "placeCompleteNorth",
        placedUnits,
      });
      return;
    }
    connection.send({
      type: "placeCompleteSouth",
      placedUnits,
    });

    connection.send({
      type: "gameStart",
      north: placedUnitsNorth,
      south: placedUnits,
    });
  }
  function applyBothOnComplete() {
    function applyPlacement(
      formation: FormationInput,
      basePlaced: PlacedUnit[]
    ): FormationInput {
      return {
        ...formation,
        assignment: {
          ...formation.assignment,
          positions: basePlaced.map((u) => ({
            id: u.id,
            x: u.x,
            y: u.y,
          })),
        },
      };
    }

    const n = applyPlacement(northFormation, placedUnitsNorth);
    const s = applyPlacement(southFormation, placedUnitsSouth);

    onComplete(n, s);
  }

  
  const showOverlay = (team === "north" && isReady && !isNorthCorrect) || (team === "south" && !isNorthCorrect);

  return (
    <div style={{ padding: 40, textAlign: "center" }}>
      <h1>部隊配置画面</h1>
      <h3>あなたは <b>{team === "north" ? "北陣営" : "南陣営"}</b> です。</h3>
      <p>
        グリーンの行({team === "north" ? northRow + 1 : southRow + 1}行目)に配置できます。
      </p>

      {showOverlay && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width:"100vw",
            height:"100vh",
            background: "rgba(0,0,0,0.6)",
            color: "white",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            fontSize: 24,
            zIndex: 9999,
          }}
        >
          対戦相手が配置中です…
        </div>
      )}



      {/* 盤面 */}
      <div style={{ display: "flex", justifyContent: "center", gap: 20 }}>
        <svg
          width={cols * cellSize}
          height={rows * cellSize}
          style={{ border: "1px solid #444", background: "#fafafa" }}
        >
          {board.map((cell, i) => {
              const isMyRow = (team === "north" && cell.y === northRow) || (team === "south" && cell.y === southRow);
              const unitHere = placedUnits.find((u) => u.x === cell.x && u.y === cell.y);
              const color = unitHere 
                  ? "#1e90ff"
                  : isMyRow
                  ? "rgb(112, 255, 188)"
                  : terrainColor[cell.terrain];

              return (
                <rect
                  key={i}
                  x={cell.x * cellSize}
                  y={cell.y * cellSize}
                  width={cellSize}
                  height={cellSize}
                  fill={color}
                  stroke="#ccc"
                  onClick={() => handleCellClick(cell.x, cell.y)}
                  style={{
                    cursor:
                      isMyRow
                      ? "pointer"
                      : "default",
                  }}
                />
              );
            })
          }
        </svg>

        {/* 部隊リスト */}
          <div
            style={{
              background: "#808080",
              padding: 16,
              borderRadius: 12,
              width: 240,
              textAlign: "left",
              border: "1px solid #ccc",
              color: "white",
            }}
          >
            <h3>{team === "north" ? "北陣営" : "南陣営"} 部隊</h3>
            {Object.entries(myFormation.assignment)
              .filter(([key]) => key !== "supply")
              .map(([type, value]) => {
                //大隊
                if (type === "battalion" && typeof value === "number") {
                    const id = `${team}_battalion_1`;
                    const placed = placedUnits.find((p) => p.id === id);
                    return (
                      <div
                        key={id}
                        onClick={() => setSelectedUnit(id)}
                        style={{
                          margin: "4px 0",
                          padding: "4px 8px",
                          border: "1px solid #ccc",
                          borderRadius: 6,
                          background:
                            selectedUnit === id
                              ? "#add8e6"
                              : placed
                              ? "#d0ffd0"
                              : "black",
                          color: "white",
                          cursor: "pointer",
                        }}
                      >
                        大隊（{value}人）
                        {placed && (
                          <div style={{ fontSize: 12, color: "#fff" }}>
                            → ({placed.x}, {placed.y})
                          </div>
                        )}
                      </div>
                    );
                  }
                //その他
                if (Array.isArray(value)) {
                  return (value as number[]).map((n: number, i: number) =>
                  {
                    const id = `${team}_${type}_${i + 1}`;
                    const placed = placedUnits.find((p) => p.id === id);
                    return (
                      <div
                        key={id}
                        onClick={() => setSelectedUnit(id)}
                        style={{
                          margin: "4px 0",
                          padding: "4px 8px",
                          border: "1px solid #ccc",
                          borderRadius: 6,
                          background:
                            selectedUnit === id
                              ? "#add8e6"
                              : placed
                              ? "#d0ffd0"
                              : "black",
                          color: "white",
                          cursor: "pointer",
                        }}
                      >
                        {unitLabel [type as UnitType]}_{i + 1}（{n}人）
                        {placed && (
                          <div style={{ fontSize: 12, color: "#555" }}>
                            → ({placed.x}, {placed.y})
                          </div>
                        )}
                      </div>
                    );
                  });
                } return null;
              })
              }
          </div>
        
      </div>

      {/* 配置完了 */}
      <div style={{ marginTop: 30}}>
      {!isReady ? (
          <button
            style={{ padding: "10px 20px", fontSize: 18 }}
            onClick={handleComplete}
          >
            ▶︎ 配置完了
          </button>
        ) : (
          <p style={{ marginTop: 10, fontSize: 18 }}>配置完了しました</p>
        )}
      </div>
    </div>
  );
}
