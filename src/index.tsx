import { render } from 'react-dom';
import React from 'react';
import './css/index.css';
import './css/spinner.css'
import { MyBody } from './components/BodyComponent';
import "./components/DropZone";

render(
  <React.StrictMode>
    <MyBody />
    <div className="lds-roller"><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div></div>
  </React.StrictMode>,
  document.getElementById("root")
);


// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
// reportWebVitals();
