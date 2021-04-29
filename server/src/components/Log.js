import React,{useState,useEffect}  from 'react';
import io from 'socket.io-client';

function Log() {

    const [val, setVal]=useState(false)
    const [stop, setStop] = useState({})
    const [lines, setLines] = useState([])

    var socket=io('/',{autoConnect: false})

    socket.on('logs',(data)=>{
        let event = window.event
        if(event) event.preventDefault()
        setLines(String(data).split('\n'))
    })

    useEffect(()=>{
        if (!val) {
            socket.connect()
            setVal(true)
        }
    },[stop])


    return(
        <div className="container">
            <h1 className='title-principal'>LOGS</h1>
            <hr/>
            <div id="log">
                {lines.slice(0).reverse().map(element=>{
                    return <p className="p-log" >{element}</p>
                })}
            </div>
        
        </div>
    )
}

export default Log