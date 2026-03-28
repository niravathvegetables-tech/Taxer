 import { useState } from "react";
 import React from 'react';

 class Receipt extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      activeTab: "Receipt"
    };
  }

  render() {
    const { receipt, handleEdit } = this.props;

    if (!receipt || !Array.isArray(receipt)) {
      return <p>Loading...</p>;
    }

    

    return (
      <div className='receipt'>
        

         <h2>Welcome to Receipt</h2>

      </div>
    );
  }
}

export default Receipt;
        