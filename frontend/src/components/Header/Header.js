import React from "react";

import "./Header.css";

const Header = (props) => (
  <header className="main-header">
    {props.children}
  </header>
);

export default Header;
