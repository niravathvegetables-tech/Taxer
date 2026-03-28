 import { useState } from "react";
 import React from 'react';

 class Contra extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      activeTab: "Contra"
    };
  }

  render() {
    const { contra, handleEdit } = this.props;

    if (!contra || !Array.isArray(contra)) {
      return <p>Loading...</p>;
    }

    

    return (
      <div className='contra'>
        

         <h2>Welcome to Contra</h2>

      </div>
    );
  }
}

export default Contra;
        