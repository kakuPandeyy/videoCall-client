import React, { useEffect, useState } from 'react'
import { PhoneCall } from 'lucide-react';
import { useSocket } from '../../context/socketContext';
import { useNavigate } from 'react-router-dom';


import "./offer.css"


export default function OfferList({availableOffer,setAvailableOffer}) {

    const mySocketRef = useSocket()
      const navigator = useNavigate()


    useEffect(()=>{

        if (mySocketRef.current===null||!mySocketRef.current) {
         return   navigator("/")
        }

        mySocketRef.current.emit("request-Offers")

        mySocketRef.current.on("updated-offer",(data)=>{
           setAvailableOffer(data)
            console.log(data)
        })
      return ()=>{
              mySocketRef.current.off("updated-offer");
        }
    },[])


    const handleJoin= (roomId)=>{
   const username =  prompt("enter you username") || roomId
 
    navigator(`/room/${roomId}/${username}`)

    }


  return (
    <>
    <div className=' flex justify-center items-center'>

        <h1 className=' absolute top-10 '> JOIN WITH </h1>
          <div className=' grid grid-cols-5 gap-7  '>

          { availableOffer.map((ele,index)=>{

            return(

                  <button onClick={()=>handleJoin(ele.roomId)}  key={index} className='  flex flex-rom gap-3 rounded-4xl glow-btn '> 
       <PhoneCall size={28} color="#28c356" />

       <span className=' text-amber-50 '>{ele.username}</span>
       </button>
            )
    
          })}
   
     
   
   
          </div>

    </div>
    
       
    </>
    
  )
}
