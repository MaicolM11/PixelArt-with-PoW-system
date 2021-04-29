
import React from 'react';
import {Link} from "react-router-dom"

function Navbar() {
    

    return(
        <ul className="menu-bar">
                <li >
                    <Link to="/" className="menu-item">
                        PIXELART
                    </Link>
                    <Link to="/logs" className="menu-item">
                        LOGS
                    </Link>
                </li>
                <hr/>
            </ul>
    )
}

export default Navbar