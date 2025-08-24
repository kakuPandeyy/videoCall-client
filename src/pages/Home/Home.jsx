import { useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";


export default function Home() {
  const navigate = useNavigate();

  const createRoom = () => {
    const id = uuidv4();
    const username = prompt("enter username")
    navigate(`/room/${id}/${username}`);
  };

  const joinRoom = () => {
    const roomId = prompt("Enter room ID:");
    const username = prompt("create you username")
    if (roomId) navigate(`/room/${roomId}/${username}`);
  };

  return (
    <div>
      <h1 className="mb-10">Video Call App</h1>
      <div className=" flex flex-row justify-center gap-7">
      <button onClick={createRoom}>Create Room</button>
      <button onClick={joinRoom}>Join Room</button>
      </div>

    </div>
  );
}
