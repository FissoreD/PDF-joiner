import React from 'react';
import { render } from 'react-dom';
import { MyBody } from './components/BodyComponent';
import "./components/DropZone";
import './css/index.css';
import './css/spinner.css';

render(
  <React.StrictMode>
    <MyBody />
  </React.StrictMode>,
  document.getElementById("root")
);


// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
// reportWebVitals();
