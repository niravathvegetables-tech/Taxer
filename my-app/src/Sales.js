 import { useState } from "react";
 import React from 'react';

 class Sales extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      activeTab: "Sales"
    };
  }

  render() {
    const { sales, handleEdit } = this.props;

    if (!sales || !Array.isArray(sales)) {
      return <p>Loading...</p>;
    }

    

    return (
      <div className='sales'>
        

         <h2>Welcome to Sales</h2>
      </div>
    );
  }
}

export default Sales;
        