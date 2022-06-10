import React from "react";

export let imgCreator = (a: { src: string, action: () => void, tooltip?: string }) =>
  (<img src={a.src} alt={a.src} className="logo" onClick={a.action} data-tip={a.tooltip}></img>);

export let loadingSpinner = () => <div className="lds-roller"><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div></div>