import React from 'react'
import PixelArt from './PixelArt'
import Log from './Log'
import Navbar from './Navbar'
import {
    BrowserRouter as Router,
    Switch,
    Route
} from "react-router-dom";

function App(props) {
    
    return (
        <div className="app">
            <Router>
                <Navbar></Navbar>
                <br></br>
                <Switch>
                    <Route  path="/logs">
                        <Log/>
                    </Route>
                    <Route  path="/">
                        <PixelArt/>
                    </Route>
                    
                </Switch>
            </Router>
        </div>
    )
}

export default App