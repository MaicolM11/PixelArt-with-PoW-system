import React,{useState} from 'react'
import PopUp from './Popup'

function Pixel(props) {

    const [position, setPosition] = useState(props.position||{})
    const [color, setColor] = useState(props.color||'white')
    const [click, setClick] = useState(false)

    const handleClick=()=>{
        setClick(!click)
    }

    

    

    return (
        <th onDoubleClick={handleClick} style= {
            {
                backgroundColor:color,padding:0,margin:0,
                width:'2rem',
                height:'5rem',
                border:(click)?'2px solid black':'1px solid black',
                boxShadow:(click)?'0.2px 0.2px 5px 3px red':null
            }
            }
        >
            {click&&<PopUp click={click} color={color} position={position}></PopUp>}
        </th>
    )
}

export default Pixel