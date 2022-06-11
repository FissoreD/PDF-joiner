import React from "react";

export let imgCreator = (a: { src: string, action: () => void, tooltip?: string, isSendIcon?: boolean }) =>
  (<img src={a.src} alt={a.src} className={"logo " + (a.isSendIcon ? "send-icon" : "")} onClick={a.action} data-tip={a.tooltip}></img>);

export let loadingSpinner = () => <div className="lds-roller"><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div></div>