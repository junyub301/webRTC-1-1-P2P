import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

function App() {
    const [roomId, setRoomId] = useState<string>("");
    const navigate = useNavigate();
    const onClick = () => {
        if (!roomId) {
            alert("입장할 방 번호를 입력하세요 ");
            return;
        }
        navigate(`/room/${roomId}`);
    };
    return (
        <div className=" w-full h-screen flex justify-center space-x-2 items-center">
            <label>
                방번호:{" "}
                <input
                    className="border py-1"
                    type="text"
                    value={roomId}
                    onChange={(e) => setRoomId(e.currentTarget.value)}
                />
            </label>
            <button
                className="border bg-blue-400 text-white rounded-md py-1 px-5"
                onClick={onClick}
            >
                입장
            </button>
        </div>
    );
}

export default App;
