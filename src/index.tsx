import { render } from 'react-dom';
import React from 'react';
import './index.css';
import { MyBody } from './components/BodyComponent';
import "./components/DropZone";

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
