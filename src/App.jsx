import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home/Home";
import Room from "./pages/Room/Room";
export default  function App() {
  return (
    <>
 <Router>
      <Routes>
        <Route path="/" element={<Home/>} />
         <Route path="/room/:roomId/:username" element={<Room />} />
    
      </Routes>
    </Router>
    </>
  );
}


