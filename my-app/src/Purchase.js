 import { useState } from "react";
 import React from 'react';

 class Purchase extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      activeTab: "Purchase"
    };
  }

  render() {
    const { purchase, handleEdit } = this.props;

    if (!purchase || !Array.isArray(purchase)) {
      return <p>Loading...</p>;
    }

    

    return (
      <div className='purchase'>
        

         <h2>Welcome to Purchase</h2>
      </div>
    );
  }
}

export default Purchase;
        