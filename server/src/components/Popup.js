import React, {useState} from 'react'

function PopUp(props) {
    const [click, setClick] = useState(props.click||true)
    const [color, setColor] = useState(props.color||'')
    const [position, setPosition] = useState(props.position||{})
    const [request, setRequest] = useState(false)


    const handleClick=()=>{
        var event = window.event
        if (event) event.preventDefault()
        var color = document.getElementById("color-selector").value
        let pixel={cell:position,color:color}
        fetch(`${window.location}editPixel`, {
            method: 'post',
            body: JSON.stringify(pixel),
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        })
        .then((result) => {
            setRequest(true)
        }).catch((err) => {
            setRequest(true)
        });
    }

    return (
        <div className="popup" >
            <span className={(props.click)?"popuptext show":"popuptext"}>
                <h1 className="title-popup">COLOR</h1>
                {!request&&<input type='color' value={color} id="color-selector" 
                    onChange={e => setColor(e.target.value)}></input>}
                    <br/>
                {!request&&<button className="button-request" onClick={handleClick}>CAMBIAR</button>}
                {request&&<p className="p-little-text">¡Petición enviada!</p>}
            </span>
        </div>
    )
}

export default PopUp