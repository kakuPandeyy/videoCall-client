import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home/Home";
import Room from "./pages/Room/Room";
import { SocketProvider } from "./context/socketContext";
import { useEffect, useState } from "react";
import OfferList from "./pages/offersList/OfferList";



export default  function App() {



   

   const [availableOffer,setAvailableOffer] = useState([])


   
  
  return (
    <>
  

    <SocketProvider>
 <Router>
      <Routes>
        <Route path="/" element={<Home/>} />
         <Route path="/room/:roomId/:username" element={<Room availableOffer={availableOffer} setAvailableOffer={setAvailableOffer} />} />
       <Route path="/offersList" element={<OfferList setAvailableOffer={setAvailableOffer} availableOffer={availableOffer}/>}/>
      </Routes>
    </Router>
    </SocketProvider>
   
    </>
  );
}


