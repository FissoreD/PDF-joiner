import React from "react"

export let imgCreator = (a: { src: string, action: () => void }) =>
  (<img src={a.src} alt={a.src} className="logo" onClick={a.action}></img>)