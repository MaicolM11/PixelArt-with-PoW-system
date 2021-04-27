import React,{useState,useEffect} from 'react'
import Pixel from './Pixel'
import io from 'socket.io-client'

function PixelArt(props) {
    
    const [val, setVal]=useState(false)
    const [pixels, setPixels] = useState([[]])
    const [url, setUrl] = useState('')

    const handleDownload=()=>{
        var location=window.location
        window.open(`${location}certificate`)
        window.open(`${location}image`)
    }

    const handleCertifcate=()=>{
        
    }

    var socket=io('/', {autoConnect: false})

    const cancelFile=()=>{
        setUrl('')
    }

    useEffect(()=>{
        if (!val) {
            socket.connect()
            setVal(true)
        }
    },[stop])

    socket.on('image',(data)=>{
        var matrix = JSON.parse(JSON.stringify(data))
        setPixels(matrix)
    })

    socket.on('response',(data)=>{
        if (data=='true') alert('Petición aceptada')
        else alert('No fue aceptado')
    })

    return (
        <div className="container">
            <h1 className='title-principal'>PIXEL ART</h1>
            <p className="p-text">Dale doble click sobre un pixel para mostrar u ocultar las opciones de ese pixel</p>
            <table id="pixel" className="pixelart">
            
                {pixels.map((row,i)=>{
                    return ( <tr>
                        {row.map((column,j)=>{
                            var a={x:i,y:j}
                            return(<Pixel position={a} color={(pixels[i][j])?pixels[i][j].color:'#ffffff'}></Pixel>)
                        })}
                    </tr>)
                })}
            </table>
            <button onClick={handleDownload} className="button-download">
                <img src="img/download.png"  className="img-btn"></img>
                DESCARGAR
            </button><br/><hr/>
            <h1 className="title-principal">COMPROBAR  ARCHIVO</h1>
            {!url&&<p className="p-text">Sube un archivo para comprobarlo</p>}
            {!url&&<input type="file" className="input-file" onChange={e=>{setUrl(e.target.value)}}></input>}
            {url&&<div><p className='p-file'>¡ARHIVO CARGADO!</p><button className="button-confirm">COMPROBAR</button><button onClick={cancelFile} className="button-cancel">CANCELAR</button></div>}
        </div>
    )
}

export default PixelArt